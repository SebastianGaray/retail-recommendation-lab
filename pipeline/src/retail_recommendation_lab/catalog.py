from decimal import Decimal
from pathlib import Path

from pydantic import TypeAdapter

from .contracts import LocalizedText, Product

ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_PATH = ROOT / "artifacts" / "demo" / "catalog.json"
PUBLIC_PATH = ROOT / "apps" / "web" / "public" / "catalog.json"

# Pinned, curated snapshots from https://dummyjson.com/docs/products. Keeping the
# values in source control makes catalog generation deterministic and prevents a
# network dependency in CI or the public application.
DUMMYJSON_PRODUCT_IDS = (47, 51, 44, 65, 73, 153, 152, 175)


def build_catalog() -> list[Product]:
    rows = [
        (
            "table_lamp",
            "HOM-0047",
            "Table Lamp",
            "Lámpara de mesa",
            "A modern lamp that provides both ambient and task lighting.",
            "Una lámpara moderna que ofrece luz ambiental y de trabajo.",
            "home",
            "home-decoration",
            "49.99",
            "53.80",
            9,
            3.55,
            3,
            ["home decor", "lighting"],
            96,
            "https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp",
        ),
        (
            "boxed_blender",
            "KIT-0051",
            "Boxed Blender",
            "Licuadora compacta",
            "A powerful compact blender for smoothies, shakes and everyday prep.",
            "Una licuadora compacta y potente para batidos y preparaciones diarias.",
            "kitchen",
            "kitchen-accessories",
            "39.99",
            "43.12",
            9,
            4.56,
            3,
            ["kitchen appliances", "blenders"],
            94,
            "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/1.webp",
        ),
        (
            "family_photo_frame",
            "HOM-0044",
            "Family Tree Photo Frame",
            "Marco de fotos familiar",
            "A decorative family-tree frame with multiple spaces for photographs.",
            "Un marco decorativo en forma de árbol con espacios para varias fotografías.",
            "home",
            "home-decoration",
            "29.99",
            "35.23",
            77,
            4.53,
            3,
            ["home decor", "photo frame"],
            92,
            "https://cdn.dummyjson.com/product-images/home-decoration/family-tree-photo-frame/1.webp",
        ),
        (
            "lunch_box",
            "KIT-0065",
            "Lunch Box",
            "Lonchera con compartimentos",
            "A portable meal container with separate compartments for food.",
            "Un recipiente portátil con compartimentos separados para alimentos.",
            "kitchen",
            "kitchen-accessories",
            "12.99",
            "14.49",
            94,
            4.93,
            3,
            ["kitchen tools", "storage"],
            90,
            "https://cdn.dummyjson.com/product-images/kitchen-accessories/lunch-box/1.webp",
        ),
        (
            "spice_rack",
            "KIT-0073",
            "Spice Rack",
            "Especiero organizador",
            "A practical organizer that keeps spices visible and within reach.",
            "Un organizador práctico que mantiene las especias visibles y al alcance.",
            "kitchen",
            "kitchen-accessories",
            "19.99",
            "22.74",
            79,
            4.87,
            3,
            ["kitchen tools", "organization"],
            88,
            "https://cdn.dummyjson.com/product-images/kitchen-accessories/spice-rack/1.webp",
        ),
        (
            "volleyball",
            "SPT-0153",
            "Volleyball",
            "Balón de voleibol",
            "A standard ball designed for passing, setting and spiking over the net.",
            "Un balón estándar diseñado para recibir, colocar y rematar sobre la red.",
            "sports",
            "sports-accessories",
            "11.99",
            "13.66",
            0,
            3.84,
            3,
            ["sports equipment", "volleyball"],
            82,
            "https://cdn.dummyjson.com/product-images/sports-accessories/volleyball/1.webp",
        ),
        (
            "tennis_racket",
            "SPT-0152",
            "Tennis Racket",
            "Raqueta de tenis",
            "A strung racket with a comfortable grip for recreational tennis.",
            "Una raqueta encordada con agarre cómodo para jugar tenis recreativo.",
            "sports",
            "sports-accessories",
            "49.99",
            "62.18",
            6,
            4.03,
            3,
            ["sports equipment", "tennis"],
            75,
            "https://cdn.dummyjson.com/product-images/sports-accessories/tennis-racket/1.webp",
        ),
        (
            "white_backpack",
            "ACC-0175",
            "White Faux Leather Backpack",
            "Mochila blanca de cuero sintético",
            "A practical backpack with a clean design and generous storage space.",
            "Una mochila práctica de diseño limpio y amplio espacio de almacenamiento.",
            "accessories",
            "bags",
            "39.99",
            "47.16",
            39,
            3.36,
            3,
            ["fashion accessories", "backpacks"],
            68,
            "https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/1.webp",
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
            image_url=image_url,
            tags=tags,
            popularity_score=popularity,
        )
        for key, sku, name_en, name_es, description_en, description_es, category, subcategory, price, original_price, quantity, rating, reviews, tags, popularity, image_url in rows
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
