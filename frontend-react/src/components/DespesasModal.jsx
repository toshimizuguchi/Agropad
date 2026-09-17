import { useState } from "react";
import { useStore } from "../store/useStore";
import { formatarMoeda, formatarDataBR, hojeISO } from "../utils";

export default function DespesasModal({ onClose, periodo }) {
  const despesas = useStore((s) => s.despesas);
  const salvarDespesa = useStore((s) => s.salvarDespesa);
  const excluirDespesa = useStore((s) => s.excluirDespesa);
  const mostrarToast = useStore((s) => s.mostrarToast);

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data: hojeISO(),
  });

  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);

  // Filtra despesas pelo período atual
  const despesasFiltradas = despesas.filter((d) => {
    if (periodo === "hoje") return d.data === hoje;
    if (periodo === "mes") return (d.data || "").slice(0, 7) === mesAtual;
    return true;
  });

  const totalPeriodo = despesasFiltradas.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    const valorNum = parseFloat(form.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      mostrarToast("Informe um valor válido.");
      return;
    }

    salvarDespesa({
      descricao: form.descricao.trim() || "Compra de chuchu",
      valor: valorNum,
      data: form.data,
    });

    setForm({ descricao: "", valor: "", data: hojeISO() });
    mostrarToast("Gasto/compra adicionado com sucesso! 🛒");
  }

  function handleExcluir(id) {
    if (confirm("Remover este registro de compra/despesa?")) {
      excluirDespesa(id);
      mostrarToast("Registro removido.");
    }
  }

  const periodoLabels = { hoje: "Hoje", mes: "Este Mês", tudo: "Geral" };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Compras & Descontos</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Período: {periodoLabels[periodo] || "Geral"}
            </p>
          </div>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Card Resumo do Período */}
          <div
            style={{
              background: "#ffebee",
              border: "1.5px solid #ffcdd2",
              borderRadius: "var(--radius)",
              padding: "14px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: 12.5, color: "#c62828", fontWeight: 600, textTransform: "uppercase" }}>
              Total em Compras/Descontos ({periodoLabels[periodo]})
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#b71c1c", marginTop: 4 }}>
              {formatarMoeda(totalPeriodo)}
            </div>
            <span style={{ fontSize: 12, color: "#777" }}>
              Este valor é deduzido automaticamente do faturamento bruto
            </span>
          </div>

          {/* Formulário de Adicionar */}
          <form onSubmit={handleSubmit} style={{ background: "#f8faf7", padding: 14, borderRadius: "var(--radius)", marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 14, color: "var(--primary-dark)" }}>
              ➕ Anotar Compra de Chuchu ou Desconto
            </h4>
            
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13 }}>Valor (R$)*</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 350.00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                required
                style={{ fontSize: 16, height: 42 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13 }}>Descrição / Motivo</label>
              <input
                type="text"
                placeholder="Ex: Compra de 20 caixas de chuchu"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                style={{ fontSize: 14, height: 40 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13 }}>Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
                style={{ fontSize: 14, height: 40 }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" style={{ height: 42 }}>
              Adicionar Gasto / Compra
            </button>
          </form>

          {/* Lista de Despesas */}
          <div className="modal-items-section">
            <div className="modal-items-title">Registros no Período ({despesasFiltradas.length})</div>
            {despesasFiltradas.length === 0 ? (
              <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "12px 0" }}>
                Nenhum gasto ou compra registrado neste período.
              </p>
            ) : (
              despesasFiltradas.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>
                      {d.descricao || "Compra de chuchu"}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      📅 {formatarDataBR(d.data)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, color: "#c62828", fontSize: 15 }}>
                      - {formatarMoeda(d.valor)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExcluir(d.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        color: "#999",
                        padding: 4,
                      }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline btn-full" onClick={onClose}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
