
const API_BASE_URL = 'https://agropad.onrender.com/';

async function listarClientes(){
    const response = await fetch(`${API_BASE_URL}clientes`);
    const clientes = await response.json();
    return clientes;
}
listarClientes().then(clientes => console.log(clientes));