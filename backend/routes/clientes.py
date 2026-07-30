from fastapi import APIRouter
from backend.conexao import supabase
from backend.models.clientes import Cliente
from backend.services import cliente_service

router = APIRouter(
    prefix = "/clientes",
    tags = ["Clientes"]
)

@router.get("/")
def listar():
    return cliente_service.listar_clientes()

@router.post("/")
def cadastrar(cliente : Cliente):
    return cliente_service.cadastrar_clientes(cliente)

@router.put("/{id_cliente}")
def atualizar(id_cliente : int, cliente : Cliente ):
    return cliente_service.atualizar_clientes(id_cliente, cliente)

@router.delete("/{id_cliente}")
def deletar(id_cliente : int):
    return cliente_service.deletar_clientes(id_cliente)