
const API_BASE_URL = 'https://agropad.onrender.com/';

//Get Listar Clientes
async function listarClientes(){
    const response = await fetch(`${API_BASE_URL}clientes`);
    return await response.json();
}

//Post Cadastro de clientes
async function cadastrarCliente(cliente){
    const respose = await fetch(`${API_BASE_URL}clientes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    });
}

// Delete Cliente
async function deletarCliente(id){
    const response = await fetch(`${API_BASE_URL}clientes/${id}`, {
        method: 'DELETE'
    });
}

// Atualizar Cliente
async function atualizarCliente(id, cliente){
    const response = await fetch(`${API_BASE_URL}clientes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    });
}


// Função para exibir os clientes na tela

async function mostrarClientes() {
      const clientes = await listarClientes();
      const lista = document.getElementById("lista-clientes");
      lista.innerHTML = "";
      clientes.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.id} - ${c.nome} (${c.telefone})`;

        // Botão editar
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => editarCliente(c.id, { nome: "Novo Nome", telefone: "0000" });

        // Botão excluir
        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => { removerCliente(c.id); mostrarClientes(); };

        li.appendChild(btnEditar);
        li.appendChild(btnExcluir);
        lista.appendChild(li);
      });
    }

    // Formulário de cadastro
    document.getElementById("form-cliente").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("nome").value;
      const telefone = document.getElementById("telefone").value;
      await cadastrarCliente({ nome, telefone });
      mostrarClientes();
    });

    mostrarClientes();


//Produto
async function listarProdutos() {
    const response = await fetch(`${API_BASE_URL}produtos`);
    return await response.json();
  }

  async function cadastrarProduto(produto) {
    await fetch(`${API_BASE_URL}produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto)
    });
  }

  async function editarProduto(id, produto) {
    await fetch(`${API_BASE_URL}produtos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto)
    });
  }

  async function removerProduto(id) {
    await fetch(`${API_BASE_URL}produtos/${id}`, { method: "DELETE" });
  }

  async function mostrarProdutos() {
    const produtos = await listarProdutos();
    const lista = document.getElementById("lista-produtos");
    lista.innerHTML = "";
    produtos.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.id} - ${p.nome} (R$ ${p.preco})`;

      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "Excluir";
      btnExcluir.onclick = () => { removerProduto(p.id); mostrarProdutos(); };

      li.appendChild(btnExcluir);
      lista.appendChild(li);
    });
  }

  document.getElementById("form-produto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome-produto").value;
    const preco = parseFloat(document.getElementById("preco").value);
    await cadastrarProduto({ nome, preco });
    mostrarProdutos();
  });

  mostrarProdutos();

//Pedidos
async function listarPedidos() {
    const response = await fetch(`${API_BASE_URL}pedidos`);
    return await response.json();
  }

  async function cadastrarPedido(pedido) {
    await fetch(`${API_BASE_URL}pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });
  }

  async function editarPedido(id, pedido) {
    await fetch(`${API_BASE_URL}pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });
  }

  async function removerPedido(id) {
    await fetch(`${API_BASE_URL}pedidos/${id}`, { method: "DELETE" });
  }

  async function mostrarPedidos() {
    const pedidos = await listarPedidos();
    const lista = document.getElementById("lista-pedidos");
    lista.innerHTML = "";
    pedidos.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `Pedido ${p.id} - Cliente ${p.cliente_id}, Produto ${p.produto_id}, Qtd: ${p.quantidade}`;

      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "Excluir";
      btnExcluir.onclick = () => { removerPedido(p.id); mostrarPedidos(); };

      li.appendChild(btnExcluir);
      lista.appendChild(li);
    });
  }

  document.getElementById("form-pedido").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cliente_id = parseInt(document.getElementById("cliente-id").value);
    const produto_id = parseInt(document.getElementById("produto-id").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);
    await cadastrarPedido({ cliente_id, produto_id, quantidade });
    mostrarPedidos();
  });

  mostrarPedidos();