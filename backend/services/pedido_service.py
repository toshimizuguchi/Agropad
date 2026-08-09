from backend.conexao import supabase
from backend.models.pedidos import Pedido

def listar_pedidos():
    resposta = supabase.table("pedidos").select("*").execute()
    return resposta.data

def cadastrar_pedido(pedido : Pedido):
    resposta = supabase.table("pedidos").insert({"id_cliente": pedido.id_cliente, "data_pedido": pedido.data_pedido.isoformat(), "pago": pedido.pago }).execute()
    return resposta.data

def atualizar_pedido(id_pedido : int, pedido : Pedido):
    resposta = supabase.table("pedidos").update({"data_pedido": pedido.data_pedido.isoformat(), "pago": pedido.pago}).eq("id_pedido", id_pedido ).execute()
    return resposta.data

def deletar_pedido(id_pedido : int):
    resposta = (supabase.table("pedidos").delete().eq("id_pedido", id_pedido).execute())
    return resposta.data