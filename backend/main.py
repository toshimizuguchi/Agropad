from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi import Depends
import os

from backend.routes.clientes import router as clientes_router
from backend.routes.pedidos import router as pedidos_router
from backend.routes.itens_pedidos import router as itens_pedidos_router
from backend.routes.empresas import router as empresas_router
from backend.security.auth import verificar_senha

app = FastAPI()
app.add_middleware(
CORSMiddleware,
allow_origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://agropad-two.vercel.app"
],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


app.include_router(clientes_router, dependencies=[Depends(verificar_senha)])
app.include_router(pedidos_router, dependencies=[Depends(verificar_senha)])
app.include_router(itens_pedidos_router, dependencies=[Depends(verificar_senha)])
app.include_router(empresas_router)
@app.get("/")
def inicio():
    return {"message": "API funcionando!!!"}
