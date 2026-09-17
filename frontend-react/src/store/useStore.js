import { create } from "zustand";
import { api, getSenha, setSenha } from "../api";

const LOCAL_KEYS = {
  produtos: "agropad_produtos",
  obs: "agropad_obs_pedidos",
  despesas: "agropad_despesas",
};
const TTL_CACHE_MS = 30_000;

function listarProdutosLocal() {
  return JSON.parse(localStorage.getItem(LOCAL_KEYS.produtos)) || [];
}

function salvarProdutosLocal(produtos) {
  localStorage.setItem(LOCAL_KEYS.produtos, JSON.stringify(produtos));
}

function listarDespesasLocal() {
  return JSON.parse(localStorage.getItem(LOCAL_KEYS.despesas)) || [];
}

function salvarDespesasLocal(despesas) {
  localStorage.setItem(LOCAL_KEYS.despesas, JSON.stringify(despesas));
}

function obterObsMap() {
  return JSON.parse(localStorage.getItem(LOCAL_KEYS.obs)) || {};
}

function salvarObsLocal(idPedido, texto) {
  const map = obterObsMap();
  if (texto) map[idPedido] = texto;
  else delete map[idPedido];
  localStorage.setItem(LOCAL_KEYS.obs, JSON.stringify(map));
}

