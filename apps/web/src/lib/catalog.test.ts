import { describe, expect, it } from "vitest";

import { popularityBaseline, type Product } from "./catalog";

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
