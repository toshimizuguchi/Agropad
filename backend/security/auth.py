import os
from fastapi import Header, HTTPException

api_key = os.getenv("API_KEY")

def verificar_senha(x_api_key: str = Header(default=None)):
    if x_api_key != api_key:
        raise HTTPException(status_code=401, detail="Chave de API inválida")