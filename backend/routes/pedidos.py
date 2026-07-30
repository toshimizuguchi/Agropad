from fastapi import APIRouter
from backend.conexao import supabase
from backend.models.pedidos import Pedido
from backend.services import pedido_service

router = APIRouter(
    prefix = "/pedidos",
    tags =  ["Pedidos"]
)

@router.get("/")
def listar():
    return pedido_service.listar_pedidos()

@router.post("/")
def cadastrar(pedido : Pedido):
    return pedido_service.cadastrar_pedido(pedido)

@router.put("/{id_pedido}")
def atualizar(id_pedido: int, pedido : Pedido):
    return pedido_service.atualizar_pedido(id_pedido, pedido)

@router.delete("/{id_pedido}")
def deletar(id_pedido: int):
    return pedido_service.deletar_pedido(id_pedido)