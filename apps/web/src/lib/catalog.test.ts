import { describe, expect, it } from "vitest";

import {
  filterAndSortProducts,
  popularityBaseline,
  recommendations,
  type Candidate,
  type Product,
  type Strategy,
} from "./catalog";

const product = (
  id: string,
  popularity_score: number,
  in_stock = true,
): Product => ({
  id,
  sku: "TST-1000",
  name: { en: id, es: id },
  description: { en: id, es: id },
  category: "test",
  subcategory: null,
  price: "10.00",
  original_price: null,
  in_stock,
  inventory_quantity: in_stock ? 1 : 0,
  rating: 4,
  review_count: 1,
  image_url: "https://example.com/image",
  tags: [],
  popularity_score,
});

describe("filterAndSortProducts", () => {
  const products = [
    {
      ...product("bottle", 20),
      name: { en: "Glass Bottle", es: "Botella de vidrio" },
      category: "home",
      price: "18.00",
      rating: 4.8,
    },
    {
      ...product("board", 30),
      name: { en: "Cutting Board", es: "Tabla de cortar" },
      category: "kitchen",
      price: "12.00",
      rating: 4.3,
    },
  ];

  it("searches localized names and filters categories", () => {
    expect(
      filterAndSortProducts(products, "botella", "", "featured", "es"),
    ).toEqual([products[0]]);
    expect(
      filterAndSortProducts(products, "", "kitchen", "featured", "en"),
    ).toEqual([products[1]]);
  });

  it("sorts deterministically by price and rating", () => {
    expect(
      filterAndSortProducts(products, "", "", "price-asc", "en").map(
        ({ id }) => id,
      ),
    ).toEqual(["board", "bottle"]);
    expect(
      filterAndSortProducts(products, "", "", "rating", "en").map(
        ({ id }) => id,
      ),
    ).toEqual(["bottle", "board"]);
  });
});

describe("recommendations", () => {
  const products = [
    product("cart", 100),
    product("match", 50),
    product("sold", 90, false),
  ];
  const artifacts = {
    popularity: [
      { product_id: "sold", score: 99, rank: 1 },
      { product_id: "match", score: 8, rank: 2 },
    ],
    "category-popularity": [],
    "frequently-bought-together": {
      cart: [
        { product_id: "match", score: 3, rank: 1 },
        { product_id: "cart", score: 2, rank: 2 },
      ],
    },
    "item-similarity": {},
    hybrid: {},
  } as Record<Strategy, Candidate[] | Record<string, Candidate[]>>;

  it("uses cart-aware mappings and excludes cart and stock", () => {
    expect(
      recommendations(
        products,
        new Set(["cart"]),
        "frequently-bought-together",
        artifacts,
      ),
    ).toEqual([{ product: products[1], reason: "frequently_bought_together" }]);
  });

  it("falls back deterministically for sparse mappings", () => {
    expect(
      recommendations(
        products,
        new Set(["cart"]),
        "item-similarity",
        artifacts,
      )[0],
    ).toEqual({ product: products[1], reason: "cold_start_fallback" });
  });
});

describe("popularityBaseline", () => {
  it("returns the most popular available products outside the cart", () => {
    const products = [
      product("low", 10),
      product("high", 90),
      product("sold", 100, false),
    ];

    expect(popularityBaseline(products, new Set(["low"]))).toEqual([
      products[1],
    ]);
  });
});
