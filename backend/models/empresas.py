from pydantic import BaseModel


class Empresas(BaseModel):
    nome_empresa : str
    email : str
    senha : str