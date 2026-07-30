from fastapi import FastAPI
from backend.models.clientes import Cliente
from backend.routes.clientes import router as clientes_router
app = FastAPI()

app.include_router(clientes_router)

@app.get("/")
def inicio():
    return {"message": "API funcionando!!!"}

