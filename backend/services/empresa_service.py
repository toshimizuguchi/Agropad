from backend.conexao import supabase
from backend.models.empresas import Empresas
from passlib.context import CryptContext 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def listar_empresas():
    resposta = supabase.table("empresas").select("id_empresa, nome_empresa, email").execute()
    return resposta.data

def cadastrar_empresa(empresa : Empresas):
    senha_hash = pwd_context.hash(empresa.senha)
    resposta = supabase.table("empresas").insert({
        "nome_empresa": empresa.nome_empresa, 
        "email":empresa.email, 
        "senha_hash": senha_hash
        }).execute()
    return resposta.data

def atualizar_empresa(id_empresa: int, empresa : Empresas):
    senha_hash = pwd_context.hash(empresa.senha)
    resposta = supabase.table("empresas").update({
        "nome_empresa":empresa.nome_empresa,
        "email": empresa.email,
        "senha_hash": senha_hash
    }).eq("id_empresa", id_empresa).execute()
    return resposta.data

def deletar_empresa(id_empresa : int):
    resposta = supabase.table("empresas").delete().eq("id_empresa", id_empresa).execute()
    return resposta.data