import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api";
import {
  formatarMoeda,
  hojeISO,
  extrairUnidadeDoNome,
  precoPorUnidade,
} from "../utils";

function gerarItemVazio() {
  return { _key: crypto.randomUUID(), produtoId: "", unidade: "caixa", quantidade: 1, preco: "" };
}

function ItemRow({ item, onChange, onRemove, produtos }) {
  const qtdLabel =
    item.unidade === "kg" ? "Qtd (kg)" :
    item.unidade === "meia_caixa" ? "Qtd (meias caixas)" : "Qtd (caixas)";
  const qtdStep = item.unidade === "kg" ? "0.1" : "1";
  const qtdMin = item.unidade === "kg" ? "0.1" : "1";

  const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.preco) || 0);

  function handleProdutoChange(e) {
    const id = e.target.value;
    const prod = produtos.find((p) => p.id === id);
    const preco = prod ? (precoPorUnidade(prod, item.unidade) ?? "") : "";
    onChange({ ...item, produtoId: id, preco: preco !== null ? preco : "" });
  }

  function handleUnidadeChange(e) {
    const unidade = e.target.value;
    const prod = produtos.find((p) => p.id === item.produtoId);
    const preco = prod ? (precoPorUnidade(prod, unidade) ?? "") : item.preco;
    onChange({ ...item, unidade, preco: preco !== null ? preco : "" });
  }

  return (
    <div className="order-item-row">
      <div className="item-row-top">
        <select
          className="select-produto-item"
          value={item.produtoId}
          onChange={handleProdutoChange}
        >
          <option value="">Selecione...</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} ({formatarMoeda(p.preco)})
            </option>
          ))}
        </select>

        <select
          className="select-unidade-item"
          value={item.unidade}
          onChange={handleUnidadeChange}
        >
          <option value="caixa">Caixa</option>
          <option value="meia_caixa">Meia caixa</option>
          <option value="kg">Kg</option>
        </select>

        <button type="button" className="btn-remove-item" onClick={onRemove}>×</button>
      </div>

      <div className="item-row-bottom">
        <div className="item-field">
          <label>{qtdLabel}</label>
          <input
            type="number"
            value={item.quantidade}
            min={qtdMin}
            step={qtdStep}
            onChange={(e) => onChange({ ...item, quantidade: e.target.value })}
          />
        </div>
        <div className="item-field">
          <label>Preço/un.</label>
          <input
            type="number"
            value={item.preco}
            min="0"
            step="0.01"
            onChange={(e) => onChange({ ...item, preco: e.target.value })}
          />
        </div>
      </div>

      <div className="item-subtotal">Subtotal: {formatarMoeda(subtotal)}</div>
    </div>
  );
}

