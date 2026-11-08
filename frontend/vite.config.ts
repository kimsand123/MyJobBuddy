import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { serviceWorkerPlugin } from "./build/serviceWorkerPlugin.ts";
import { webManifestPlugin } from "./build/webManifestPlugin.ts";
import { appName, da } from "./src/texts/da.ts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webManifestPlugin({
      name: appName,
      description: da.app.tagline,
      // Eneste sted for PWA-farverne: manifestet og <meta name="theme-color"> dannes herfra.
      // theme_color = background (statuslinjen flyder sammen med AppHeader),
      // background_color = primary (opstartsskærm med det hvide mærke).
      themeColor: "#f4f7f6",
      backgroundColor: "#0e7566",
    }),
    // dist/sw.js med precache-liste og cache-version fra build.
    serviceWorkerPlugin({
      templatePath: path.resolve(import.meta.dirname, "./build/serviceWorker.template.js"),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    css: false,
  },
});
