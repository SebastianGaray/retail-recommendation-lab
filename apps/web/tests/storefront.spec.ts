import { expect, test } from "@playwright/test";

test("English and Spanish routes render", async ({ page }) => {
  await page.goto("/retail-recommendation-lab/en/");
  await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
  await page.goto("/retail-recommendation-lab/es/");
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
});

test("cart persists and broken images use a fallback", async ({ page }) => {
  await page.route("https://dummyjson.com/image/**", (route) => route.abort());
  await page.goto("/retail-recommendation-lab/en/");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(page.locator("#cart-count")).toHaveText("1");
  await page.reload();
  await expect(page.locator("#cart-count")).toHaveText("1");
  await expect(page.getByText("Image unavailable").first()).toBeVisible();
});

test("every offline strategy renders and excludes cart products", async ({
  page,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  const firstProduct = page.locator("#product-grid article").first();
  const name = await firstProduct.locator("h3").innerText();
  await firstProduct.getByRole("button", { name: "Add to cart" }).click();
  for (const strategy of [
    "popularity",
    "category-popularity",
    "frequently-bought-together",
    "item-similarity",
  ]) {
    await page.locator("#strategy").selectOption(strategy);
    await expect(page.locator("#recommendation-grid")).not.toContainText(name);
    await expect(
      page.locator("#recommendation-grid article").first(),
    ).toBeVisible();
  }
});
