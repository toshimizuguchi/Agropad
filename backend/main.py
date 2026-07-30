from fastapi import FastAPI
from backend.models.clientes import Cliente
from backend.routes.clientes import router as clientes_router
from backend.routes.pedidos import router as pedidos_router
app = FastAPI()

app.include_router(clientes_router)
app.include_router(pedidos_router)

@app.get("/")
def inicio():
    return {"message": "API funcionando!!!"}
