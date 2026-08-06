from backend.conexao import supabase

def listar_itens_pedidos():
    resposta = supabase.table("itens_pedido").select("*").execute()
    return resposta.data

def cadastrar_item_pedido(item_pedido : ItemPedido):
    subtotal = item_pedido.quantidade * item_pedido.preco_unitario
    item_pedido.subtotal = subtotal
    resposta = supabase.table("itens_pedido").insert({"id_pedido": item_pedido.id_pedido, "produto": item_pedido.produto, "quantidade": item_pedido.quantidade, "preco_unitario": item_pedido.preco_unitario, "subtotal": item_pedido.subtotal }).execute()
    return resposta.data

def atualizar_item_pedido(id_item_pedido : int, item_pedido : ItemPedido):
    subtotal = item_pedido.quantidade * item_pedido.preco_unitario
    item_pedido.subtotal = subtotal
    resposta = supabase.table("itens_pedido").update({"id_pedido": item_pedido.id_pedido, "produto": item_pedido.produto, "quantidade": item_pedido.quantidade, "preco_unitario": item_pedido.preco_unitario, "subtotal": item_pedido.subtotal}).eq("id_item_pedido", id_item_pedido ).execute()
    return resposta.data

def deletar_item_pedido(id_item_pedido : int):
    resposta = (supabase.table("itens_pedido").delete().eq("id_item_pedido", id_item_pedido).execute())
    return resposta.data