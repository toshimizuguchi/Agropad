from backend.conexao import supabase
from backend.models.clientes import Cliente

def listar_clientes():
    resposta = supabase.table("clientes").select("*").execute()
    return resposta.data

def cadastrar_clientes(cliente: Cliente):
    resposta = (supabase.table("clientes")
                .insert({ "nome": cliente.nome, "telefone": cliente.telefone }).execute())
    return resposta.data

def atualizar_clientes(id_cliente: int, cliente: Cliente):
    resposta = (supabase.table("clientes").update({"nome": cliente.nome, "telefone": cliente.telefone}).eq("id_cliente", id_cliente).execute())
    return resposta.data

def deletar_clientes(id_cliente: int):
    resposta = (supabase.table("clientes").delete().eq("id_cliente", id_cliente).execute())
    return resposta.data