export const useStore = create((set, get) => ({
  // Estado
  clientes: [],
  pedidos: [],
  itens: [],
  produtos: listarProdutosLocal(),
  despesas: listarDespesasLocal(),
  obsMap: obterObsMap(),
  carregando: false,
  ultimaCarga: 0,
  senha: getSenha(),
  toast: null,
  toastTimer: null,

  // Toast
  mostrarToast: (msg) => {
    const { toastTimer } = get();
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => set({ toast: null, toastTimer: null }), 2500);
    set({ toast: msg, toastTimer: timer });
  },

  // Senha e Sessão
  definirSenha: (s) => {
    setSenha(s);
    set({ senha: s || null });
  },

  deslogar: () => {
    setSenha(null);
    set({ senha: null, clientes: [], pedidos: [], itens: [], ultimaCarga: 0 });
  },

  // Carregar dados da API
  carregarDados: async (forcar = false) => {
    const { ultimaCarga, carregando, senha } = get();
    if (!senha) return;
    if (!forcar && Date.now() - ultimaCarga < TTL_CACHE_MS) return;
    if (carregando) return;
    set({ carregando: true });
    try {
      const [clientes, pedidos, itens] = await Promise.all([
        api.listarClientes(),
        api.listarPedidos(),
        api.listarItens(),
      ]);
      set({ clientes, pedidos, itens, ultimaCarga: Date.now() });
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes("401")) {
        get().deslogar();
        get().mostrarToast("🔒 Senha inválida ou expirada. Por favor, acesse novamente.");
      } else {
        get().mostrarToast("⚠️ Não foi possível conectar à API. Tentando novamente...");
      }
      throw err;
    } finally {
      set({ carregando: false });
    }
  },

  // Pedidos completos (join de pedido + cliente + itens)
  pedidosCompletos: () => {
    const { pedidos, clientes, itens, obsMap } = get();
    return pedidos.map((p) => {
      const cliente = clientes.find((c) => c.id_cliente === p.id_cliente);
      const itensPedido = itens
        .filter((i) => i.id_pedido === p.id_pedido)
        .map((i) => ({ ...i, subtotal: i.quantidade * i.preco_unitario }));
      const total = itensPedido.reduce((acc, i) => acc + i.subtotal, 0);
      return {
        id: p.id_pedido,
        id_cliente: p.id_cliente,
        cliente: cliente?.nome || "Cliente removido",
        telefone: cliente?.telefone || "",
        data: p.data_pedido,
        pago: p.pago,
        obs: obsMap[p.id_pedido] || "",
        itens: itensPedido,
        total,
      };
    });
  },

  // Produtos locais
  listarProdutos: () => get().produtos,

  salvarProduto: (produto) => {
    const produtos = get().produtos;
    const idx = produtos.findIndex((p) => p.id === produto.id);
    let novos;
    if (idx >= 0) {
      novos = [...produtos];
      novos[idx] = produto;
    } else {
      novos = [...produtos, { ...produto, id: crypto.randomUUID() }];
    }
    salvarProdutosLocal(novos);
    set({ produtos: novos });
  },

  excluirProduto: (id) => {
    const novos = get().produtos.filter((p) => p.id !== id);
    salvarProdutosLocal(novos);
    set({ produtos: novos });
  },

  // Obs locais
  salvarObs: (idPedido, texto) => {
    salvarObsLocal(idPedido, texto);
    set({ obsMap: obterObsMap() });
  },

  // Encontrar ou criar cliente
  encontrarOuCriarCliente: async (nome, telefone) => {
    const { clientes } = get();
    const existente = clientes.find(
      (c) => c.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );
    if (existente) {
      if (telefone && telefone !== existente.telefone) {
        await api.atualizarCliente(existente.id_cliente, { nome: existente.nome, telefone });
      }
      return existente.id_cliente;
    }
    const criado = await api.criarCliente({ nome, telefone: telefone || "" });
    const novoCliente = Array.isArray(criado) ? criado[0] : criado;
    return novoCliente.id_cliente;
  },

  // Despesas / Compras de mercadoria
  listarDespesas: () => get().despesas,

  salvarDespesa: (despesa) => {
    const despesas = get().despesas;
    const idx = despesas.findIndex((d) => d.id === despesa.id);
    let novas;
    if (idx >= 0) {
      novas = [...despesas];
      novas[idx] = despesa;
    } else {
      novas = [
        {
          ...despesa,
          id: despesa.id || crypto.randomUUID(),
          data: despesa.data || new Date().toISOString().slice(0, 10),
        },
        ...despesas,
      ];
    }
    salvarDespesasLocal(novas);
    set({ despesas: novas });
  },

  excluirDespesa: (id) => {
    const novas = get().despesas.filter((d) => d.id !== id);
    salvarDespesasLocal(novas);
    set({ despesas: novas });
  },

  // Marcar múltiplos pedidos como pagos de uma vez
  marcarPedidosComoPagos: async (pedidosIds) => {
    const { pedidos, carregarDados } = get();
    for (const id of pedidosIds) {
      const ped = pedidos.find((p) => p.id_pedido === id);
      if (ped && !ped.pago) {
        await api.atualizarPedido(id, {
          id_cliente: ped.id_cliente,
          data_pedido: ped.data_pedido,
          pago: true,
        });
      }
    }
    await carregarDados(true);
  },

  // Backup
  exportarBackup: async () => {
    const { clientes, pedidos, itens } = get();
    const dados = {
      clientes,
      pedidos,
      itens,
      produtosLocais: listarProdutosLocal(),
      despesasLocais: listarDespesasLocal(),
      obsLocais: obterObsMap(),
      exportadoEm: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const hoje = new Date().toISOString().slice(0, 10);
    a.download = `agropad-backup-${hoje}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  restaurarBackup: (dados) => {
    if (dados.produtosLocais) {
      salvarProdutosLocal(dados.produtosLocais);
      set({ produtos: dados.produtosLocais });
    }
    if (dados.despesasLocais) {
      salvarDespesasLocal(dados.despesasLocais);
      set({ despesas: dados.despesasLocais });
    }
    if (dados.obsLocais) {
      localStorage.setItem(LOCAL_KEYS.obs, JSON.stringify(dados.obsLocais));
      set({ obsMap: dados.obsLocais });
    }
  },

  apagarTudo: async () => {
    const { clientes, pedidos, itens } = get();
    for (const item of itens) await api.deletarItem(item.id_item_pedido);
    for (const pedido of pedidos) await api.deletarPedido(pedido.id_pedido);
    for (const cliente of clientes) await api.deletarCliente(cliente.id_cliente);
    localStorage.removeItem(LOCAL_KEYS.produtos);
    localStorage.removeItem(LOCAL_KEYS.despesas);
    localStorage.removeItem(LOCAL_KEYS.obs);
    set({ clientes: [], pedidos: [], itens: [], produtos: [], despesas: [], obsMap: {}, ultimaCarga: 0 });
  },
}));
