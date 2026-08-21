from fastapi import APIRouter
from backend.conexao import supabase
from backend.models.empresas import Empresas
from backend.services import empresa_service
from backend.security.auth import verificar_senha
from fastapi import Depends

router = APIRouter(
    prefix="/empresas",
    tags=["Empresas"],
)

@router.get("/", dependencies=[Depends(verificar_senha)])
def listar():
    return empresa_service.listar_empresas()

@router.post("/")
def cadastrar(empresa : Empresas):
    return empresa_service.cadastrar_empresa(empresa)

@router.put("/{id_empresa}", dependencies=[Depends(verificar_senha)])
def atualizar(id_empresa : int, empresa : Empresas):
    return empresa_service.atualizar_empresa(id_empresa, empresa)

@router.delete("/{id_empresa}", dependencies=[Depends(verificar_senha)])
def deletar(id_empresa : int):
    return empresa_service.deletar_empresa(id_empresa)