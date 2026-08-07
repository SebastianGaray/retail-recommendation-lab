import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "astro preview --host 127.0.0.1",
    url: "http://127.0.0.1:4321/retail-recommendation-lab/en/",
    reuseExistingServer: true,
  },
  use: { baseURL: "http://127.0.0.1:4321" },
});
