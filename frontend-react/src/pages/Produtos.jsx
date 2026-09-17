import { useState } from "react";
import { useStore } from "../store/useStore";
import { formatarMoeda } from "../utils";

export default function Produtos() {
  const produtos = useStore((s) => s.produtos);
  const salvarProduto = useStore((s) => s.salvarProduto);
  const excluirProduto = useStore((s) => s.excluirProduto);
  const mostrarToast = useStore((s) => s.mostrarToast);

  const [form, setForm] = useState({ nome: "", preco: "", precoKg: "" });
  const [editandoId, setEditandoId] = useState(null);

  function resetForm() {
    setForm({ nome: "", preco: "", precoKg: "" });
    setEditandoId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nome = form.nome.trim();
    const preco = parseFloat(form.preco);
    const precoKg = form.precoKg === "" ? null : parseFloat(form.precoKg);
    if (!nome || isNaN(preco)) return;

    salvarProduto({ id: editandoId || undefined, nome, preco, precoKg });
    mostrarToast(editandoId ? "Produto atualizado! ✅" : "Produto cadastrado! ✅");
    resetForm();
  }

  function iniciarEdicao(p) {
    setEditandoId(p.id);
    setForm({ nome: p.nome, preco: p.preco, precoKg: p.precoKg ?? "" });
  }

  function handleExcluir(id) {
    if (confirm("Excluir este produto?")) {
      excluirProduto(id);
      mostrarToast("Produto excluído.");
    }
  }

  return (
    <section className="app-section">
      <div className="section-header">
        <h2>Meus Produtos</h2>
        <p className="section-subtitle">Preço por caixa de cada produto</p>
      </div>

      <form className="styled-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do Produto</label>
          <input
            type="text"
            placeholder="Ex: Pitaya Vermelha"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Preço da Caixa (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="45.00"
            value={form.preco}
            onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Preço por Kg (R$) — opcional</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="8.50"
            value={form.precoKg}
            onChange={(e) => setForm((f) => ({ ...f, precoKg: e.target.value }))}
          />
        </div>
        <div className="form-actions-inline">
          <button type="submit" className="btn btn-primary btn-full">
            {editandoId ? "Atualizar Produto" : "Salvar Produto"}
          </button>
          {editandoId && (
            <button type="button" className="btn btn-outline btn-full" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="card-section" style={{ marginTop: 20 }}>
        <div className="card-section-header">
          <h3>Produtos Cadastrados</h3>
        </div>
        <div className="products-list">
          {produtos.length === 0 ? (
            <div className="empty-state"><p>Nenhum produto cadastrado ainda.</p></div>
          ) : (
            produtos.map((p) => (
              <div key={p.id} className="product-item">
                <div className="product-info">
                  <span className="product-name">{p.nome}</span>
                  <span className="product-price">
                    {formatarMoeda(p.preco)} / caixa · {formatarMoeda(p.preco / 2)} / meia caixa
                    {p.precoKg ? ` · ${formatarMoeda(p.precoKg)} / kg` : ""}
                  </span>
                </div>
                <div className="product-actions">
                  <button
                    className="btn-icon-only"
                    onClick={() => iniciarEdicao(p)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon-only"
                    onClick={() => handleExcluir(p.id)}
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
    </section>
  );
}