export default function NovoPedido({ pedidoParaEditar, setPagina, onSalvo }) {
  const carregarDados = useStore((s) => s.carregarDados);
  const clientes = useStore((s) => s.clientes);
  const produtos = useStore((s) => s.produtos);
  const mostrarToast = useStore((s) => s.mostrarToast);
  const salvarObs = useStore((s) => s.salvarObs);
  const encontrarOuCriarCliente = useStore((s) => s.encontrarOuCriarCliente);

  const isEdicao = !!pedidoParaEditar;

  // Inicializar form
  function initForm() {
    if (pedidoParaEditar) {
      return {
        cliente: pedidoParaEditar.cliente,
        telefone: pedidoParaEditar.telefone || "",
        data: pedidoParaEditar.data,
        pago: pedidoParaEditar.pago,
        obs: pedidoParaEditar.obs || "",
        itens: pedidoParaEditar.itens.length
          ? pedidoParaEditar.itens.map((i) => {
              const { nomeBase, unidade } = extrairUnidadeDoNome(i.produto || "");
              const prod = produtos.find((p) => p.nome === nomeBase);
              return {
                _key: crypto.randomUUID(),
                _idExistente: i.id_item_pedido,
                produtoId: prod?.id || "",
                _produtoNome: nomeBase,
                unidade,
                quantidade: i.quantidade,
                preco: i.preco_unitario,
              };
            })
          : [gerarItemVazio()],
      };
    }
    return {
      cliente: "", telefone: "", data: hojeISO(),
      pago: true, obs: "", itens: [gerarItemVazio()],
    };
  }

  const [form, setForm] = useState(initForm);
  const [salvando, setSalvando] = useState(false);
  const [autocomplete, setAutocomplete] = useState([]);
  const autocompleteRef = useRef(null);

  // Resetar quando pedidoParaEditar mudar
  useEffect(() => { setForm(initForm()); }, [pedidoParaEditar?.id]);

  useEffect(() => {
    async function init() {
      try { await carregarDados(); } catch {}
    }
    init();
  }, []);

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (!autocompleteRef.current?.contains(e.target)) setAutocomplete([]);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Autocomplete de clientes
  function handleClienteInput(e) {
    const termo = e.target.value;
    setForm((f) => ({ ...f, cliente: termo }));
    if (!termo.trim()) { setAutocomplete([]); return; }
    const encontrados = clientes
      .filter((c) => c.nome.toLowerCase().includes(termo.toLowerCase()))
      .slice(0, 5);
    setAutocomplete(encontrados);
  }

  function selecionarCliente(c) {
    setForm((f) => ({ ...f, cliente: c.nome, telefone: c.telefone || f.telefone }));
    setAutocomplete([]);
  }

  // Gerenciar itens
  function adicionarItem() {
    setForm((f) => ({ ...f, itens: [...f.itens, gerarItemVazio()] }));
  }

  function removerItem(key) {
    setForm((f) => ({ ...f, itens: f.itens.filter((i) => i._key !== key) }));
  }

  function atualizarItem(key, novoItem) {
    setForm((f) => ({ ...f, itens: f.itens.map((i) => (i._key === key ? novoItem : i)) }));
  }

  const total = form.itens.reduce(
    (acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.preco) || 0), 0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.cliente.trim() || !form.data) return;

    const itensValidos = form.itens
      .filter((i) => parseFloat(i.quantidade) > 0)
      .map((i) => {
        const prod = produtos.find((p) => p.id === i.produtoId);
        const nomeBase = prod ? prod.nome : (i._produtoNome || "Produto");
        const sufixo = i.unidade === "meia_caixa" ? " - meia caixa" : i.unidade === "kg" ? " - kg" : "";
        return {
          _idExistente: i._idExistente || null,
          produto: nomeBase + sufixo,
          quantidade: parseFloat(i.quantidade) || 0,
          preco_unitario: parseFloat(i.preco) || 0,
        };
      });

    if (itensValidos.length === 0) {
      mostrarToast("Adicione ao menos um item com quantidade.");
      return;
    }

    setSalvando(true);
    try {
      const id_cliente = await encontrarOuCriarCliente(form.cliente, form.telefone);

      if (isEdicao) {
        await api.atualizarPedido(Number(pedidoParaEditar.id), {
          id_cliente, data_pedido: form.data, pago: form.pago,
        });
        const itensAntigos = useStore.getState().itens.filter(
          (i) => i.id_pedido === Number(pedidoParaEditar.id)
        );
        await Promise.all(itensAntigos.map((item) => api.deletarItem(item.id_item_pedido)));
        await Promise.all(itensValidos.map((item) =>
          api.criarItem({ id_pedido: Number(pedidoParaEditar.id), ...item })
        ));
        salvarObs(pedidoParaEditar.id, form.obs);
        mostrarToast("Pedido atualizado! ✅");
      } else {
        const pedidoCriado = await api.criarPedido({ id_cliente, data_pedido: form.data, pago: form.pago });
        const novoPedido = Array.isArray(pedidoCriado) ? pedidoCriado[0] : pedidoCriado;
        for (const item of itensValidos) {
          await api.criarItem({ id_pedido: novoPedido.id_pedido, ...item });
        }
        if (form.obs) salvarObs(novoPedido.id_pedido, form.obs);
        mostrarToast("Pedido anotado! 🎉");
      }

      await carregarDados(true);
      onSalvo?.();
      setPagina("painel");
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao salvar. Verifique sua conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="app-section">
      <div className="section-header">
        <h2>{isEdicao ? "Editar Pedido" : "Anotar Pedido"}</h2>
        <p className="section-subtitle">Registre a venda de caixas</p>
      </div>

      <form className="styled-form" onSubmit={handleSubmit}>
        {/* Cliente */}
        <div className="form-group">
          <label>Comprador <span className="required">*</span></label>
          <div className="input-with-autocomplete" ref={autocompleteRef}>
            <input
              type="text"
              placeholder="Nome do comprador"
              value={form.cliente}
              onChange={handleClienteInput}
              autoComplete="off"
              required
            />
            {autocomplete.length > 0 && (
              <div className="autocomplete-items">
                {autocomplete.map((c) => (
                  <div
                    key={c.id_cliente}
                    className="autocomplete-item"
                    onMouseDown={() => selecionarCliente(c)}
                  >
                    {c.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="form-group">
          <label>WhatsApp (opcional)</label>
          <input
            type="tel"
            placeholder="(12) 99999-9999"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
        </div>

        {/* Data */}
        <div className="form-group">
          <label>Data</label>
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            required
          />
        </div>

        {/* Pagamento */}
        <div className="form-group">
          <label>Pagamento</label>
          <div className="payment-toggle" style={{ display: "flex", gap: 8 }}>
            {[
              { value: true, label: "✅ Pago", className: "toggle-pago" },
              { value: false, label: "⏳ Pendente", className: "toggle-pendente" },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                style={{
                  flex: 1, textAlign: "center", padding: "10px",
                  borderRadius: 8, border: "1.5px solid",
                  borderColor: form.pago === opt.value ? "var(--primary)" : "var(--border)",
                  background: form.pago === opt.value ? "var(--primary-bg)" : "#fff",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                <input
                  type="radio"
                  name="pedido-status"
                  style={{ display: "none" }}
                  checked={form.pago === opt.value}
                  onChange={() => setForm((f) => ({ ...f, pago: opt.value }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Itens */}
        <div className="form-section-divider"><h3>Caixas</h3></div>

        <div className="order-items-container">
          {form.itens.map((item) => (
            <ItemRow
              key={item._key}
              item={item}
              produtos={produtos}
              onChange={(novoItem) => atualizarItem(item._key, novoItem)}
              onRemove={() => removerItem(item._key)}
            />
          ))}
        </div>

        <button type="button" className="btn btn-add-item" onClick={adicionarItem}>
          <span>＋</span> Adicionar Produto
        </button>

        {/* Observação */}
        <div className="form-group">
          <label>Observação (opcional)</label>
          <textarea
            rows={2}
            placeholder="Ex: entregar na doca 5..."
            value={form.obs}
            onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
          />
        </div>

        {/* Total */}
        <div className="order-total-box">
          <span className="total-label">Total do Pedido</span>
          <span className="total-value">{formatarMoeda(total)}</span>
        </div>

        {/* Ações */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setPagina("painel")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? "Salvando..." : isEdicao ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </section>
  );
}
