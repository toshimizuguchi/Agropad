import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api";
import {
  formatarMoeda,
  formatarDataBR,
  linkWhatsapp,
  montarMensagemPedido,
} from "../utils";

export default function OrderModal({ pedidoId, onClose, onEditar, onAtualizado }) {
  const pedidosCompletos = useStore((s) => s.pedidosCompletos);
  const carregarDados = useStore((s) => s.carregarDados);
  const mostrarToast = useStore((s) => s.mostrarToast);
  const salvarObs = useStore((s) => s.salvarObs);

  const pedido = pedidosCompletos().find((p) => p.id === pedidoId);

  // Fechar com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!pedido) return null;

  async function toggleStatus() {
    try {
      await api.atualizarPedido(pedido.id, {
        id_cliente: pedido.id_cliente,
        data_pedido: pedido.data,
        pago: !pedido.pago,
      });
      mostrarToast(!pedido.pago ? "Marcado como pago! ✅" : "Marcado como pendente.");
      await carregarDados(true);
      onAtualizado?.();
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao atualizar status.");
    }
  }

  async function excluir() {
    if (!confirm("Excluir este pedido permanentemente?")) return;
    try {
      const { itens } = useStore.getState();
      const itensDoPedido = itens.filter((i) => i.id_pedido === pedidoId);
      for (const item of itensDoPedido) await api.deletarItem(item.id_item_pedido);
      await api.deletarPedido(pedidoId);
      salvarObs(pedidoId, "");
      mostrarToast("Pedido excluído.");
      await carregarDados(true);
      onAtualizado?.();
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao excluir pedido.");
    }
  }

  function montarMensagemCobranca(p) {
    const itens = p.itens.map((i) => `- ${i.quantidade}x ${i.produto}: ${formatarMoeda(i.subtotal)}`).join("\n");
    return `Olá ${p.cliente}! Você tem um pedido pendente de ${formatarDataBR(p.data)}:\n${itens}\n\nTotal: ${formatarMoeda(p.total)}\nPode confirmar o pagamento? 🙏`;
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{pedido.cliente}</h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-detail-row">
            <span className="modal-detail-label">Data</span>
            <span className="modal-detail-value">{formatarDataBR(pedido.data)}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">WhatsApp</span>
            <span className="modal-detail-value">{pedido.telefone || "—"}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Status</span>
            <span className="modal-detail-value">{pedido.pago ? "✅ Pago" : "⏳ Pendente"}</span>
          </div>

          <div className="modal-items-section">
            <div className="modal-items-title">Itens</div>
            {pedido.itens.map((i) => (
              <div key={i.id_item_pedido} className="modal-item-row">
                <span>{i.quantidade}x {i.produto}</span>
                <span>{formatarMoeda(i.subtotal)}</span>
              </div>
            ))}
            <div className="modal-total-row">
              <span>Total</span>
              <span>{formatarMoeda(pedido.total)}</span>
            </div>
          </div>

          {pedido.obs && (
            <div className="modal-obs">
              <strong>Obs:</strong> {pedido.obs}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-whatsapp btn-full"
            onClick={() => linkWhatsapp(pedido, montarMensagemPedido(pedido))}
          >
            📱 Enviar pelo WhatsApp
          </button>

          {!pedido.pago && (
            <button
              className="btn btn-cobrar btn-full"
              onClick={() => linkWhatsapp(pedido, montarMensagemCobranca(pedido))}
            >
              💸 Cobrar pelo WhatsApp
            </button>
          )}

          <button className="btn btn-success btn-full" onClick={toggleStatus}>
            {pedido.pago ? "⏳ Marcar como Pendente" : "✅ Marcar como Pago"}
          </button>
          <button className="btn btn-outline btn-full" onClick={() => { onClose(); onEditar(pedido); }}>
            ✏️ Editar
          </button>
          <button className="btn btn-danger btn-full" onClick={excluir}>
            🗑️ Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
