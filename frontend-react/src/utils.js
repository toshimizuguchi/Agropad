// Utilitários compartilhados — igual ao app.js original
export function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarCaixas(valor) {
  return (valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatarDataBR(isoDate) {
  if (!isoDate) return "";
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extrairUnidadeDoNome(textoProduto) {
  if (textoProduto.endsWith(" - meia caixa")) {
    return { nomeBase: textoProduto.replace(" - meia caixa", ""), unidade: "meia_caixa" };
  }
  if (textoProduto.endsWith(" - kg")) {
    return { nomeBase: textoProduto.replace(" - kg", ""), unidade: "kg" };
  }
  return { nomeBase: textoProduto, unidade: "caixa" };
}

export function precoPorUnidade(produtoLocal, unidade) {
  if (!produtoLocal) return null;
  if (unidade === "caixa") return produtoLocal.preco;
  if (unidade === "meia_caixa") return produtoLocal.preco / 2;
  if (unidade === "kg") return produtoLocal.precoKg ?? null;
  return null;
}

export function extrairFracaoCaixa(textoProduto) {
  const texto = (textoProduto || "").toLowerCase();
  if (texto.includes(" - meia caixa")) return 0.5;
  if (texto.includes(" - kg")) return null;
  if (/\b3\/4\b|0[.,]75/.test(texto)) return 0.75;
  if (/\b1\/4\b|0[.,]25|quarto/.test(texto)) return 0.25;
  if (/\b1\/2\b|0[.,]5\b|meia|meio/.test(texto)) return 0.5;
  return 1;
}

export function linkWhatsapp(pedido, mensagem) {
  const numero = (pedido.telefone || "").replace(/\D/g, "");
  const prefixo = numero.length > 0 && !numero.startsWith("55") ? "55" : "";
  const url = numero
    ? `https://wa.me/${prefixo}${numero}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

export function montarMensagemPedido(pedido) {
  const itens = pedido.itens
    .map((i) => `- ${i.quantidade}x ${i.produto}: ${formatarMoeda(i.subtotal)}`)
    .join("\n");
  return `Olá ${pedido.cliente}! Segue o resumo do seu pedido (${formatarDataBR(pedido.data)}):\n${itens}\n\nTotal: ${formatarMoeda(pedido.total)}\nStatus: ${pedido.pago ? "Pago ✅" : "Pendente ⏳"}`;
}

export function montarMensagemCobrancaLote(grupo) {
  const varios = grupo.pedidos.length > 1;
  const linhas = grupo.pedidos
    .map((p) => `• Entrega de ${formatarDataBR(p.data)}: ${formatarMoeda(p.total)}`)
    .join("\n");
  return `Olá ${grupo.cliente}! Tudo bem?\n\nPassando para enviar o resumo ${varios ? "das suas entregas pendentes" : "da sua entrega pendente"}:\n\n${linhas}\n\n*VALOR TOTAL A PAGAR: ${formatarMoeda(grupo.total)}*\n\nPoderia confirmar a previsão de pagamento ou enviar o comprovante? Obrigado! 🌿`;
}
