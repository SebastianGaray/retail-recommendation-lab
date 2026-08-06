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

export type Strategy =
  | "popularity"
  | "category-popularity"
  | "frequently-bought-together"
  | "item-similarity";
export type ReasonCode =
  | "global_popularity"
  | "category_popularity"
  | "frequently_bought_together"
  | "item_similarity"
  | "cold_start_fallback";
export interface Candidate {
  product_id: string;
  score: number;
  rank: number;
}
export interface Artifact<T> {
  schema_version: string;
  dataset_version: string;
  seed: number;
  data: T;
}

export function recommendations(
  products: Product[],
  cart: Set<string>,
  strategy: Strategy,
  artifacts: Record<Strategy, Candidate[] | Record<string, Candidate[]>>,
  limit = 3,
): Array<{ product: Product; reason: ReasonCode }> {
  const byId = new Map(products.map((product) => [product.id, product]));
  let candidates: Candidate[] = [];
  if (strategy === "popularity")
    candidates = artifacts.popularity as Candidate[];
  else if (strategy === "category-popularity") {
    const categories = new Set(
      products.filter((p) => cart.has(p.id)).map((p) => p.category),
    );
    candidates = (
      artifacts["category-popularity"] as Array<
        Candidate & { category: string }
      >
    ).filter((row) => categories.has(row.category));
  } else
    candidates = [...cart].flatMap(
      (id) => (artifacts[strategy] as Record<string, Candidate[]>)[id] ?? [],
    );
  const codes: Record<Strategy, ReasonCode> = {
    popularity: "global_popularity",
    "category-popularity": "category_popularity",
    "frequently-bought-together": "frequently_bought_together",
    "item-similarity": "item_similarity",
  };
  const seen = new Set<string>();
  const selected = candidates
    .sort(
      (a, b) => b.score - a.score || a.product_id.localeCompare(b.product_id),
    )
    .flatMap((candidate) => {
      const product = byId.get(candidate.product_id);
      if (
        !product ||
        !product.in_stock ||
        cart.has(product.id) ||
        seen.has(product.id)
      )
        return [];
      seen.add(product.id);
      return [{ product, reason: codes[strategy] }];
    })
    .slice(0, limit);
  return selected.length
    ? selected
    : popularityBaseline(products, cart, limit).map((product) => ({
        product,
        reason: "cold_start_fallback",
      }));
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
