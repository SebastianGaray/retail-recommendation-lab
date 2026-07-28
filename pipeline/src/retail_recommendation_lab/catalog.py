from decimal import Decimal
from pathlib import Path
from urllib.parse import quote

from pydantic import TypeAdapter

from .contracts import LocalizedText, Product

ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_PATH = ROOT / "artifacts" / "demo" / "catalog.json"
PUBLIC_PATH = ROOT / "apps" / "web" / "public" / "catalog.json"


def image_url(name: str, background: str) -> str:
    return f"https://dummyjson.com/image/640x480/{background}/17201d?text={quote(name)}"


def build_catalog() -> list[Product]:
    rows = [
        (
            "auris_headphones",
            "ELC-1001",
            "Auris Wireless Headphones",
            "Audífonos inalámbricos Auris",
            "Balanced sound for focused days.",
            "Sonido equilibrado para días de concentración.",
            "electronics",
            "audio",
            "89.00",
            None,
            24,
            4.7,
            318,
            ["wireless", "audio"],
            96,
            "d8e7e3",
        ),
        (
            "marea_bottle",
            "SPT-5001",
            "Marea Insulated Bottle",
            "Botella térmica Marea",
            "Cold drinks for 24 hours in a slim steel body.",
            "Bebidas frías por 24 horas en acero liviano.",
            "sports",
            "hydration",
            "28.00",
            None,
            47,
            4.7,
            441,
            ["outdoors", "steel"],
            94,
            "bfd9df",
        ),
        (
            "luma_lamp",
            "HOM-3001",
            "Luma Desk Lamp",
            "Lámpara de escritorio Luma",
            "Warm, adjustable light with a small footprint.",
            "Luz cálida y regulable que ocupa poco espacio.",
            "home",
            "lighting",
            "42.00",
            None,
            31,
            4.8,
            256,
            ["lighting", "desk"],
            92,
            "eadfbd",
        ),
        (
            "vento_backpack",
            "ACC-4001",
            "Vento Travel Backpack",
            "Mochila de viaje Vento",
            "A weather-ready day pack with a laptop sleeve.",
            "Una mochila resistente con espacio para portátil.",
            "accessories",
            "bags",
            "72.00",
            "84.00",
            11,
            4.6,
            203,
            ["travel", "laptop"],
            90,
            "c9d5c8",
        ),
        (
            "nexo_blender",
            "KIT-2001",
            "Nexo Compact Blender",
            "Licuadora compacta Nexo",
            "A quiet blender sized for small kitchens.",
            "Una licuadora silenciosa para cocinas pequeñas.",
            "kitchen",
            "appliances",
            "54.00",
            "69.00",
            16,
            4.5,
            174,
            ["compact", "kitchen"],
            88,
            "f0d9c2",
        ),
        (
            "calma_diffuser",
            "HOM-3002",
            "Calma Aroma Diffuser",
            "Difusor de aromas Calma",
            "A compact diffuser with a soft ambient glow.",
            "Un difusor compacto con una luz ambiental suave.",
            "personal care",
            "wellness",
            "38.00",
            "45.00",
            19,
            4.5,
            147,
            ["wellness", "home"],
            82,
            "d8d0e2",
        ),
        (
            "brisa_kettle",
            "KIT-2002",
            "Brisa Ceramic Kettle",
            "Hervidor cerámico Brisa",
            "A calm countertop kettle with auto shut-off.",
            "Un hervidor sereno con apagado automático.",
            "kitchen",
            "appliances",
            "61.00",
            None,
            0,
            4.4,
            121,
            ["tea", "ceramic"],
            75,
            "d9c7ba",
        ),
        (
            "senda_notebook",
            "OFF-6001",
            "Senda Dotted Notebook",
            "Cuaderno punteado Senda",
            "Lay-flat pages for plans, notes and sketches.",
            "Páginas planas para planes, notas y bocetos.",
            "office",
            "stationery",
            "16.00",
            None,
            63,
            4.3,
            89,
            ["paper", "planning"],
            68,
            "e2d6cb",
        ),
    ]
    return [
        Product(
            id=f"prd_{key}",
            sku=sku,
            name=LocalizedText(en=name_en, es=name_es),
            description=LocalizedText(en=description_en, es=description_es),
            category=category,
            subcategory=subcategory,
            price=Decimal(price),
            original_price=Decimal(original_price) if original_price else None,
            in_stock=quantity > 0,
            inventory_quantity=quantity,
            rating=rating,
            review_count=reviews,
            image_url=image_url(name_en, color),
            tags=tags,
            popularity_score=popularity,
        )
        for key, sku, name_en, name_es, description_en, description_es, category, subcategory, price, original_price, quantity, rating, reviews, tags, popularity, color in rows
    ]


def generate() -> None:
    payload = TypeAdapter(list[Product]).dump_json(build_catalog(), indent=2)
    for path in (ARTIFACT_PATH, PUBLIC_PATH):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload + b"\n")


def validate() -> None:
    catalog = TypeAdapter(list[Product]).validate_json(ARTIFACT_PATH.read_bytes())
    if len({product.id for product in catalog}) != len(catalog):
        raise ValueError("Product IDs must be unique")
    if ARTIFACT_PATH.read_bytes() != PUBLIC_PATH.read_bytes():
        raise ValueError("Published catalog differs from canonical artifact")


if __name__ == "__main__":
    generate()
    validate()
