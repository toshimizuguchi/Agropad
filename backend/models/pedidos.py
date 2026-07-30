from pydantic import BaseModel
from datetime import date

class Pedido(BaseModel):
    id_cliente: int
    data_pedido: date
    pago : bool