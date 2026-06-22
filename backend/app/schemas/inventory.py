from pydantic import BaseModel


class InventoryItemOut(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    sku: str
    color: str
    size: str
    stock: int

    class Config:
        from_attributes = True
