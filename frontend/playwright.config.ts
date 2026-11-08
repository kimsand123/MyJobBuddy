import { defineConfig, devices } from "@playwright/test";

// Browsertests kører mod den byggede app i `vite preview`.
// To projekter: WebKit med iPhone-profil og Chromium med en mobilprofil.

const port = 4173;
const baseUrl = `http://127.0.0.1:${String(port)}`;
const isCi = process.env.CI !== undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: baseUrl,
    trace: "retain-on-failure",
    locale: "da-DK",
    // Service workeren må ikke tage kontrol midt i en test. PWA-tests tillader den selv med
    // test.use({ serviceWorkers: "allow" }).
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 15"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${String(port)} --strictPort`,
    url: baseUrl,
    reuseExistingServer: !isCi,
    timeout: 180_000,
  },
});
