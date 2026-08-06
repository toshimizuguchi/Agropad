from fastapi import APIRouter
from backend.conexao import supabase
from backend.models.itens_pedidos import ItemPedido
from backend.services import item_pedido_service

router = APIRouter(
    prefix = "/itens_pedidos",
    tags =  ["Itens Pedidos"]
)

@router.get("/")
def listar():
    return item_pedido_service.listar_itens_pedidos()

@router.post("/")
def cadastrar(item_pedido : ItemPedido):
    return item_pedido_service.cadastrar_item_pedido(item_pedido)

@router.put("/{id_item_pedido}")
def atualizar(id_item_pedido: int, item_pedido : ItemPedido):
    return item_pedido_service.atualizar_item_pedido(id_item_pedido, item_pedido)

@router.delete("/{id_item_pedido}")
def deletar(id_item_pedido: int):
    return item_pedido_service.deletar_item_pedido(id_item_pedido)