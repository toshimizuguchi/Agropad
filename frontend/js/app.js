const API_BASE_URL = "https://agropad.onrender.com/";

// ---------------- Navegação ----------------
function mostrarSecao(secaoId) {
  const secoes = document.querySelectorAll("section");
  secoes.forEach(secao => secao.style.display = "none");
  document.getElementById(secaoId).style.display = "block";
}

// Inicializa navegação
document.getElementById("btnPainel").addEventListener("click", () => mostrarSecao("painel"));
document.getElementById("btnNovoPedido").addEventListener("click", () => mostrarSecao("novo-pedido"));
document.getElementById("btnPedidos").addEventListener("click", () => mostrarSecao("pedidos"));
document.getElementById("btnProdutos").addEventListener("click", () => mostrarSecao("produtos"));
document.getElementById("btnConfig").addEventListener("click", () => mostrarSecao("config"));

mostrarSecao("painel"); // abre painel por padrão

// ---------------- Clientes ----------------
async function listarClientes() {
  const resp = await fetch(`${API_BASE_URL}clientes/`);
  return await resp.json();
}

async function cadastrarCliente(cliente) {
  await fetch(`${API_BASE_URL}clientes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente)
  });
}

// ---------------- Pedidos ----------------
async function listarPedidos() {
  const resp = await fetch(`${API_BASE_URL}pedidos/`);
  return await resp.json();
}

async function cadastrarPedido(pedido) {
  await fetch(`${API_BASE_URL}pedidos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido)
  });
}

// ---------------- Itens de Pedido ----------------
async function listarItensPedido() {
  const resp = await fetch(`${API_BASE_URL}itens_pedidos/`);
  return await resp.json();
}

async function cadastrarItemPedido(item) {
  await fetch(`${API_BASE_URL}itens_pedidos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });
}

// ---------------- Produtos (localStorage) ----------------
function listarProdutosLocal() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarProdutoLocal(produto) {
  const produtos = listarProdutosLocal();
  produtos.push(produto);
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

// ---------------- Painel ----------------
async function atualizarPainel() {
  const clientes = await listarClientes();
  const pedidos = await listarPedidos();
  const itens = await listarItensPedido();

  document.getElementById("total-clientes").textContent = clientes.length;
  document.getElementById("total-pedidos").textContent = pedidos.length;
  document.getElementById("total-itens").textContent = itens.length;
}

// ---------------- Inicialização ----------------
atualizarPainel();
