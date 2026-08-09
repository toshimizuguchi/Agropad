from pydantic import BaseModel

class ItemPedido(BaseModel):
    id_pedido: int
    produto: str
    quantidade: int
    preco_unitario: float
    subtotal : float = 0.0