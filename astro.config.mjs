// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://joeburkinshaw.com",
  build: {
    // One render-blocking request. The default 'auto' only inlines under Vite's
    // 4kb assetsInlineLimit, which would leave our stylesheet external.
    inlineStylesheets: "always",
  },
});
