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
