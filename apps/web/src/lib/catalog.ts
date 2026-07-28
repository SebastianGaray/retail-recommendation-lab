export type Locale = "en" | "es";

export interface Product {
  id: string;
  sku: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  category: string;
  subcategory: string | null;
  price: string;
  original_price: string | null;
  in_stock: boolean;
  inventory_quantity: number;
  rating: number;
  review_count: number;
  image_url: string;
  tags: string[];
  popularity_score: number;
}

export function popularityBaseline(
  products: Product[],
  cart: Set<string>,
  limit = 3,
): Product[] {
  return products
    .filter((product) => product.in_stock && !cart.has(product.id))
    .sort(
      (a, b) =>
        b.popularity_score - a.popularity_score || a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

export function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Partial<Product>;
  return (
    typeof product.id === "string" &&
    typeof product.sku === "string" &&
    typeof product.name?.en === "string" &&
    typeof product.name?.es === "string" &&
    typeof product.price === "string" &&
    typeof product.in_stock === "boolean" &&
    typeof product.popularity_score === "number"
  );
}
