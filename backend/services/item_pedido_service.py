from backend.conexao import supabase
from backend.models.itens_pedidos import ItemPedido

def listar_itens_pedidos():
    resposta = supabase.table("itens_pedido").select("*").execute()
    for item in resposta.data:
        item["subtotal"] = item["quantidade"] * item["preco_unitario"]
    return resposta.data

def cadastrar_item_pedido(item_pedido : ItemPedido):
    resposta = supabase.table("itens_pedido").insert({
        "id_pedido": item_pedido.id_pedido,
        "produto": item_pedido.produto,
        "quantidade": item_pedido.quantidade,
        "preco_unitario": item_pedido.preco_unitario
    }).execute()
    for item in resposta.data:
        item["subtotal"] = item["quantidade"] * item["preco_unitario"]
    return resposta.data

def atualizar_item_pedido(id_item_pedido : int, item_pedido : ItemPedido):
    resposta = supabase.table("itens_pedido").update({
        "id_pedido": item_pedido.id_pedido,
        "produto": item_pedido.produto,
        "quantidade": item_pedido.quantidade,
        "preco_unitario": item_pedido.preco_unitario
    }).eq("id_item_pedido", id_item_pedido ).execute()
    for item in resposta.data:
        item["subtotal"] = item["quantidade"] * item["preco_unitario"]
    return resposta.data

def deletar_item_pedido(id_item_pedido : int):
    resposta = (supabase.table("itens_pedido").delete().eq("id_item_pedido", id_item_pedido).execute())
    for item in resposta.data:
        item["subtotal"] = item["quantidade"] * item["preco_unitario"]
    return resposta.data