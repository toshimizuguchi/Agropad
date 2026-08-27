/* ============================================================
   AgroPad - app.js
   Integrado com a API real (FastAPI + Supabase):
     GET/POST/PUT/DELETE  /clientes/
     GET/POST/PUT/DELETE  /pedidos/
     GET/POST/PUT/DELETE  /itens_pedidos/

   OBS: a API não tem tabela de "produtos" (catálogo com preço) nem
   campo de "observação" no pedido. Esses dois pontos continuam
   guardados no localStorage do navegador (não sincronizam entre
   aparelhos). Tudo o mais (clientes, pedidos, itens) vem do backend.
   ============================================================ */

const API_BASE_URL = "https://agropad.onrender.com";

let SENHA = localStorage.getItem("agropad_senha_api");
if(!SENHA){
  SENHA = prompt("Digite a senha da API:");
  if(SENHA){
    localStorage.setItem("agropad_senha_api", SENHA);
  } else {
    alert("Senha não fornecida. A aplicação não funcionará corretamente.");
  }
}

// ---------------- Utils ----------------
function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarCaixas(valor) {
  return (valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatarDataBR(isoDate) {
  if (!isoDate) return "";
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function hojeISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------- Chamadas à API ----------------
async function apiFetch(path, options) {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", "x-api-key": SENHA },
    ...options,
  });
  if (!resp.ok) {
    const texto = await resp.text().catch(() => "");
    throw new Error(`Erro ${resp.status} em ${path}: ${texto}`);
  }
  return resp.json();
}

const api = {
  listarClientes: () => apiFetch("/clientes/"),
  criarCliente: (cliente) => apiFetch("/clientes/", { method: "POST", body: JSON.stringify(cliente) }),
  atualizarCliente: (id, cliente) => apiFetch(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(cliente) }),
  deletarCliente: (id) => apiFetch(`/clientes/${id}`, { method: "DELETE" }),

  listarPedidos: () => apiFetch("/pedidos/"),
  criarPedido: (pedido) => apiFetch("/pedidos/", { method: "POST", body: JSON.stringify(pedido) }),
  atualizarPedido: (id, pedido) => apiFetch(`/pedidos/${id}`, { method: "PUT", body: JSON.stringify(pedido) }),
  deletarPedido: (id) => apiFetch(`/pedidos/${id}`, { method: "DELETE" }),

  listarItens: () => apiFetch("/itens_pedidos/"),
  criarItem: (item) => apiFetch("/itens_pedidos/", { method: "POST", body: JSON.stringify(item) }),
  atualizarItem: (id, item) => apiFetch(`/itens_pedidos/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  deletarItem: (id) => apiFetch(`/itens_pedidos/${id}`, { method: "DELETE" }),
};

// ---------------- Dados locais (produtos = catálogo, obs = observações) ----------------
const LOCAL_KEYS = { produtos: "agropad_produtos", obs: "agropad_obs_pedidos" };

function listarProdutosLocal() {
  return JSON.parse(localStorage.getItem(LOCAL_KEYS.produtos)) || [];
}
function salvarProdutosLocal(produtos) {
  localStorage.setItem(LOCAL_KEYS.produtos, JSON.stringify(produtos));
}
function obterObsMap() {
  return JSON.parse(localStorage.getItem(LOCAL_KEYS.obs)) || {};
}
function salvarObsPedido(idPedido, texto) {
  const map = obterObsMap();
  if (texto) map[idPedido] = texto; else delete map[idPedido];
  localStorage.setItem(LOCAL_KEYS.obs, JSON.stringify(map));
}

// ---------------- Cache em memória (recarregado a cada tela) ----------------
let cache = { clientes: [], pedidos: [], itens: [] };
let carregando = false;

async function carregarDados() {
  carregando = true;
  try {
    const [clientes, pedidos, itens] = await Promise.all([
      api.listarClientes(),
      api.listarPedidos(),
      api.listarItens(),
    ]);
    cache = { clientes, pedidos, itens };
  } catch (err) {
    console.error(err);
    mostrarToast("⚠️ Não foi possível conectar à API. Tentando novamente...");
    throw err;
  } finally {
    carregando = false;
  }
}

// Junta pedido + cliente + itens num objeto único, fácil de usar na UI
function pedidosCompletos() {
  const obsMap = obterObsMap();
  return cache.pedidos.map(p => {
    const cliente = cache.clientes.find(c => c.id_cliente === p.id_cliente);
    const itens = cache.itens
      .filter(i => i.id_pedido === p.id_pedido)
      .map(i => ({ ...i, subtotal: i.quantidade * i.preco_unitario }));
    const total = itens.reduce((acc, i) => acc + i.subtotal, 0);
    return {
      id: p.id_pedido,
      id_cliente: p.id_cliente,
      cliente: cliente?.nome || "Cliente removido",
      telefone: cliente?.telefone || "",
      data: p.data_pedido,
      pago: p.pago,
      obs: obsMap[p.id_pedido] || "",
      itens,
      total,
    };
  });
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function mostrarSecao(secaoId) {
  document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active"));
  const alvo = document.getElementById(secaoId);
  if (alvo) alvo.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === secaoId);
  });

  if (secaoId === "section-painel") refrescarEExecutar(renderPainel);
  if (secaoId === "section-pedidos") refrescarEExecutar(renderListaPedidos);
  if (secaoId === "section-produtos") renderListaProdutos();
  if (secaoId === "section-novo-pedido" && !document.getElementById("edit-pedido-id").value) {
    resetFormPedido();
  }
}

async function refrescarEExecutar(renderFn) {
  try {
    await carregarDados();
    renderFn();
  } catch {
    // erro já mostrado via toast; deixa a tela como estava
  }
}

function initNavegacao() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => mostrarSecao(btn.dataset.target));
  });
}

// ============================================================
// PRODUTOS (catálogo local - preço por caixa)
// ============================================================
function renderListaProdutos() {
  const produtos = listarProdutosLocal();
  const container = document.getElementById("products-list");

  container.innerHTML = produtos.length === 0
    ? `<div class="empty-state"><p>Nenhum produto cadastrado ainda.</p></div>`
    : produtos.map(p => `
      <div class="product-item">
        <div class="product-info">
          <span class="product-name">${escapeHtml(p.nome)}</span>
          <span class="product-price">${formatarMoeda(p.preco)} / caixa · ${formatarMoeda(p.preco / 2)} / meia caixa${p.precoKg ? ` · ${formatarMoeda(p.precoKg)} / kg` : ""}</span>
        </div>
        <div class="product-actions">
          <button class="btn-icon-only" data-action="editar-produto" data-id="${p.id}" title="Editar">✏️</button>
          <button class="btn-icon-only" data-action="excluir-produto" data-id="${p.id}" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join("");

  atualizarSelectsProduto();
}

function atualizarSelectsProduto() {
  const produtos = listarProdutosLocal();
  document.querySelectorAll(".select-produto-item").forEach(select => {
    const atual = select.value;
    select.innerHTML = `<option value="">Selecione...</option>` +
      produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${formatarMoeda(p.preco)})</option>`).join("");
    if (atual) select.value = atual;
  });
}

function resetFormProduto() {
  document.getElementById("form-produto").reset();
  document.getElementById("edit-produto-id").value = "";
  document.getElementById("btn-salvar-produto").textContent = "Salvar Produto";
  document.getElementById("btn-cancelar-produto").classList.add("hidden");
}

function initProdutos() {
  document.getElementById("form-produto").addEventListener("submit", () => {
    const nome = document.getElementById("prod-nome").value.trim();
    const preco = parseFloat(document.getElementById("prod-preco").value);
    const precoKgRaw = document.getElementById("prod-preco-kg").value;
    const precoKg = precoKgRaw === "" ? null : parseFloat(precoKgRaw);
    if (!nome || isNaN(preco)) return;

    const idEdicao = document.getElementById("edit-produto-id").value;
    const produtos = listarProdutosLocal();
    if (idEdicao) {
      const idx = produtos.findIndex(p => p.id === idEdicao);
      if (idx >= 0) produtos[idx] = { ...produtos[idx], nome, preco, precoKg };
    } else {
      produtos.push({ id: crypto.randomUUID(), nome, preco, precoKg });
    }
    salvarProdutosLocal(produtos);
    resetFormProduto();
    renderListaProdutos();
    mostrarToast(idEdicao ? "Produto atualizado! ✅" : "Produto cadastrado! ✅");
  });

  document.getElementById("btn-cancelar-produto").addEventListener("click", resetFormProduto);

  document.getElementById("products-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === "editar-produto") {
      const p = listarProdutosLocal().find(x => x.id === id);
      if (!p) return;
      document.getElementById("edit-produto-id").value = p.id;
      document.getElementById("prod-nome").value = p.nome;
      document.getElementById("prod-preco").value = p.preco;
      document.getElementById("prod-preco-kg").value = p.precoKg ?? "";
      document.getElementById("btn-salvar-produto").textContent = "Atualizar Produto";
      document.getElementById("btn-cancelar-produto").classList.remove("hidden");
      document.getElementById("prod-nome").focus();
    }

    if (btn.dataset.action === "excluir-produto") {
      if (confirm("Excluir este produto?")) {
        salvarProdutosLocal(listarProdutosLocal().filter(p => p.id !== id));
        renderListaProdutos();
        mostrarToast("Produto excluído.");
      }
    }
  });
}

// ============================================================
// NOVO PEDIDO / ITENS
// ============================================================
function criarLinhaItem(itemExistente) {
  const row = document.createElement("div");
  row.className = "order-item-row";
  row.innerHTML = `
    <div class="item-row-top">
      <select class="select-produto-item"></select>
      <select class="select-unidade-item">
        <option value="caixa">Caixa</option>
        <option value="meia_caixa">Meia caixa</option>
        <option value="kg">Kg</option>
      </select>
      <button type="button" class="btn-remove-item" title="Remover">×</button>
    </div>
    <div class="item-row-bottom">
      <div class="item-field">
        <label class="label-qtd-item">Qtd (caixas)</label>
        <input type="number" class="input-qtd-item" min="1" step="1" value="${itemExistente?.quantidade || 1}">
      </div>
      <div class="item-field">
        <label>Preço/un.</label>
        <input type="number" class="input-preco-item" min="0" step="0.01" value="${itemExistente?.preco_unitario ?? ""}">
      </div>
    </div>
    <div class="item-subtotal">Subtotal: R$ 0,00</div>
  `;
  document.getElementById("order-items-list").appendChild(row);
  atualizarSelectsProduto();

  if (itemExistente) {
    // O nome pode vir com sufixo de unidade, ex: "Chuchu - meia caixa" ou "Chuchu - kg"
    const { nomeBase, unidade } = extrairUnidadeDoNome(itemExistente.produto || "");
    const produtoLocal = listarProdutosLocal().find(p => p.nome === nomeBase);
    if (produtoLocal) row.querySelector(".select-produto-item").value = produtoLocal.id;
    row.querySelector(".select-unidade-item").value = unidade;
    row.dataset.idItemPedido = itemExistente.id_item_pedido || "";
    row.dataset.produtoNome = nomeBase || "";
  }

  atualizarLabelQtdELimites(row);
  recalcularSubtotalLinha(row);
  return row;
}

// Extrai o nome base do produto e a unidade a partir do texto salvo no pedido
function extrairUnidadeDoNome(textoProduto) {
  if (textoProduto.endsWith(" - meia caixa")) {
    return { nomeBase: textoProduto.replace(" - meia caixa", ""), unidade: "meia_caixa" };
  }
  if (textoProduto.endsWith(" - kg")) {
    return { nomeBase: textoProduto.replace(" - kg", ""), unidade: "kg" };
  }
  return { nomeBase: textoProduto, unidade: "caixa" };
}

// Calcula o preço unitário conforme o produto selecionado e a unidade escolhida
function precoPorUnidade(produtoLocal, unidade) {
  if (!produtoLocal) return null;
  if (unidade === "caixa") return produtoLocal.preco;
  if (unidade === "meia_caixa") return produtoLocal.preco / 2;
  if (unidade === "kg") return produtoLocal.precoKg ?? null;
  return null;
}

// Ajusta o rótulo do campo de quantidade e o step do input conforme a unidade
function atualizarLabelQtdELimites(row) {
  const unidade = row.querySelector(".select-unidade-item").value;
  const label = row.querySelector(".label-qtd-item");
  const inputQtd = row.querySelector(".input-qtd-item");
  if (unidade === "caixa") {
    label.textContent = "Qtd (caixas)";
    inputQtd.step = "1";
    inputQtd.min = "1";
  } else if (unidade === "meia_caixa") {
    label.textContent = "Qtd (meias caixas)";
    inputQtd.step = "1";
    inputQtd.min = "1";
  } else {
    label.textContent = "Qtd (kg)";
    inputQtd.step = "0.1";
    inputQtd.min = "0.1";
  }
}

function recalcularSubtotalLinha(row) {
  const qtd = parseFloat(row.querySelector(".input-qtd-item").value) || 0;
  const preco = parseFloat(row.querySelector(".input-preco-item").value) || 0;
  row.querySelector(".item-subtotal").textContent = `Subtotal: ${formatarMoeda(qtd * preco)}`;
  recalcularTotalPedido();
}

function recalcularTotalPedido() {
  let total = 0;
  document.querySelectorAll("#order-items-list .order-item-row").forEach(row => {
    const qtd = parseFloat(row.querySelector(".input-qtd-item").value) || 0;
    const preco = parseFloat(row.querySelector(".input-preco-item").value) || 0;
    total += qtd * preco;
  });
  document.getElementById("pedido-total-val").textContent = formatarMoeda(total);
  return total;
}

function resetFormPedido() {
  document.getElementById("form-pedido").reset();
  document.getElementById("edit-pedido-id").value = "";
  document.getElementById("order-items-list").innerHTML = "";
  document.getElementById("pedido-data").value = hojeISO();
  document.getElementById("form-pedido-title").textContent = "Anotar Pedido";
  document.getElementById("btn-salvar-pedido").textContent = "Salvar";
  criarLinhaItem();
  recalcularTotalPedido();
}

function preencherFormPedidoParaEdicao(pedido) {
  document.getElementById("edit-pedido-id").value = pedido.id;
  document.getElementById("pedido-cliente").value = pedido.cliente;
  document.getElementById("pedido-telefone").value = pedido.telefone || "";
  document.getElementById("pedido-data").value = pedido.data;
  document.querySelector(`input[name="pedido-status"][value="${pedido.pago ? "pago" : "pendente"}"]`).checked = true;
  document.getElementById("pedido-obs").value = pedido.obs || "";

  document.getElementById("order-items-list").innerHTML = "";
  (pedido.itens.length ? pedido.itens : [null]).forEach(item => criarLinhaItem(item));

  document.getElementById("form-pedido-title").textContent = "Editar Pedido";
  document.getElementById("btn-salvar-pedido").textContent = "Atualizar";
  recalcularTotalPedido();
  mostrarSecao("section-novo-pedido");
}

function initAutocompleteCliente() {
  const input = document.getElementById("pedido-cliente");
  const lista = document.getElementById("cliente-autocomplete-list");

  input.addEventListener("input", () => {
    const termo = input.value.trim().toLowerCase();
    lista.innerHTML = "";
    if (!termo) return;

    const encontrados = cache.clientes
      .filter(c => c.nome.toLowerCase().includes(termo))
      .slice(0, 5);

    encontrados.forEach(c => {
      const div = document.createElement("div");
      div.textContent = c.nome;
      div.addEventListener("click", () => {
        input.value = c.nome;
        lista.innerHTML = "";
        if (c.telefone) document.getElementById("pedido-telefone").value = c.telefone;
      });
      lista.appendChild(div);
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-with-autocomplete")) lista.innerHTML = "";
  });
}

// Acha o cliente pelo nome (case-insensitive) ou cria um novo
async function encontrarOuCriarCliente(nome, telefone) {
  const existente = cache.clientes.find(c => c.nome.trim().toLowerCase() === nome.trim().toLowerCase());
  if (existente) {
    if (telefone && telefone !== existente.telefone) {
      await api.atualizarCliente(existente.id_cliente, { nome: existente.nome, telefone });
    }
    return existente.id_cliente;
  }
  const criado = await api.criarCliente({ nome, telefone: telefone || "" });
  const novoCliente = Array.isArray(criado) ? criado[0] : criado;
  return novoCliente.id_cliente;
}

function initNovoPedido() {
  document.getElementById("btn-add-item").addEventListener("click", () => criarLinhaItem());

  document.getElementById("order-items-list").addEventListener("click", (e) => {
    if (e.target.closest(".btn-remove-item")) {
      e.target.closest(".order-item-row").remove();
      recalcularTotalPedido();
    }
  });

  document.getElementById("order-items-list").addEventListener("input", (e) => {
    if (e.target.classList.contains("input-qtd-item") || e.target.classList.contains("input-preco-item")) {
      recalcularSubtotalLinha(e.target.closest(".order-item-row"));
    }
  });

  document.getElementById("order-items-list").addEventListener("change", (e) => {
    if (e.target.classList.contains("select-produto-item") || e.target.classList.contains("select-unidade-item")) {
      const row = e.target.closest(".order-item-row");
      const produto = listarProdutosLocal().find(p => p.id === row.querySelector(".select-produto-item").value);
      const unidade = row.querySelector(".select-unidade-item").value;
      atualizarLabelQtdELimites(row);
      if (produto) {
        const preco = precoPorUnidade(produto, unidade);
        if (preco === null) {
          mostrarToast(`Cadastre o preço por kg de "${produto.nome}" para usar essa unidade.`);
        } else {
          row.querySelector(".input-preco-item").value = preco;
        }
        recalcularSubtotalLinha(row);
      }
    }
  });

  document.getElementById("btn-cancelar-pedido").addEventListener("click", () => {
    resetFormPedido();
    mostrarSecao("section-painel");
  });

  document.getElementById("form-pedido").addEventListener("submit", async () => {
    const cliente = document.getElementById("pedido-cliente").value.trim();
    const data = document.getElementById("pedido-data").value;
    if (!cliente || !data) return;

    const linhas = [...document.querySelectorAll("#order-items-list .order-item-row")];
    const itensForm = linhas.map(row => {
      const idProdutoLocal = row.querySelector(".select-produto-item").value;
      const produtoLocal = listarProdutosLocal().find(p => p.id === idProdutoLocal);
      const unidade = row.querySelector(".select-unidade-item").value;
      const nomeBase = produtoLocal ? produtoLocal.nome : (row.dataset.produtoNome || "Produto");
      const sufixo = unidade === "meia_caixa" ? " - meia caixa" : unidade === "kg" ? " - kg" : "";
      return {
        idItemPedidoExistente: row.dataset.idItemPedido || null,
        produto: nomeBase + sufixo,
        quantidade: parseFloat(row.querySelector(".input-qtd-item").value) || 0,
        preco_unitario: parseFloat(row.querySelector(".input-preco-item").value) || 0,
      };
    }).filter(i => i.quantidade > 0);

    if (itensForm.length === 0) {
      mostrarToast("Adicione ao menos um item com quantidade.");
      return;
    }

    const telefone = document.getElementById("pedido-telefone").value.trim();
    const pago = document.querySelector('input[name="pedido-status"]:checked').value === "pago";
    const obs = document.getElementById("pedido-obs").value.trim();
    const idEdicao = document.getElementById("edit-pedido-id").value;

    const btnSalvar = document.getElementById("btn-salvar-pedido");
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    try {
      const id_cliente = await encontrarOuCriarCliente(cliente, telefone);

      if (idEdicao) {
        await api.atualizarPedido(Number(idEdicao), {
          id_cliente,
          data_pedido: data,
          pago,
        });

        // Substitui todos os itens do pedido (mais simples e seguro que "diff")
        const itensAntigos = cache.itens.filter(i => i.id_pedido === Number(idEdicao));
        for (const item of itensAntigos) {
          await api.deletarItem(item.id_item_pedido);
        }
        for (const item of itensForm) {
          await api.criarItem({
            id_pedido: Number(idEdicao),
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          });
        }
        salvarObsPedido(idEdicao, obs);
        mostrarToast("Pedido atualizado! ✅");
      } else {
        const pedidoCriado = await api.criarPedido({ id_cliente, data_pedido: data, pago });
        const novoPedido = Array.isArray(pedidoCriado) ? pedidoCriado[0] : pedidoCriado;

        for (const item of itensForm) {
          await api.criarItem({
            id_pedido: novoPedido.id_pedido,
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          });
        }
        if (obs) salvarObsPedido(novoPedido.id_pedido, obs);
        mostrarToast("Pedido anotado! 🎉");
      }

      resetFormPedido();
      await carregarDados();
      mostrarSecao("section-painel");
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao salvar. Verifique sua conexão e tente de novo.");
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = idEdicao ? "Atualizar" : "Salvar";
    }
  });
}

// ============================================================
// PAINEL (DASHBOARD)
// ============================================================
let periodoAtivo = "mes";

function filtrarPorPeriodo(pedidos, periodo) {
  const hojeISOStr = hojeISO();
  if (periodo === "hoje") return pedidos.filter(p => p.data === hojeISOStr);
  if (periodo === "mes") return pedidos.filter(p => p.data.slice(0, 7) === hojeISOStr.slice(0, 7));
  return pedidos;
}

// Reconhece frações escritas no texto do produto (ex: "Chuchu 1/2", "Pitaya 1/4",
// "meia caixa", "1/2 cx"...) e devolve o multiplicador equivalente em caixas.
function extrairFracaoCaixa(textoProduto) {  const texto = (textoProduto || "").toLowerCase();
  if (texto.includes(" - meia caixa")) return 0.5;
  if (texto.includes(" - kg")) return null; // kg não é comparável a caixa, não entra na contagem
  if (/\b3\/4\b|0[.,]75/.test(texto)) return 0.75;
  if (/\b1\/4\b|0[.,]25|quarto/.test(texto)) return 0.25;
  if (/\b1\/2\b|0[.,]5\b|meia|meio/.test(texto)) return 0.5;
  return 1;
}

function renderPainel() {
  criarBotaoCobrarTodos();
  const todosPedidos = pedidosCompletos();
  const pedidos = filtrarPorPeriodo(todosPedidos, periodoAtivo);

  const labels = { hoje: "Hoje", mes: "Este mês", tudo: "Tudo" };
  document.getElementById("painel-periodo-label").textContent = labels[periodoAtivo];

  let faturamento = 0, pendente = 0, cxChuchu = 0, cxPitaya = 0, valorChuchu = 0, valorPitaya = 0;
  pedidos.forEach(p => {
    if (p.pago) faturamento += p.total; else pendente += p.total;
    p.itens.forEach(item => {
      const nome = (item.produto || "").toLowerCase();
      const subtotalItem = item.quantidade * item.preco_unitario;
      const fracao = extrairFracaoCaixa(nome);
      if (fracao === null) return; // item em kg, não conta em caixas
      const caixasEquivalentes = item.quantidade * fracao;
      if (nome.includes("chuchu")) { cxChuchu += caixasEquivalentes; valorChuchu += subtotalItem; }
      if (nome.includes("pitaya")) { cxPitaya += caixasEquivalentes; valorPitaya += subtotalItem; }
    });
  });

  const mediaChuchu = cxChuchu > 0 ? valorChuchu / cxChuchu : 0;
  const mediaPitaya = cxPitaya > 0 ? valorPitaya / cxPitaya : 0;

  document.getElementById("stat-faturamento").textContent = formatarMoeda(faturamento);
  document.getElementById("stat-cx-chuchu").textContent = `${formatarCaixas(cxChuchu)} cx`;
  document.getElementById("stat-cx-pitaya").textContent = `${formatarCaixas(cxPitaya)} cx`;
  document.getElementById("stat-media-chuchu").textContent = `Média: ${formatarMoeda(mediaChuchu)}`;
  document.getElementById("stat-media-pitaya").textContent = `Média: ${formatarMoeda(mediaPitaya)}`;
  document.getElementById("stat-pendente").textContent = formatarMoeda(pendente);
  document.getElementById("stat-pedidos").textContent = pedidos.length;

  const pendentes = todosPedidos.filter(p => !p.pago).sort((a, b) => b.data.localeCompare(a.data));
  const listPendentes = document.getElementById("list-pendentes-dashboard");
  listPendentes.innerHTML = pendentes.length === 0
    ? `<div class="empty-state"><p>Nenhum pedido pendente! 👍</p></div>`
    : pendentes.slice(0, 5).map(renderOrderCard).join("");

  const ultimos = [...todosPedidos].sort((a, b) => b.id - a.id).slice(0, 5);
  const listUltimos = document.getElementById("list-ultimos-pedidos");
  listUltimos.innerHTML = ultimos.length === 0
    ? `<div class="empty-state"><span class="empty-icon">📝</span><p>Nenhum pedido anotado ainda.</p><p class="empty-hint">Toque em <strong>"+ Anotar"</strong> para começar!</p></div>`
    : ultimos.map(renderOrderCard).join("");

  renderHistoricoMensal(todosPedidos);
  bindOrderCardClicks(listPendentes);
  bindOrderCardClicks(listUltimos);
}

function renderHistoricoMensal(pedidos) {
  const porMes = {};
  pedidos.forEach(p => {
    const key = p.data.slice(0, 7);
    if (!porMes[key]) porMes[key] = { total: 0, pagos: 0, count: 0 };
    porMes[key].total += p.total;
    if (p.pago) porMes[key].pagos += p.total;
    porMes[key].count += 1;
  });

  const chaves = Object.keys(porMes).sort().reverse();
  const container = document.getElementById("list-historico-mensal");

  if (chaves.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum histórico disponível ainda.</p></div>`;
    return;
  }

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  container.innerHTML = chaves.slice(0, 12).map(key => {
    const [ano, mes] = key.split("-");
    const dados = porMes[key];
    return `
      <div class="order-card">
        <div class="order-card-top">
          <span class="order-client">${meses[parseInt(mes, 10) - 1]}/${ano}</span>
          <span class="order-total">${formatarMoeda(dados.total)}</span>
        </div>
        <div class="order-card-bottom">
          <span>${dados.count} pedido(s)</span>
          <span>Recebido: ${formatarMoeda(dados.pagos)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function initPainel() {
  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      periodoAtivo = btn.dataset.period;
      renderPainel();
    });
  });
}

// ============================================================
// LISTA DE PEDIDOS
// ============================================================
let filtroStatusAtivo = "todos";

function renderOrderCard(p) {
  const preview = p.itens.map(i => `${i.quantidade}x ${i.produto}`).join(", ");
  return `
    <div class="order-card" data-id="${p.id}">
      <div class="order-card-top">
        <span class="order-client">${escapeHtml(p.cliente)}</span>
        <span class="order-total">${formatarMoeda(p.total)}</span>
      </div>
      <div class="order-items-preview">${escapeHtml(preview)}</div>
      <div class="order-card-bottom">
        <span>${formatarDataBR(p.data)}</span>
        <span class="order-status-badge ${p.pago ? "pago" : "pendente"}">${p.pago ? "Pago" : "Pendente"}</span>
      </div>
    </div>
  `;
}

function bindOrderCardClicks(container) {
  container.querySelectorAll(".order-card").forEach(card => {
    card.addEventListener("click", () => abrirModalPedido(Number(card.dataset.id)));
  });
}

function popularFiltroMeses() {
  const select = document.getElementById("filter-mes-pedidos");
  const mesesExistentes = [...new Set(cache.pedidos.map(p => p.data_pedido.slice(0, 7)))].sort().reverse();
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const atual = select.value;
  select.innerHTML = `<option value="todos">Todos os meses</option>` +
    mesesExistentes.map(key => {
      const [ano, mes] = key.split("-");
      return `<option value="${key}">${meses[parseInt(mes, 10) - 1]}/${ano}</option>`;
    }).join("");
  if ([...select.options].some(o => o.value === atual)) select.value = atual;
}

function renderListaPedidos() {
  popularFiltroMeses();

  const termoBusca = document.getElementById("search-pedidos").value.trim().toLowerCase();
  const mesFiltro = document.getElementById("filter-mes-pedidos").value;

  let pedidos = pedidosCompletos().sort((a, b) => b.data.localeCompare(a.data));

  if (filtroStatusAtivo !== "todos") pedidos = pedidos.filter(p => (filtroStatusAtivo === "pago") === p.pago);
  if (mesFiltro !== "todos") pedidos = pedidos.filter(p => p.data.slice(0, 7) === mesFiltro);
  if (termoBusca) pedidos = pedidos.filter(p => p.cliente.toLowerCase().includes(termoBusca));

  const container = document.getElementById("all-orders-list");
  container.innerHTML = pedidos.length === 0
    ? `<div class="empty-state"><span class="empty-icon">📝</span><p>Nenhum pedido encontrado.</p></div>`
    : pedidos.map(renderOrderCard).join("");

  bindOrderCardClicks(container);
}

function initListaPedidos() {
  document.getElementById("search-pedidos").addEventListener("input", renderListaPedidos);
  document.getElementById("filter-mes-pedidos").addEventListener("change", renderListaPedidos);

  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      filtroStatusAtivo = chip.dataset.filter;
      renderListaPedidos();
    });
  });
}

// ============================================================
// MODAL DE DETALHES DO PEDIDO
// ============================================================
let pedidoAtualModalId = null;

function abrirModalPedido(id) {
  const pedido = pedidosCompletos().find(p => p.id === id);
  if (!pedido) return;
  pedidoAtualModalId = id;

  document.getElementById("modal-title").textContent = pedido.cliente;

  const itensHtml = pedido.itens.map(i => `
    <div class="modal-item-row">
      <span>${i.quantidade}x ${escapeHtml(i.produto)}</span>
      <span>${formatarMoeda(i.subtotal)}</span>
    </div>
  `).join("");

  document.getElementById("order-modal-body").innerHTML = `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Data</span>
      <span class="modal-detail-value">${formatarDataBR(pedido.data)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">WhatsApp</span>
      <span class="modal-detail-value">${escapeHtml(pedido.telefone) || "—"}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Status</span>
      <span class="modal-detail-value">${pedido.pago ? "✅ Pago" : "⏳ Pendente"}</span>
    </div>
    <div class="modal-items-section">
      <div class="modal-items-title">Itens</div>
      ${itensHtml}
      <div class="modal-total-row">
        <span>Total</span>
        <span>${formatarMoeda(pedido.total)}</span>
      </div>
    </div>
    ${pedido.obs ? `<div class="modal-obs"><strong>Obs:</strong> ${escapeHtml(pedido.obs)}</div>` : ""}
  `;

  const btnToggle = document.getElementById("modal-btn-toggle-status");
  btnToggle.textContent = pedido.pago ? "⏳ Marcar como Pendente" : "✅ Marcar como Pago";
  document.getElementById("modal-btn-cobrar").classList.toggle("hidden", pedido.pago);

  document.getElementById("order-modal").classList.add("active");
}

function fecharModalPedido() {
  document.getElementById("order-modal").classList.remove("active");
  pedidoAtualModalId = null;
}

function linkWhatsapp(pedido, mensagem) {
  const numero = (pedido.telefone || "").replace(/\D/g, "");
  const prefixo = numero.length > 0 && !numero.startsWith("55") ? "55" : "";
  const url = numero
    ? `https://wa.me/${prefixo}${numero}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

function montarMensagemPedido(pedido) {
  const itens = pedido.itens.map(i => `- ${i.quantidade}x ${i.produto}: ${formatarMoeda(i.subtotal)}`).join("\n");
  return `Olá ${pedido.cliente}! Segue o resumo do seu pedido (${formatarDataBR(pedido.data)}):\n${itens}\n\nTotal: ${formatarMoeda(pedido.total)}\nStatus: ${pedido.pago ? "Pago ✅" : "Pendente ⏳"}`;
}

 pendentes.forEach(p => {
    const chave = p.id_cliente ?? p.cliente;
    if (!grupos[chave]) {
      grupos[chave] = { cliente: p.cliente, telefone: p.telefone, pedidos: [], total: 0 };
    }
    grupos[chave].pedidos.push(p);
    grupos[chave].total += p.total;
  return Object.values(grupos).sort((a, b) => b.total - a.total);
  });

function montarMensagemCobrancaLote(grupo) {
  const varios = grupo.pedidos.length > 1;
  const linhas = grupo.pedidos
    .map(p => `- ${formatarDataBR(p.data)}: ${formatarMoeda(p.total)}`)
    .join("\n");
  return `Olá ${grupo.cliente}! Passando para lembrar ${varios ? "dos pedidos pendentes" : "do pedido pendente"}:\n${linhas}\n\nTotal pendente: ${formatarMoeda(grupo.total)}\nPode confirmar o pagamento? 🙏`;
}

function criarBotaoCobrarTodos() {
  if (document.getElementById("btn-cobrar-todos")) return; // já existe

  const container = document.getElementById("list-pendentes-dashboard")?.parentElement;
  if (!container) return;

  const btn = document.createElement("button");
  btn.id = "btn-cobrar-todos";
  btn.textContent = "📢 Cobrar Todos";
  btn.style.cssText = "margin:8px 0;padding:8px 14px;border:none;border-radius:8px;background:#25D366;color:#fff;font-weight:600;cursor:pointer;";
  btn.addEventListener("click", abrirPainelCobrarTodos);

  container.insertBefore(btn, document.getElementById("list-pendentes-dashboard"));
}

function abrirPainelCobrarTodos() {
  const grupos = agruparPendentesPorCliente();
  if (grupos.length === 0) {
    mostrarToast("Nenhum pedido pendente! 👍");
    return;
  }

  // remove painel anterior, se existir
  document.getElementById("overlay-cobrar-todos")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "overlay-cobrar-todos";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const painel = document.createElement("div");
  painel.style.cssText = "background:#fff;border-radius:12px;max-width:420px;width:100%;max-height:80vh;overflow-y:auto;padding:16px;";

  const itensHtml = grupos.map((g, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
      <div>
        <div style="font-weight:600;">${escapeHtml(g.cliente)}</div>
        <div style="font-size:.85em;color:#666;">${g.pedidos.length} pedido(s) · ${formatarMoeda(g.total)}</div>
      </div>
      <button data-idx="${i}" class="btn-enviar-cobranca" style="padding:6px 12px;border:none;border-radius:8px;background:#25D366;color:#fff;cursor:pointer;">
        Enviar
      </button>
    </div>
  `).join("");

  painel.innerHTML = `
    <h3 style="margin-top:0;">Cobrar Todos (${grupos.length})</h3>
    <p style="font-size:.85em;color:#666;">Clique em "Enviar" para abrir o WhatsApp de cada cliente com a cobrança pronta.</p>
    ${itensHtml}
    <button id="btn-fechar-cobrar-todos" style="margin-top:14px;width:100%;padding:10px;border:none;border-radius:8px;background:#eee;cursor:pointer;">Fechar</button>
  `;

  overlay.appendChild(painel);
  document.body.appendChild(overlay);

  painel.querySelectorAll(".btn-enviar-cobranca").forEach(btn => {
    btn.addEventListener("click", () => {
      const grupo = grupos[Number(btn.dataset.idx)];
      linkWhatsapp(grupo, montarMensagemCobrancaLote(grupo));
      btn.textContent = "Enviado ✅";
      btn.disabled = true;
      btn.style.opacity = "0.6";
    });
  });

  document.getElementById("btn-fechar-cobrar-todos").addEventListener("click", () => overlay.remove());
}

function initModal() {
  document.querySelector(".close-modal").addEventListener("click", fecharModalPedido);
  document.getElementById("order-modal").addEventListener("click", (e) => {
    if (e.target.id === "order-modal") fecharModalPedido();
  });

  document.getElementById("modal-btn-whatsapp").addEventListener("click", () => {
    const pedido = pedidosCompletos().find(p => p.id === pedidoAtualModalId);
    if (pedido) linkWhatsapp(pedido, montarMensagemPedido(pedido));
  });

  document.getElementById("modal-btn-cobrar").addEventListener("click", () => {
    const pedido = pedidosCompletos().find(p => p.id === pedidoAtualModalId);
    if (pedido) linkWhatsapp(pedido, montarMensagemCobranca(pedido));
  });

  document.getElementById("modal-btn-toggle-status").addEventListener("click", async () => {
    const pedido = pedidosCompletos().find(p => p.id === pedidoAtualModalId);
    if (!pedido) return;
    try {
      await api.atualizarPedido(pedido.id, { id_cliente: pedido.id_cliente, data_pedido: pedido.data, pago: !pedido.pago });
      mostrarToast(!pedido.pago ? "Marcado como pago! ✅" : "Marcado como pendente.");
      fecharModalPedido();
      await carregarDados();
      renderPainel();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao atualizar status.");
    }
  });

  document.getElementById("modal-btn-editar").addEventListener("click", () => {
    const pedido = pedidosCompletos().find(p => p.id === pedidoAtualModalId);
    if (!pedido) return;
    fecharModalPedido();
    preencherFormPedidoParaEdicao(pedido);
  });

  document.getElementById("modal-btn-excluir").addEventListener("click", async () => {
    if (!confirm("Excluir este pedido permanentemente?")) return;
    try {
      const itensDoPedido = cache.itens.filter(i => i.id_pedido === pedidoAtualModalId);
      for (const item of itensDoPedido) await api.deletarItem(item.id_item_pedido);
      await api.deletarPedido(pedidoAtualModalId);
      salvarObsPedido(pedidoAtualModalId, "");
      fecharModalPedido();
      mostrarToast("Pedido excluído.");
      await carregarDados();
      renderPainel();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao excluir pedido.");
    }
  });
}

// ============================================================
// AJUSTES
// ============================================================
function initAjustes() {
  document.getElementById("btn-backup-export").addEventListener("click", async () => {
    try {
      await carregarDados();
      const dados = {
        clientes: cache.clientes,
        pedidos: cache.pedidos,
        itens: cache.itens,
        produtosLocais: listarProdutosLocal(),
        obsLocais: obterObsMap(),
        exportadoEm: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agropad-backup-${hojeISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      mostrarToast("Backup gerado! ⬆️");
    } catch (err) {
      mostrarToast("⚠️ Erro ao gerar backup.");
    }
  });

  document.getElementById("btn-backup-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    mostrarToast("Restauração de backup dos produtos/observações locais será aplicada; dados do servidor não são sobrescritos automaticamente.");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result);
        if (dados.produtosLocais) salvarProdutosLocal(dados.produtosLocais);
        if (dados.obsLocais) localStorage.setItem(LOCAL_KEYS.obs, JSON.stringify(dados.obsLocais));
        mostrarToast("Produtos e observações locais restaurados. ⬇️");
        renderListaProdutos();
      } catch {
        mostrarToast("Arquivo de backup inválido.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-clear-all").addEventListener("click", async () => {
    if (!confirm("Isso apaga TODOS os pedidos e clientes do servidor, além dos produtos locais. Tem certeza?")) return;
    try {
      await carregarDados();
      for (const item of cache.itens) await api.deletarItem(item.id_item_pedido);
      for (const pedido of cache.pedidos) await api.deletarPedido(pedido.id_pedido);
      for (const cliente of cache.clientes) await api.deletarCliente(cliente.id_cliente);
      localStorage.removeItem(LOCAL_KEYS.produtos);
      localStorage.removeItem(LOCAL_KEYS.obs);
      mostrarToast("Todos os dados foram apagados.");
      await carregarDados();
      renderPainel();
      renderListaProdutos();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao apagar tudo. Alguns itens podem não ter sido removidos.");
    }
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  initNavegacao();
  initPainel();
  initListaPedidos();
  initNovoPedido();
  initAutocompleteCliente();
  initProdutos();
  initModal();
  initAjustes();

  document.getElementById("pedido-data").value = hojeISO();
  criarLinhaItem();
  recalcularTotalPedido();

  mostrarToast("Conectando à API... (pode levar alguns segundos)");
  await refrescarEExecutar(renderPainel);
});