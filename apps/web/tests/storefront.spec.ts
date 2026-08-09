import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function navigateTo(page: Page, label: string): Promise<void> {
  await page.locator(".project-menu summary").click();
  await page.getByRole("link", { name: label, exact: true }).click();
}

test("keeps a localized portfolio return in the header", async ({ page }) => {
  await page.goto("/retail-recommendation-lab/en/");
  await expect(page.locator("[data-portfolio-return]")).toHaveText(
    "← Portfolio",
  );
  await expect(page.locator("[data-portfolio-return]")).toHaveAttribute(
    "href",
    "https://sebastiangaray.github.io/",
  );
  await expect(page.locator(".project-menu [data-lab-view]")).toHaveCount(5);
  await page.goto("/retail-recommendation-lab/es/");
  await expect(page.locator("[data-portfolio-return]")).toHaveText(
    "← Portafolio",
  );
});

test("production metadata, public files and internal links are valid", async ({
  page,
  request,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://sebastiangaray.github.io/retail-recommendation-lab/en/",
  );
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    "href",
    "https://sebastiangaray.github.io/retail-recommendation-lab/es/",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://sebastiangaray.github.io/retail-recommendation-lab/en/",
  );

  for (const path of ["favicon.svg", "robots.txt", "sitemap.xml"]) {
    expect((await request.get(`/retail-recommendation-lab/${path}`)).ok()).toBe(
      true,
    );
  }

  const links = await page
    .locator('a[href^="/"]')
    .evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")))].filter(
        (href): href is string => Boolean(href),
      ),
    );
  for (const link of links) expect((await request.get(link)).ok()).toBe(true);

  const missing = await request.get(
    "/retail-recommendation-lab/not-a-real-page",
  );
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("This page is outside the lab.");
});

test("localized routes, theme and keyboard navigation work", async ({
  page,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  await expect(
    page.getByRole("heading", {
      name: "Retail recommendation strategies with a cart.",
    }),
  ).toBeVisible();
  await navigateTo(page, "Catalog");
  await expect(page.locator("#product-grid article")).toHaveCount(40);
  await expect(
    page.getByRole("heading", { name: "Product catalog" }),
  ).toBeVisible();
  await expect(page.locator('[data-global-control="theme"]')).toBeVisible();
  await expect(page.locator('[data-global-control="language"]')).toBeVisible();
  await page.locator("[data-theme-control] summary").click();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByRole("link", { name: "Language: ES" }).click();
  await navigateTo(page, "Catálogo");
  await expect(
    page.getByRole("heading", { name: "Catálogo de productos" }),
  ).toBeVisible();
});

test("English and Spanish storefronts have no detectable accessibility violations", async ({
  page,
}) => {
  for (const locale of ["en", "es"]) {
    await page.goto(`/retail-recommendation-lab/${locale}/`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("engineering process is localized and links to versioned SDD evidence", async ({
  page,
}) => {
  await page.goto("/retail-recommendation-lab/en/");
  await navigateTo(page, "Engineering process");
  await expect(
    page.getByRole("heading", { name: "How SDD and AI assistance were used" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Example: explainable hybrid ranking" }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await expect(
    page.getByRole("link", { name: /Specification/ }),
  ).toHaveAttribute("href", /sdd\/spec\.md$/);

  await page.getByRole("link", { name: "Language: ES" }).click();
  await navigateTo(page, "Proceso de ingeniería");
  await expect(
    page.getByRole("heading", {
      name: "Cómo se usaron SDD y la asistencia de IA",
    }),
  ).toBeVisible();
});

test("search, category, sorting and product details work", async ({ page }) => {
  await page.goto("/retail-recommendation-lab/en/");
  await navigateTo(page, "Catalog");
  await page.locator("#search").fill("blender");
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
  await navigateTo(page, "Catalog");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(page.locator("#cart-dialog")).toBeVisible();
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
  await navigateTo(page, "Catalog");
  const product = page.locator('[data-product-card="prd_dummy_001"]');
  const name = await product.locator("h3").innerText();
  await product.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: "View recommendations" }).last().click();
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
  await page.locator("#strategy").selectOption("category-popularity");
  await expect(page.locator("#recommendation-grid")).toContainText(
    "Popular in a category that is in your cart.",
  );
  await page.locator("#strategy").selectOption("frequently-bought-together");
  await expect(page.locator("#recommendation-grid")).toContainText(
    "Often appears in the same synthetic baskets as a cart item.",
  );
  await page.locator("#strategy").selectOption("hybrid");
  await expect(page.locator("#hybrid-signals")).toBeVisible();
  await expect(page.locator("#hybrid-signals")).toContainText(
    "Products bought together: 25%",
  );
  await navigateTo(page, "Evaluation");
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
  await page.route("https://cdn.dummyjson.com/product-images/**", (route) =>
    route.abort(),
  );
  await page.route("**/hybrid-recommendations.json", (route) => route.abort());
  await page.goto("/retail-recommendation-lab/en/");
  await navigateTo(page, "Catalog");
  await expect(page.getByText("Image unavailable").first()).toBeVisible();
  await navigateTo(page, "Recommendations");
  await expect(
    page.getByText(
      "One or more recommendation strategies are temporarily unavailable.",
    ),
  ).toBeVisible();
  await page.locator("#strategy").selectOption("hybrid");
  await expect(page.locator("#recommendation-grid")).toContainText(
    "This strategy's artifact is unavailable",
  );
  await page.locator("#strategy").selectOption("item-similarity");
  await expect(page.locator("#recommendation-grid")).not.toContainText(
    "artifact is unavailable",
  );
  await expect(
    page.locator("#recommendation-grid article").first(),
  ).toBeVisible();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("filters and cart drawer remain usable", async ({ page }) => {
    await page.goto("/retail-recommendation-lab/en/");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await expect(page.locator("[data-portfolio-return]")).toBeVisible();
    await expect(page.locator(".project-menu summary")).toBeVisible();
    await navigateTo(page, "Catalog");
    await page.locator("#search").fill("blender");
    await expect(page.locator("#product-grid article")).toHaveCount(1);
    await page
      .locator("#product-grid")
      .getByRole("button", { name: "Add to cart" })
      .click();
    await expect(page.locator("#cart-dialog")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View recommendations" }).last(),
    ).toBeVisible();
  });

  test("engineering process remains readable", async ({ page }) => {
    await page.goto("/retail-recommendation-lab/en/#engineering");
    await expect(
      page.getByRole("heading", {
        name: "How SDD and AI assistance were used",
      }),
    ).toBeVisible();
    await expect(page.locator(".process-grid article")).toHaveCount(4);
  });
});
