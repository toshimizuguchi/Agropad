import { useState } from "react";
import { useStore } from "../store/useStore";
import { formatarMoeda, formatarDataBR, linkWhatsapp, montarMensagemCobrancaLote } from "../utils";

export default function ClientePendentesModal({ grupo, onClose, onAtualizado }) {
  const marcarPedidosComoPagos = useStore((s) => s.marcarPedidosComoPagos);
  const mostrarToast = useStore((s) => s.mostrarToast);
  const [salvando, setSalvando] = useState(false);

  if (!grupo) return null;

  async function handleQuitarTodos() {
    const qtd = grupo.pedidos.length;
    const confirmou = confirm(
      `Deseja marcar TODOS os ${qtd} pedido(s) de "${grupo.cliente}" como pagos? Total: ${formatarMoeda(grupo.total)}`
    );
    if (!confirmou) return;

    setSalvando(true);
    try {
      const ids = grupo.pedidos.map((p) => p.id);
      await marcarPedidosComoPagos(ids);
      mostrarToast(`Todos os ${qtd} pedidos de ${grupo.cliente} foram marcados como pagos! ✅`);
      onAtualizado?.();
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao quitar pedidos.");
    } finally {
      setSalvando(false);
    }
  }

  function handleCobrarWhatsApp() {
    linkWhatsapp(grupo, montarMensagemCobrancaLote(grupo));
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>{grupo.cliente}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              {grupo.telefone ? `📱 ${grupo.telefone}` : "Sem telefone cadastrado"}
            </p>
          </div>
          <button className="close-modal" onClick={onClose} disabled={salvando}>×</button>
        </div>

        <div className="modal-body">
          {/* Card com a dívida total inteira */}
          <div
            style={{
              background: "#fff3e0",
              border: "1.5px solid #ffe0b2",
              borderRadius: "var(--radius)",
              padding: "16px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: 13, color: "#e65100", fontWeight: 600, textTransform: "uppercase" }}>
              Total Pendente Inteiro
            </span>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#bf360c", marginTop: 4 }}>
              {formatarMoeda(grupo.total)}
            </div>
            <span style={{ fontSize: 13, color: "#8d6e63" }}>
              Soma de {grupo.pedidos.length} {grupo.pedidos.length === 1 ? "pedido em aberto" : "pedidos em aberto"}
            </span>
          </div>

          <div className="modal-items-section">
            <div className="modal-items-title">Pedidos que compõem este total:</div>
            {grupo.pedidos.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fafafa",
                  border: "1px solid #e0e0e0",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                  <span>📅 Entrega: {formatarDataBR(p.data)}</span>
                  <span style={{ color: "var(--primary-dark)" }}>{formatarMoeda(p.total)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "#666", marginTop: 4 }}>
                  {p.itens.map((i) => `${i.quantidade}x ${i.produto}`).join(", ")}
                </div>
                {p.obs && (
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2, fontStyle: "italic" }}>
                    Obs: {p.obs}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-whatsapp btn-full"
            onClick={handleCobrarWhatsApp}
            disabled={salvando}
          >
            💸 Cobrar Total no WhatsApp ({formatarMoeda(grupo.total)})
          </button>

          <button
            type="button"
            className="btn btn-success btn-full"
            onClick={handleQuitarTodos}
            disabled={salvando}
          >
            {salvando ? "Atualizando pedidos..." : "✅ Marcar Todos como Pagos"}
          </button>

          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={onClose}
            disabled={salvando}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
