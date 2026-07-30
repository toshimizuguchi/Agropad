from pydantic import BaseModel

class Cliente(BaseModel):
    nome : str
    telefone : str