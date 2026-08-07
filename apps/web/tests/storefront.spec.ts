import { expect, test } from "@playwright/test";

test("localized routes, theme and keyboard navigation work", async ({
  page,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  await expect(
    page.getByRole("heading", { name: "Explore the catalog" }),
  ).toBeVisible();
  await page.locator("#theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByRole("link", { name: "Language: ES" }).click();
  await expect(
    page.getByRole("heading", { name: "Explora el catálogo" }),
  ).toBeVisible();
});

test("search, category, sorting and product details work", async ({ page }) => {
  await page.goto("/retail-recommendation-lab/en/");
  await page.locator("#search").fill("bottle");
  await expect(page.locator("#product-grid article")).toHaveCount(1);
  await page.locator("#search").fill("");
  await page.locator("#category").selectOption({ index: 1 });
  await expect(page.locator("#product-grid article").first()).toBeVisible();
  await page.locator("#category").selectOption("");
  await page.locator("#sort").selectOption("price-asc");
  await page.getByRole("button", { name: "View details" }).first().click();
  await expect(page.locator("#product-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();
});

test("cart quantities persist, recover from bad storage and reset", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("storage-seeded")) {
      localStorage.setItem("rrl-cart-v2", "not-json");
      sessionStorage.setItem("storage-seeded", "true");
    }
  });
  await page.goto("/retail-recommendation-lab/en/");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.getByRole("button", { name: "Open cart" }).click();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.locator("#cart-count")).toHaveText("2");
  await page.reload();
  await expect(page.locator("#cart-count")).toHaveText("2");
  await page.getByRole("button", { name: "Open cart" }).click();
  await page.getByRole("button", { name: "Reset session" }).click();
  await expect(page.locator("#cart-count")).toHaveText("0");
});

test("every strategy excludes cart products and renders metrics", async ({
  page,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  const product = page.locator("#product-grid article").first();
  const name = await product.locator("h3").innerText();
  await product.getByRole("button", { name: "Add to cart" }).click();
  for (const strategy of [
    "popularity",
    "category-popularity",
    "frequently-bought-together",
    "item-similarity",
    "hybrid",
  ]) {
    await page.locator("#strategy").selectOption(strategy);
    await expect(page.locator("#recommendation-grid")).not.toContainText(name);
    await expect(
      page.locator("#recommendation-grid article").first(),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Strategy comparison" }),
  ).toBeVisible();
  await expect(page.locator("#strategy-comparison")).toContainText(
    "Precision@3",
  );
});

test("image and recommendation artifact failures degrade gracefully", async ({
  page,
}) => {
  await page.route("https://dummyjson.com/image/**", (route) => route.abort());
  await page.route("**/hybrid-recommendations.json", (route) => route.abort());
  await page.goto("/retail-recommendation-lab/en/");
  await expect(page.getByText("Image unavailable").first()).toBeVisible();
  await expect(
    page.getByText("Recommendation artifacts are temporarily unavailable."),
  ).toBeVisible();
  await expect(
    page.locator("#recommendation-grid article").first(),
  ).toBeVisible();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("filters and cart drawer remain usable", async ({ page }) => {
    await page.goto("/retail-recommendation-lab/en/");
    await page.locator("#search").fill("bottle");
    await expect(page.locator("#product-grid article")).toHaveCount(1);
    await page
      .locator("#product-grid")
      .getByRole("button", { name: "Add to cart" })
      .click();
    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(page.locator("#cart-dialog")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View recommendations" }).last(),
    ).toBeVisible();
  });
});
