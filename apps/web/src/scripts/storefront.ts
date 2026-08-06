import {
  isProduct,
  recommendations,
  type Artifact,
  type Candidate,
  type Locale,
  type Product,
  type Strategy,
} from "../lib/catalog";

type Copy = Record<
  | "add"
  | "remove"
  | "soldOut"
  | "empty"
  | "fallback"
  | "reason"
  | "statusAdded"
  | "statusRemoved"
  | "error"
  | "global_popularity"
  | "category_popularity"
  | "frequently_bought_together"
  | "item_similarity"
  | "cold_start_fallback",
  string
>;

const body = document.body;
const locale = body.dataset.locale as Locale;
const catalogUrl = body.dataset.catalogUrl;
const artifactBase = body.dataset.artifactBase;
const rawCopy = body.dataset.copy;
if (
  !catalogUrl ||
  !artifactBase ||
  !rawCopy ||
  (locale !== "en" && locale !== "es")
) {
  throw new Error("Storefront configuration is invalid");
}
const copy = JSON.parse(rawCopy) as Copy;
const storageKey = "rrl-cart";
const storedCart: unknown = JSON.parse(
  localStorage.getItem(storageKey) ?? "[]",
);
const cart = new Set(
  Array.isArray(storedCart)
    ? storedCart.filter((id): id is string => typeof id === "string")
    : [],
);
const currency = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
});

const requiredElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};
const productGrid = requiredElement("product-grid");
const cartList = requiredElement("cart-list");
const cartCount = requiredElement("cart-count");
const recommendationGrid = requiredElement("recommendation-grid");
const cartStatus = requiredElement("cart-status");
const theme = requiredElement<HTMLSelectElement>("theme");
const strategy = requiredElement<HTMLSelectElement>("strategy");
const artifactError = requiredElement("artifact-error");

let products: Product[] = [];
const artifactNames: Strategy[] = [
  "popularity",
  "category-popularity",
  "frequently-bought-together",
  "item-similarity",
];
let artifacts = {} as Record<
  Strategy,
  Candidate[] | Record<string, Candidate[]>
>;

function image(product: Product): string {
  const alt = `${product.name[locale]} — ${product.description[locale]}`;
  return `<div class="product-image"><img src="${product.image_url}" alt="${alt}" width="640" height="480"><span aria-hidden="true">${copy.fallback}</span></div>`;
}

function productMarkup(product: Product): string {
  const disabled = product.in_stock ? "" : "disabled";
  const label = product.in_stock ? copy.add : copy.soldOut;
  return `<article>
    ${image(product)}
    <div class="product-meta"><p>${product.category}</p><p>★ ${product.rating.toFixed(1)}</p></div>
    <h3>${product.name[locale]}</h3>
    <p>${product.description[locale]}</p>
    <div class="product-action"><strong>${currency.format(Number(product.price))}</strong>
    <button type="button" data-add="${product.id}" ${disabled}>${label}</button></div>
  </article>`;
}

function render(): void {
  productGrid.innerHTML = products.map(productMarkup).join("");
  const cartProducts = products.filter((product) => cart.has(product.id));
  cartCount.textContent = String(cartProducts.length);
  cartList.innerHTML = cartProducts.length
    ? cartProducts
        .map(
          (product) =>
            `<div class="cart-row"><span>${product.name[locale]}</span><button type="button" data-remove="${product.id}" aria-label="${copy.remove}: ${product.name[locale]}">${copy.remove}</button></div>`,
        )
        .join("")
    : `<p class="empty">${copy.empty}</p>`;
  recommendationGrid.innerHTML = recommendations(
    products,
    cart,
    strategy.value as Strategy,
    artifacts,
  )
    .map(
      ({ product, reason }) =>
        `<article>${image(product)}<div><h3>${product.name[locale]}</h3><p>${copy[reason]}</p><strong>${currency.format(Number(product.price))}</strong></div></article>`,
    )
    .join("");
}

function updateCart(id: string, add: boolean): void {
  const product = products.find((candidate) => candidate.id === id);
  if (!product) return;
  if (add) cart.add(id);
  else cart.delete(id);
  localStorage.setItem(storageKey, JSON.stringify([...cart]));
  cartStatus.textContent = `${product.name[locale]} ${add ? copy.statusAdded : copy.statusRemoved}`;
  render();
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  if (event.target.dataset.add) updateCart(event.target.dataset.add, true);
  if (event.target.dataset.remove)
    updateCart(event.target.dataset.remove, false);
});

theme.value = document.documentElement.dataset.theme ?? "system";
theme.addEventListener("change", () => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem("rrl-theme", theme.value);
});
strategy.addEventListener("change", render);

const response = await fetch(catalogUrl);
if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
const payload: unknown = await response.json();
if (!Array.isArray(payload) || !payload.every(isProduct))
  throw new Error("Catalog contract is invalid");
products = payload;
try {
  artifacts = Object.fromEntries(
    await Promise.all(
      artifactNames.map(async (name) => {
        const artifactResponse = await fetch(`${artifactBase}${name}.json`);
        if (!artifactResponse.ok) throw new Error(name);
        const artifact = (await artifactResponse.json()) as Artifact<
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
  };
}
productGrid.setAttribute("aria-busy", "false");
render();

document.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLImageElement)
      event.target.parentElement?.classList.add("failed");
  },
  true,
);
