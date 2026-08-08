import {
  filterAndSortProducts,
  isProduct,
  recommendations,
  type Artifact,
  type Candidate,
  type Locale,
  type Product,
  type Strategy,
} from "../lib/catalog";
import type { StorefrontMessages } from "../i18n/messages";

type Metric = {
  strategy: string;
  k: number;
  precision: number;
  recall: number;
  hit_rate: number;
  catalog_coverage: number;
};
const body = document.body;
const locale = body.dataset.locale as Locale;
const {
  catalogUrl,
  artifactBase,
  evaluationUrl,
  hybridUrl,
  copy: rawCopy,
} = body.dataset;
if (
  !catalogUrl ||
  !artifactBase ||
  !evaluationUrl ||
  !hybridUrl ||
  !rawCopy ||
  !["en", "es"].includes(locale)
)
  throw new Error("Storefront configuration is invalid");
const copy = JSON.parse(rawCopy) as StorefrontMessages;
const byId = <T extends HTMLElement>(id: string): T => {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}`);
  return value as T;
};
const productGrid = byId("product-grid"),
  cartList = byId("cart-list"),
  cartCount = byId("cart-count"),
  cartSubtotal = byId("cart-subtotal"),
  recommendationGrid = byId("recommendation-grid"),
  comparison = byId("strategy-comparison"),
  artifactError = byId("artifact-error"),
  hybridSignals = byId("hybrid-signals"),
  hybridSignalList = byId("hybrid-signal-list"),
  status = byId("cart-status");
const search = byId<HTMLInputElement>("search"),
  category = byId<HTMLSelectElement>("category"),
  sort = byId<HTMLSelectElement>("sort"),
  strategy = byId<HTMLSelectElement>("strategy"),
  theme = byId<HTMLSelectElement>("theme");
const cartDialog = byId<HTMLDialogElement>("cart-dialog"),
  productDialog = byId<HTMLDialogElement>("product-dialog"),
  productDetail = byId("product-detail");
const storageKey = "rrl-cart-v2";
const currency = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
});
let products: Product[] = [];
let metrics: Metric[] = [];
let hybridWeights: Record<string, number> = {};
const artifactNames: Strategy[] = [
  "popularity",
  "category-popularity",
  "frequently-bought-together",
  "item-similarity",
  "hybrid",
];
let artifacts = {} as Record<
  Strategy,
  Candidate[] | Record<string, Candidate[]>
>;

function restoreCart(): Map<string, number> {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "{}",
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return new Map();
    return new Map(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" &&
          Number.isInteger(entry[1]) &&
          entry[1] > 0,
      ),
    );
  } catch {
    return new Map();
  }
}
const cart = restoreCart();
const cartIds = (): Set<string> => new Set(cart.keys());
function persist(): void {
  localStorage.setItem(
    storageKey,
    JSON.stringify(Object.fromEntries([...cart].sort())),
  );
}
function image(product: Product): string {
  return `<div class="product-image"><img src="${product.image_url}" alt="${product.name[locale]} — ${product.description[locale]}" width="640" height="480" loading="lazy" decoding="async"><span aria-hidden="true">${copy.fallback}</span></div>`;
}
function card(product: Product): string {
  const disabled = product.in_stock ? "" : "disabled";
  return `<article class="product-card" data-product-card="${product.id}">${image(product)}<div class="product-body"><div class="product-meta"><span>${product.category}</span><span>★ ${product.rating.toFixed(1)}</span></div><h3>${product.name[locale]}</h3><p class="description">${product.description[locale]}</p><div class="product-action"><strong>${currency.format(Number(product.price))}</strong><div class="product-buttons"><button type="button" data-detail="${product.id}">${copy.details}</button><button type="button" data-add="${product.id}" ${disabled}>${product.in_stock ? copy.add : copy.soldOut}</button></div></div></div></article>`;
}

function renderCatalog(): void {
  const visible = filterAndSortProducts(
    products,
    search.value,
    category.value,
    sort.value,
    locale,
  );
  productGrid.innerHTML = visible.length
    ? visible.map(card).join("")
    : `<p class="error-state">${copy.noResults}</p>`;
  productGrid.setAttribute("aria-busy", "false");
}
function renderCart(): void {
  const rows = [...cart].flatMap(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return product ? [{ product, quantity }] : [];
  });
  cartCount.textContent = String(
    rows.reduce((sum, row) => sum + row.quantity, 0),
  );
  cartSubtotal.textContent = currency.format(
    rows.reduce(
      (sum, row) => sum + Number(row.product.price) * row.quantity,
      0,
    ),
  );
  cartList.innerHTML = rows.length
    ? rows
        .map(
          ({ product, quantity }) =>
            `<article class="cart-row"><div><h3>${product.name[locale]}</h3><p>${currency.format(Number(product.price))}</p><div class="quantity-control"><button type="button" data-quantity="${product.id}" data-delta="-1" aria-label="${copy.decrease}: ${product.name[locale]}">−</button><span aria-label="${copy.quantity}">${quantity}</span><button type="button" data-quantity="${product.id}" data-delta="1" aria-label="${copy.increase}: ${product.name[locale]}">+</button></div></div><button type="button" class="remove-button" data-remove="${product.id}">${copy.remove}</button></article>`,
        )
        .join("")
    : `<p>${copy.empty}</p>`;
}
function renderRecommendations(): void {
  const rows = recommendations(
    products,
    cartIds(),
    strategy.value as Strategy,
    artifacts,
  );
  recommendationGrid.innerHTML = rows
    .map(
      ({ product, reason }) =>
        `<article class="recommendation-card">${image(product)}<span class="reason-badge">${copy[reason]}</span><h3>${product.name[locale]}</h3><p>${copy.reasonTitle}</p><div class="product-action"><strong>${currency.format(Number(product.price))}</strong><button type="button" data-add="${product.id}">${copy.add}</button></div></article>`,
    )
    .join("");
}
function renderMetrics(): void {
  const definitions = [
    copy.metricPrecision,
    copy.metricRecall,
    copy.metricHit,
    copy.metricCoverage,
  ];
  comparison.innerHTML = metrics
    .filter((row) => row.k === 3)
    .map(
      (row) =>
        `<article class="metric-card"><span class="metric-label">${row.strategy}</span><strong>${(row.hit_rate * 100).toFixed(1)}%</strong><p>${copy.hitRate}</p><details><summary>${copy.details}</summary><p>${copy.precision}: ${(row.precision * 100).toFixed(1)}% · ${copy.recall}: ${(row.recall * 100).toFixed(1)}% · ${copy.coverage}: ${(row.catalog_coverage * 100).toFixed(1)}%</p><p>${definitions.join(" ")}</p></details></article>`,
    )
    .join("");
}
function updateCart(id: string, delta: number): void {
  const product = products.find((item) => item.id === id);
  if (!product || !product.in_stock) return;
  const next = Math.max(
    0,
    Math.min(product.inventory_quantity, (cart.get(id) ?? 0) + delta),
  );
  if (next) cart.set(id, next);
  else cart.delete(id);
  persist();
  renderCart();
  renderRecommendations();
  status.textContent = `${product.name[locale]} ${delta > 0 ? copy.statusAdded : copy.statusRemoved}`;
}
function openCart(): void {
  if (productDialog.open) productDialog.close();
  if (!cartDialog.open) cartDialog.showModal();
}
function renderHybridSignals(): void {
  hybridSignals.hidden = strategy.value !== "hybrid";
  if (hybridSignals.hidden) return;
  const labels: Record<string, string> = {
    popularity: copy.signalPopularity,
    category: copy.signalCategory,
    basket: copy.signalBasket,
    similarity: copy.signalSimilarity,
    novelty: copy.signalNovelty,
  };
  hybridSignalList.innerHTML = Object.entries(labels)
    .map(
      ([signal, label]) =>
        `<li>${label}: ${Math.round((hybridWeights[signal] ?? 0) * 100)}%</li>`,
    )
    .join("");
}
function showProduct(id: string): void {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  productDetail.innerHTML = `<div class="detail-layout">${image(product)}<div class="detail-copy"><span class="reason-badge">${product.category}</span><h2>${product.name[locale]}</h2><p class="product-meta">SKU: ${product.sku}</p><p class="price">${currency.format(Number(product.price))}</p><p>${product.description[locale]}</p><button type="button" data-add="${product.id}" ${product.in_stock ? "" : "disabled"}>${product.in_stock ? copy.add : copy.soldOut}</button><ul class="detail-specs"><li><span>${copy.rating}</span><strong>${product.rating.toFixed(1)} / 5</strong></li><li><span>${copy.quantity}</span><strong>${product.inventory_quantity}</strong></li><li><span>${copy.category}</span><strong>${product.category}</strong></li></ul></div></div>`;
  productDialog.showModal();
}

document.addEventListener("click", (event) => {
  const target =
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement | HTMLAnchorElement>("button,a")
      : null;
  if (!target) return;
  if (target.dataset.add) {
    updateCart(target.dataset.add, 1);
    openCart();
  }
  if (target.dataset.remove)
    updateCart(target.dataset.remove, -(cart.get(target.dataset.remove) ?? 1));
  if (target.dataset.quantity)
    updateCart(target.dataset.quantity, Number(target.dataset.delta));
  if (target.dataset.detail) showProduct(target.dataset.detail);
  if (target.id === "cart-open") openCart();
  if (target.hasAttribute("data-close-cart")) cartDialog.close();
  if (target.hasAttribute("data-close-product")) productDialog.close();
});
byId("reset-session").addEventListener("click", () => {
  cart.clear();
  persist();
  renderCart();
  renderRecommendations();
});
byId("analyze-cart").addEventListener("click", () =>
  recommendationGrid.scrollIntoView({ behavior: "smooth", block: "center" }),
);
for (const control of [search, category, sort])
  control.addEventListener(
    control === search ? "input" : "change",
    renderCatalog,
  );
strategy.addEventListener("change", () => {
  renderRecommendations();
  renderHybridSignals();
});
theme.value = document.documentElement.dataset.theme ?? "system";
theme.addEventListener("change", () => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem("rrl-theme", theme.value);
});
for (const dialog of [cartDialog, productDialog])
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
document.addEventListener(
  "load",
  (event) => {
    if (event.target instanceof HTMLImageElement)
      event.target.parentElement?.classList.add("loaded");
  },
  true,
);
document.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLImageElement)
      event.target.parentElement?.classList.add("failed");
  },
  true,
);

const response = await fetch(catalogUrl);
if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
const payload: unknown = await response.json();
if (!Array.isArray(payload) || !payload.every(isProduct))
  throw new Error("Catalog contract is invalid");
products = payload;
for (const value of [...cart.keys()])
  if (!products.some((product) => product.id === value)) cart.delete(value);
persist();
for (const value of [
  ...new Set(products.map((product) => product.category)),
].sort())
  category.add(new Option(value, value));
try {
  artifacts = Object.fromEntries(
    await Promise.all(
      artifactNames.map(async (name) => {
        const filename = name === "hybrid" ? "hybrid-recommendations" : name;
        const result = await fetch(`${artifactBase}${filename}.json`);
        if (!result.ok) throw new Error(name);
        const artifact = (await result.json()) as Artifact<
          Candidate[] | Record<string, Candidate[]>
        >;
        return [name, artifact.data];
      }),
    ),
  ) as typeof artifacts;
} catch {
  artifactError.hidden = false;
  artifacts = {
    popularity: [],
    "category-popularity": [],
    "frequently-bought-together": {},
    "item-similarity": {},
    hybrid: {},
  };
}
try {
  const result = await fetch(hybridUrl);
  if (!result.ok) throw new Error("hybrid config");
  const payload = (await result.json()) as {
    data?: { weights?: Record<string, number> };
  };
  hybridWeights = payload.data?.weights ?? {};
} catch {
  hybridWeights = {};
}
renderHybridSignals();
try {
  const result = await fetch(evaluationUrl);
  if (!result.ok) throw new Error("evaluation");
  metrics = ((await result.json()) as { data: { metrics: Metric[] } }).data
    .metrics;
  renderMetrics();
} catch {
  comparison.innerHTML = `<p class="error-state">${copy.error}</p>`;
}
renderCatalog();
renderCart();
renderRecommendations();

const labViews = new Map<string, HTMLElement>([
  ["home", document.querySelector<HTMLElement>(".hero")!],
  ["catalog", document.querySelector<HTMLElement>("#catalog")!],
  ["recommendations", document.querySelector<HTMLElement>("#recommendations")!],
  ["methodology", document.querySelector<HTMLElement>("#methodology")!],
  ["engineering", document.querySelector<HTMLElement>("#engineering")!],
]);
const labViewLinks = document.querySelectorAll<HTMLAnchorElement>(
  '[data-lab-view], a[href="#catalog"], a[href="#recommendations"], a[href="#methodology"], a[href="#engineering"]',
);

function showLabView(name: string, updateHistory = true): void {
  if (!labViews.has(name)) name = "home";
  for (const [viewName, view] of labViews) view.hidden = viewName !== name;
  document
    .querySelectorAll<HTMLAnchorElement>("[data-lab-view]")
    .forEach((link) => {
      const active = link.dataset.labView === name;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  if (updateHistory) history.pushState({ labView: name }, "", `#${name}`);
  window.scrollTo(0, 0);
  labViews.get(name)?.focus({ preventScroll: true });
}

labViewLinks.forEach((link) => {
  link.addEventListener("click", (event: MouseEvent) => {
    const name = link.hash.slice(1);
    if (!labViews.has(name)) return;
    event.preventDefault();
    showLabView(name);
  });
});
window.addEventListener("popstate", () => {
  showLabView(window.location.hash.slice(1) || "home", false);
});
for (const view of labViews.values()) view.tabIndex = -1;
showLabView(window.location.hash.slice(1) || "home", false);
