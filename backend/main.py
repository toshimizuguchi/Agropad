from fastapi import FastAPI
from backend.conexao import supabase
from pydantic import BaseModel

app = FastAPI()
@app.get("/")
def inicio():
    return {"message": "API funcionando!!!"}

class Cliente(BaseModel):
    nome : str
    telefone : str
    
    
@app.get("/clientes")
def listar_clientes():
    resposta = supabase.table("clientes").select("*").execute()
    return resposta.data

@app.post("/clientes")
def cadastrar_clientes(cliente: Cliente):
    resposta = (supabase.table("clientes")
                .insert({ "nome": cliente.nome, "telefone": cliente.telefone }).execute())
    return resposta.data
