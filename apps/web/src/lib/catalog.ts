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
  | "item-similarity"
  | "hybrid";
export type ReasonCode =
  | "global_popularity"
  | "category_popularity"
  | "frequently_bought_together"
  | "item_similarity"
  | "hybrid_ranker"
  | "empty_cart_fallback"
  | "strategy_coverage_fallback"
  | "artifact_unavailable_fallback";
export interface Candidate {
  product_id: string;
  score: number;
  rank: number;
  category?: string;
}
export interface Artifact<T> {
  schema_version: string;
  dataset_version: string;
  seed: number;
  data: T;
}

export function recommendations(
  products: Product[],
  cart: ReadonlyMap<string, number>,
  strategy: Strategy,
  artifacts: Record<Strategy, Candidate[] | Record<string, Candidate[]>>,
  limit = 3,
  unavailableStrategies: ReadonlySet<Strategy> = new Set(),
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
  } else {
    const aggregated = new Map<string, Candidate>();
    for (const [sourceId, quantity] of cart) {
      for (const candidate of (
        artifacts[strategy] as Record<string, Candidate[]>
      )[sourceId] ?? []) {
        const current = aggregated.get(candidate.product_id);
        aggregated.set(candidate.product_id, {
          product_id: candidate.product_id,
          score: (current?.score ?? 0) + candidate.score * quantity,
          rank: Math.min(current?.rank ?? candidate.rank, candidate.rank),
        });
      }
    }
    candidates = [...aggregated.values()];
  }
  const codes: Record<Strategy, ReasonCode> = {
    popularity: "global_popularity",
    "category-popularity": "category_popularity",
    "frequently-bought-together": "frequently_bought_together",
    "item-similarity": "item_similarity",
    hybrid: "hybrid_ranker",
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
  const fallbackReason: ReasonCode = unavailableStrategies.has(strategy)
    ? "artifact_unavailable_fallback"
    : strategy !== "popularity" && cart.size === 0
      ? "empty_cart_fallback"
      : "strategy_coverage_fallback";
  const excluded = new Set([
    ...cart.keys(),
    ...selected.map(({ product }) => product.id),
  ]);
  const fallback = popularityBaseline(
    products,
    excluded,
    limit - selected.length,
  ).map((product) => ({ product, reason: fallbackReason }));
  return [...selected, ...fallback];
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

export function filterAndSortProducts(
  products: Product[],
  query: string,
  category: string,
  sort: string,
  locale: Locale,
): Product[] {
  const normalized = query.trim().toLocaleLowerCase(locale);
  return products
    .filter(
      (product) =>
        (!category || product.category === category) &&
        (!normalized ||
          `${product.name[locale]} ${product.description[locale]} ${product.sku}`
            .toLocaleLowerCase(locale)
            .includes(normalized)),
    )
    .sort((a, b) => {
      if (sort === "price-asc")
        return Number(a.price) - Number(b.price) || a.id.localeCompare(b.id);
      if (sort === "price-desc")
        return Number(b.price) - Number(a.price) || a.id.localeCompare(b.id);
      if (sort === "rating")
        return b.rating - a.rating || a.id.localeCompare(b.id);
      return (
        b.popularity_score - a.popularity_score || a.id.localeCompare(b.id)
      );
    });
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
