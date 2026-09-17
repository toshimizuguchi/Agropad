// Todas as chamadas à API — usa proxy em DEV e Render em produção
const API_BASE_URL = import.meta.env.DEV ? "" : "https://agropad.onrender.com";

let _senha = localStorage.getItem("agropad_senha_api");

export function getSenha() {
  return _senha;
}

export function setSenha(s) {
  _senha = s || null;
  if (s) {
    localStorage.setItem("agropad_senha_api", s);
  } else {
    localStorage.removeItem("agropad_senha_api");
    sessionStorage.removeItem("agropad_senha_api");
  }
}

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", "x-api-key": _senha },
    ...options,
  });
  if (!resp.ok) {
    const texto = await resp.text().catch(() => "");
    throw new Error(`Erro ${resp.status} em ${path}: ${texto}`);
  }
  return resp.json();
}

export const api = {
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
