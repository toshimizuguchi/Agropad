import { useEffect, useState, useCallback } from "react";
import { useStore } from "../store/useStore";
import {
  formatarMoeda,
  formatarCaixas,
  formatarDataBR,
  extrairFracaoCaixa,
  linkWhatsapp,
  montarMensagemCobrancaLote,
  hojeISO,
} from "../utils";
import OrderModal from "../components/OrderModal";
import DespesasModal from "../components/DespesasModal";
import ClientePendentesModal from "../components/ClientePendentesModal";

const MESES_NOME = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function filtrarPorPeriodo(pedidos, periodo) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (periodo === "hoje") return pedidos.filter((p) => p.data === hoje);
  if (periodo === "mes") return pedidos.filter((p) => p.data.slice(0, 7) === hoje.slice(0, 7));
  return pedidos;
}

function calcularStats(pedidos) {
  let faturamento = 0, pendente = 0, cxChuchu = 0, cxPitaya = 0, valorChuchu = 0, valorPitaya = 0;
  pedidos.forEach((p) => {
    if (p.pago) faturamento += p.total; else pendente += p.total;
    p.itens.forEach((item) => {
      const nome = (item.produto || "").toLowerCase();
      const subtotalItem = item.quantidade * item.preco_unitario;
      const fracao = extrairFracaoCaixa(nome);
      if (fracao === null) return;
      const cx = item.quantidade * fracao;
      if (nome.includes("chuchu")) { cxChuchu += cx; valorChuchu += subtotalItem; }
      if (nome.includes("pitaya")) { cxPitaya += cx; valorPitaya += subtotalItem; }
    });
  });
  return {
    faturamento, pendente,
    cxChuchu, cxPitaya,
    mediaChuchu: cxChuchu > 0 ? valorChuchu / cxChuchu : 0,
    mediaPitaya: cxPitaya > 0 ? valorPitaya / cxPitaya : 0,
  };
}

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

