from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LocalizedText(BaseModel):
    model_config = ConfigDict(frozen=True)

    en: str = Field(min_length=1)
    es: str = Field(min_length=1)


class Product(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str = Field(pattern=r"^prd_[a-z0-9_]+$")
    sku: str = Field(pattern=r"^[A-Z]{3}-\d{4}$")
    name: LocalizedText
    description: LocalizedText
    category: str
    subcategory: str | None = None
    price: Decimal = Field(gt=0, decimal_places=2)
    original_price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    in_stock: bool
    inventory_quantity: int = Field(ge=0)
    rating: float = Field(ge=0, le=5)
    review_count: int = Field(ge=0)
    image_url: str
    tags: list[str]
    popularity_score: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def validate_inventory_and_discount(self) -> "Product":
        if self.in_stock != (self.inventory_quantity > 0):
            raise ValueError("in_stock must match inventory_quantity")
        if self.original_price is not None and self.original_price <= self.price:
            raise ValueError("original_price must exceed price")
        return self
