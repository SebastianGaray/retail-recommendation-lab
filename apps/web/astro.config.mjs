import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://sebastiangaray.github.io",
  base: "/retail-recommendation-lab",
  output: "static",
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: true },
  },
});