function PainelCobrarTodos({ grupos, onClose }) {
  const [enviados, setEnviados] = useState({});

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
        zIndex: 9999, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 12, maxWidth: 420,
        width: "100%", maxHeight: "80vh", overflowY: "auto", padding: 16,
      }}>
        <h3 style={{ marginTop: 0 }}>Cobrar Todos ({grupos.length})</h3>
        <p style={{ fontSize: ".85em", color: "#666", marginBottom: 12 }}>
          Clique em "Enviar" para abrir o WhatsApp de cada cliente com a cobrança pronta.
        </p>
        {grupos.map((g, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "10px 0",
            borderBottom: "1px solid #eee",
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{g.cliente}</div>
              <div style={{ fontSize: ".85em", color: "#666" }}>
                {g.pedidos.length} pedido(s) · {formatarMoeda(g.total)}
              </div>
            </div>
            <button
              onClick={() => {
                linkWhatsapp(g, montarMensagemCobrancaLote(g));
                setEnviados((prev) => ({ ...prev, [i]: true }));
              }}
              disabled={enviados[i]}
              style={{
                padding: "6px 12px", border: "none", borderRadius: 8,
                background: enviados[i] ? "#ccc" : "#25D366",
                color: "#fff", cursor: enviados[i] ? "default" : "pointer",
                opacity: enviados[i] ? 0.6 : 1,
              }}
            >
              {enviados[i] ? "Enviado ✅" : "Enviar"}
            </button>
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: 14, width: "100%", padding: 10,
            border: "none", borderRadius: 8, background: "#eee", cursor: "pointer",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default function Painel({ onEditar, setPagina }) {
  const carregarDados = useStore((s) => s.carregarDados);
  const pedidosCompletos = useStore((s) => s.pedidosCompletos);
  const despesas = useStore((s) => s.despesas);
  const carregando = useStore((s) => s.carregando);
  const mostrarToast = useStore((s) => s.mostrarToast);

  const [periodo, setPeriodo] = useState("mes");
  const [modalPedidoId, setModalPedidoId] = useState(null);
  const [modalClienteGrupo, setModalClienteGrupo] = useState(null);
  const [mostrarCobrarTodos, setMostrarCobrarTodos] = useState(false);
  const [mostrarDespesasModal, setMostrarDespesasModal] = useState(false);

  const carregar = useCallback(async () => {
    try { await carregarDados(); } catch {}
  }, [carregarDados]);

  useEffect(() => { carregar(); }, [carregar]);

  const todos = pedidosCompletos();
  const filtrados = filtrarPorPeriodo(todos, periodo);
  const stats = calcularStats(filtrados);
  const pendentes = todos.filter((p) => !p.pago).sort((a, b) => b.data.localeCompare(a.data));
  const ultimos = [...todos].sort((a, b) => b.id - a.id).slice(0, 5);

  // Despesas / Compras do período
  const hojeIso = hojeISO();
  const despesasPeriodo = despesas.filter((d) => {
    if (periodo === "hoje") return d.data === hojeIso;
    if (periodo === "mes") return (d.data || "").slice(0, 7) === hojeIso.slice(0, 7);
    return true;
  });
  const totalDespesas = despesasPeriodo.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);
  const faturamentoBruto = stats.faturamento;
  const faturamentoLiquido = faturamentoBruto - totalDespesas;

  // Histórico mensal
  const porMes = {};
  todos.forEach((p) => {
    const key = p.data.slice(0, 7);
    if (!porMes[key]) porMes[key] = { total: 0, pagos: 0, count: 0 };
    porMes[key].total += p.total;
    if (p.pago) porMes[key].pagos += p.total;
    porMes[key].count += 1;
  });
  const chavesMes = Object.keys(porMes).sort().reverse().slice(0, 12);

  // Grupos de pendentes para cobrar por cliente único com total somado
  const grupos = {};
  pendentes.forEach((p) => {
    const chave = p.id_cliente ?? p.cliente.trim().toLowerCase();
    if (!grupos[chave]) grupos[chave] = { cliente: p.cliente, telefone: p.telefone, pedidos: [], total: 0 };
    grupos[chave].pedidos.push(p);
    grupos[chave].total += p.total;
  });
  const gruposList = Object.values(grupos).sort((a, b) => b.total - a.total);

  const labelsP = { hoje: "Hoje", mes: "Este mês", tudo: "Tudo" };

  return (
    <section className="app-section">
      <div className="section-header">
        <h2>Resumo de Vendas</h2>
        <p className="section-subtitle">{labelsP[periodo]}</p>
      </div>

      {/* Filtro período */}
      <div className="period-filter">
        {["hoje", "mes", "tudo"].map((p) => (
          <button
            key={p}
            className={`period-btn${periodo === p ? " active" : ""}`}
            onClick={() => setPeriodo(p)}
          >
            {p === "hoje" ? "Hoje" : p === "mes" ? "Este Mês" : "Tudo"}
          </button>
        ))}
      </div>

      {/* Stats */}
      {carregando && todos.length === 0 ? (
        <>
          <div className="skeleton loading-card" />
          <div className="skeleton loading-card" />
          <div className="skeleton loading-card" />
        </>
      ) : (
        <div className="stats-grid">
          {/* Card Faturamento com Dedução de Compras/Descontos */}
          <div className="stat-card card-faturamento" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <span className="stat-label">Faturamento Líquido (Lucro)</span>
                  <span className="stat-value" style={{ color: faturamentoLiquido >= 0 ? "var(--primary-dark)" : "var(--danger)" }}>
                    {formatarMoeda(faturamentoLiquido)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarDespesasModal(true)}
                style={{
                  background: "#e8f5e9",
                  border: "1px solid #c8e6c9",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--primary-dark)",
                  cursor: "pointer",
                }}
              >
                🛒 Compras/Descontos ({formatarMoeda(totalDespesas)})
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-muted)", borderTop: "1px dashed var(--border)", paddingTop: 6, width: "100%" }}>
              <span>Vendas Brutas: <strong>{formatarMoeda(faturamentoBruto)}</strong></span>
              <span>Compras de Chuchu: <strong style={{ color: totalDespesas > 0 ? "var(--danger)" : "inherit" }}>- {formatarMoeda(totalDespesas)}</strong></span>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-card-mini">
              <span className="mini-emoji">🥬</span>
              <span className="mini-label">Chuchu</span>
              <span className="mini-value">{formatarCaixas(stats.cxChuchu)} cx</span>
              <span className="mini-avg">Média: {formatarMoeda(stats.mediaChuchu)}</span>
            </div>
            <div className="stat-card-mini">
              <span className="mini-emoji">🐲</span>
              <span className="mini-label">Pitaya</span>
              <span className="mini-value">{formatarCaixas(stats.cxPitaya)} cx</span>
              <span className="mini-avg">Média: {formatarMoeda(stats.mediaPitaya)}</span>
            </div>
          </div>

          <div className="stat-card card-pendente">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <span className="stat-label">A Receber ({gruposList.length} clientes em débito)</span>
              <span className="stat-value text-warning">{formatarMoeda(stats.pendente)}</span>
            </div>
          </div>

          <div className="stat-card card-pedidos-count">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <span className="stat-label">Pedidos Anotados</span>
              <span className="stat-value">{filtrados.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pendentes de pagamento agrupados por cliente */}
      <div className="card-section card-section-warning">
        <div className="card-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>⚠️ Pendentes por Cliente</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {gruposList.length} {gruposList.length === 1 ? "cliente com valor em aberto" : "clientes com valores em aberto"}
            </span>
          </div>
          {pendentes.length > 0 && (
            <button
              onClick={() => {
                if (gruposList.length === 0) { mostrarToast("Nenhum pedido pendente! 👍"); return; }
                setMostrarCobrarTodos(true);
              }}
              style={{
                padding: "6px 12px", border: "none", borderRadius: 8,
                background: "#25D366", color: "#fff", fontWeight: 600,
                fontSize: 12, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,211,102,0.3)"
              }}
            >
              📢 Cobrar Todos
            </button>
          )}
        </div>
        <div className="orders-list">
          {gruposList.length === 0 ? (
            <div className="empty-state"><p>Nenhum pedido pendente! 👍</p></div>
          ) : (
            gruposList.slice(0, 6).map((g, idx) => (
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
          )}
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="card-section">
        <div className="card-section-header"><h3>Últimos Pedidos</h3></div>
        <div className="orders-list">
          {ultimos.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p>Nenhum pedido anotado ainda.</p>
              <p className="empty-hint">Toque em <strong>"+ Anotar"</strong> para começar!</p>
            </div>
          ) : (
            ultimos.map((p) => <OrderCard key={p.id} pedido={p} onClick={setModalPedidoId} />)
          )}
        </div>
      </div>

      {/* Histórico mensal */}
      <div className="card-section">
        <div className="card-section-header"><h3>📊 Histórico Mensal</h3></div>
        <div className="monthly-history-list">
          {chavesMes.length === 0 ? (
            <div className="empty-state"><p>Nenhum histórico disponível ainda.</p></div>
          ) : (
            chavesMes.map((key) => {
              const [ano, mes] = key.split("-");
              const dados = porMes[key];
              return (
                <div key={key} className="order-card">
                  <div className="order-card-top">
                    <span className="order-client">{MESES_NOME[parseInt(mes, 10) - 1]}/{ano}</span>
                    <span className="order-total">{formatarMoeda(dados.total)}</span>
                  </div>
                  <div className="order-card-bottom">
                    <span>{dados.count} pedido(s)</span>
                    <span>Recebido: {formatarMoeda(dados.pagos)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de pedido */}
      {modalPedidoId && (
        <OrderModal
          pedidoId={modalPedidoId}
          onClose={() => setModalPedidoId(null)}
          onEditar={(pedido) => { onEditar(pedido); }}
          onAtualizado={() => carregar()}
        />
      )}

      {/* Modal de cliente pendente agrupado */}
      {modalClienteGrupo && (
        <ClientePendentesModal
          grupo={modalClienteGrupo}
          onClose={() => setModalClienteGrupo(null)}
          onAtualizado={() => carregar()}
        />
      )}

      {/* Modal de despesas / compras de chuchu */}
      {mostrarDespesasModal && (
        <DespesasModal
          periodo={periodo}
          onClose={() => setMostrarDespesasModal(false)}
        />
      )}

      {/* Painel cobrar todos */}
      {mostrarCobrarTodos && (
        <PainelCobrarTodos grupos={gruposList} onClose={() => setMostrarCobrarTodos(false)} />
      )}
    </section>
  );
}
