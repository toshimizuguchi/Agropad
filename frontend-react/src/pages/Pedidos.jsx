import { useState, useCallback, useEffect } from "react";
import { useStore } from "../store/useStore";
import { formatarMoeda, formatarDataBR, linkWhatsapp, montarMensagemCobrancaLote } from "../utils";
import OrderModal from "../components/OrderModal";
import ClientePendentesModal from "../components/ClientePendentesModal";

const MESES_NOME = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function OrderCard({ pedido, onClick }) {
  const preview = pedido.itens.map((i) => `${i.quantidade}x ${i.produto}`).join(", ");
  return (
    <div className="order-card" onClick={() => onClick(pedido.id)}>
      <div className="order-card-top">
        <span className="order-client">{pedido.cliente}</span>
        <span className="order-total">{formatarMoeda(pedido.total)}</span>
      </div>
      <div className="order-items-preview">{preview}</div>
      <div className="order-card-bottom">
        <span>{formatarDataBR(pedido.data)}</span>
        <span className={`order-status-badge ${pedido.pago ? "pago" : "pendente"}`}>
          {pedido.pago ? "Pago" : "Pendente"}
        </span>
      </div>
    </div>
  );
}

export default function Pedidos({ onEditar }) {
  const carregarDados = useStore((s) => s.carregarDados);
  const pedidosCompletos = useStore((s) => s.pedidosCompletos);
  const pedidos = useStore((s) => s.pedidos); // para popular select de meses

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [agruparPendentes, setAgruparPendentes] = useState(true);
  const [modalId, setModalId] = useState(null);
  const [modalClienteGrupo, setModalClienteGrupo] = useState(null);

  const carregar = useCallback(async () => {
    try { await carregarDados(); } catch {}
  }, [carregarDados]);

  useEffect(() => { carregar(); }, [carregar]);

  const mesesExistentes = [...new Set(pedidos.map((p) => p.data_pedido?.slice(0, 7)))]
    .filter(Boolean)
    .sort()
    .reverse();

  let lista = pedidosCompletos().sort((a, b) => b.data.localeCompare(a.data));
  if (filtroStatus !== "todos") lista = lista.filter((p) => (filtroStatus === "pago") === p.pago);
  if (filtroMes !== "todos") lista = lista.filter((p) => p.data.slice(0, 7) === filtroMes);
  if (busca) lista = lista.filter((p) => p.cliente.toLowerCase().includes(busca.toLowerCase().trim()));

  // Grupos por cliente quando em pendentes
  const gruposPendentes = {};
  if (filtroStatus === "pendente") {
    lista.forEach((p) => {
      const chave = p.id_cliente ?? p.cliente.trim().toLowerCase();
      if (!gruposPendentes[chave]) {
        gruposPendentes[chave] = { cliente: p.cliente, telefone: p.telefone, pedidos: [], total: 0 };
      }
      gruposPendentes[chave].pedidos.push(p);
      gruposPendentes[chave].total += p.total;
    });
  }
  const gruposPendentesList = Object.values(gruposPendentes).sort((a, b) => b.total - a.total);

  return (
    <section className="app-section">
      <div className="section-header">
        <h2>Pedidos</h2>
        <p className="section-subtitle">Histórico completo de vendas</p>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar comprador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {[
            { id: "todos", label: "Todos" },
            { id: "pendente", label: "⏳ Pendentes" },
            { id: "pago", label: "✅ Pagos" },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-chip${filtroStatus === f.id ? " active" : ""}`}
              onClick={() => setFiltroStatus(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtroStatus === "pendente" && (
          <div style={{ display: "flex", gap: 8, marginTop: 4, width: "100%" }}>
            <button
              type="button"
              onClick={() => setAgruparPendentes(true)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: agruparPendentes ? "#e8f5e9" : "#fff",
                color: agruparPendentes ? "var(--primary-dark)" : "var(--text)",
                fontWeight: agruparPendentes ? 700 : 400,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              👥 Agrupar por Cliente ({gruposPendentesList.length})
            </button>
            <button
              type="button"
              onClick={() => setAgruparPendentes(false)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: !agruparPendentes ? "#e8f5e9" : "#fff",
                color: !agruparPendentes ? "var(--primary-dark)" : "var(--text)",
                fontWeight: !agruparPendentes ? 700 : 400,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              📋 Pedidos Individuais ({lista.length})
            </button>
          </div>
        )}

        <div className="filters-row-2">
          <select
            className="month-select-filter"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            <option value="todos">Todos os meses</option>
            {mesesExistentes.map((key) => {
              const [ano, mes] = key.split("-");
              return (
                <option key={key} value={key}>
                  {MESES_NOME[parseInt(mes, 10) - 1]}/{ano}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="orders-list">
        {filtroStatus === "pendente" && agruparPendentes ? (
          gruposPendentesList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎉</span>
              <p>Nenhum cliente com pedidos pendentes!</p>
            </div>
          ) : (
            gruposPendentesList.map((g, idx) => (
              <div
                key={idx}
                className="order-card"
                style={{ cursor: "pointer", borderLeft: "4px solid #ff9800" }}
                onClick={() => setModalClienteGrupo(g)}
              >
                <div className="order-card-top">
                  <span className="order-client" style={{ fontSize: 16, fontWeight: 700 }}>
                    👤 {g.cliente}
                  </span>
                  <span className="order-total" style={{ color: "#d84315", fontSize: 17, fontWeight: 700 }}>
                    {formatarMoeda(g.total)}
                  </span>
                </div>
                <div className="order-items-preview">
                  {g.pedidos.length} {g.pedidos.length === 1 ? "pedido em aberto" : "pedidos em aberto"}
                  {g.telefone ? ` · 📱 ${g.telefone}` : ""}
                </div>
                <div className="order-card-bottom" style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    Toque para ver pedidos ou quitar tudo
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      linkWhatsapp(g, montarMensagemCobrancaLote(g));
                    }}
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      boxShadow: "0 2px 6px rgba(37,211,102,0.3)",
                    }}
                  >
                    💬 Cobrar Total
                  </button>
                </div>
              </div>
            ))
          )
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>Nenhum pedido encontrado.</p>
          </div>
        ) : (
          lista.map((p) => <OrderCard key={p.id} pedido={p} onClick={setModalId} />)
        )}
      </div>

      {modalId && (
        <OrderModal
          pedidoId={modalId}
          onClose={() => setModalId(null)}
          onEditar={(pedido) => { setModalId(null); onEditar(pedido); }}
          onAtualizado={() => carregar()}
        />
      )}

      {modalClienteGrupo && (
        <ClientePendentesModal
          grupo={modalClienteGrupo}
          onClose={() => setModalClienteGrupo(null)}
          onAtualizado={() => carregar()}
        />
      )}
    </section>
  );
}
