// PWA: manifest med ikoner, service worker med precache, offline-start, og at appen kører uden
// konsolfejl under den CSP, som public/_headers sætter på hosten.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { documentTitle, openRoute, routesUnderTest } from "./support/appRoutes";
import { collectPageErrors } from "./support/pageErrors";

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose?: string };
type Manifest = {
  name?: string;
  display?: string;
  start_url?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
};

/** CSP-headeren for alle stier ("/*") i public/_headers. */
function contentSecurityPolicyFromHeadersFile(): string {
  const headersFile = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
  const line = headersFile
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("Content-Security-Policy:"));
  if (line === undefined) {
    throw new Error("public/_headers har ingen Content-Security-Policy.");
  }
  return line.slice("Content-Security-Policy:".length).trim();
}

async function waitForActiveServiceWorker(page: Page): Promise<string | undefined> {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.state;
  });
}

async function cachedPaths(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        paths.push(new URL(request.url).pathname);
      }
    }
    return paths;
  });
}

test.describe("manifest", () => {
  test("manifest_Served_StandaloneWithNameColorsAndIcons", async ({ request }) => {
    // Act
    const response = await request.get("/manifest.webmanifest");
    const manifest = (await response.json()) as Manifest;

    // Assert
    expect(response.ok()).toBe(true);
    expect(manifest.name).toBe("My Jobbuddy");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color?.toLowerCase()).toBe("#f4f7f6");
    expect(manifest.background_color?.toLowerCase()).toBe("#0e7566");
    const icons = manifest.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose !== "maskable")).toBe(
      true,
    );
    expect(icons.some((icon) => (icon.purpose ?? "").includes("maskable"))).toBe(true);
  });

  test("manifest_EveryIcon_ServedAsPng", async ({ request }) => {
    // Arrange
    const manifest = (await (await request.get("/manifest.webmanifest")).json()) as Manifest;

    for (const icon of manifest.icons ?? []) {
      // Act
      const response = await request.get(new URL(icon.src, "http://127.0.0.1:4173/").pathname);

      // Assert
      expect(response.ok(), icon.src).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });

  test("index_Head_LinksManifestAndAppleTouchIcon", async ({ page }) => {
    // Act
    await page.goto("/");

    // Assert
    await expect(page.locator("link[rel='manifest']")).toHaveCount(1);
    await expect(page.locator("link[rel='apple-touch-icon']")).toHaveCount(1);
    await expect(page.locator("meta[name='viewport']")).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );
    await expect(page.locator("meta[name='theme-color']")).toHaveAttribute("content", /#f4f7f6/i);
  });
});

test.describe("service worker", () => {
  test.use({ serviceWorkers: "allow" });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Service worker-testene køres i Chromium.");
  });

  test("serviceWorker_FirstVisit_ActivatesAndPrecachesAppShell", async ({ page }) => {
    // Arrange
    await openRoute(page, { path: "/", pageTitle: "Hjem" });

    // Act
    const state = await waitForActiveServiceWorker(page);
    const paths = await cachedPaths(page);

    // Assert
    expect(state).toBe("activated");
    expect(paths.some((path) => path === "/" || path === "/index.html")).toBe(true);
    expect(paths).toContain("/manifest.webmanifest");
    expect(paths.some((path) => path.startsWith("/assets/") && path.endsWith(".js"))).toBe(true);
    expect(paths.some((path) => path.startsWith("/assets/") && path.endsWith(".css"))).toBe(true);
    expect(paths.some((path) => path.startsWith("/fonts/"))).toBe(true);
    expect(paths.some((path) => path.startsWith("/icons/"))).toBe(true);
  });

  test("serviceWorker_OfflineAfterOneVisit_AppStartsAndPayShowsSeed", async ({ page, context }) => {
    // Arrange
    const errors = collectPageErrors(page);
    await openRoute(page, { path: "/", pageTitle: "Hjem" });
    await waitForActiveServiceWorker(page);

    // Act
    await context.setOffline(true);
    await page.goto("/loen");

    // Assert
    await expect(page).toHaveTitle(documentTitle("Løn"));
    await expect(page.getByText(/Vi fandt 2 mulige fejl – i alt 408,75\skr\./)).toBeVisible();
    expect(errors.messages()).toEqual([]);
  });

  test("serviceWorker_OfflineDeepLink_FallsBackToCachedApp", async ({ page, context }) => {
    // Arrange
    await openRoute(page, { path: "/", pageTitle: "Hjem" });
    await waitForActiveServiceWorker(page);

    // Act
    await context.setOffline(true);
    await page.goto("/vagter");

    // Assert
    await expect(page).toHaveTitle(documentTitle("Vagter"));
    await expect(page.getByRole("button", { name: da.shifts.addShift }).first()).toBeVisible();
  });

  test("serviceWorker_Online_NavigationIsNetworkFirst", async ({ page }) => {
    // Arrange
    await openRoute(page, { path: "/", pageTitle: "Hjem" });
    await waitForActiveServiceWorker(page);
    let navigationReachedNetwork = false;
    page.on("request", (request) => {
      if (request.isNavigationRequest() && new URL(request.url()).pathname === "/mig") {
        navigationReachedNetwork = true;
      }
    });

    // Act
    await page.goto("/mig");

    // Assert
    await expect(page).toHaveTitle(documentTitle("Mig"));
    expect(navigationReachedNetwork).toBe(true);
  });
});

test.describe("CSP fra public/_headers", () => {
  const policy = contentSecurityPolicyFromHeadersFile();

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Dokumentet får samme CSP som på hosten.
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": policy },
      });
    });
    await page.addInitScript(() => {
      const violations: string[] = [];
      Object.defineProperty(window, "cspViolations", { value: violations });
      document.addEventListener("securitypolicyviolation", (event) => {
        const source =
          event.sourceFile === "" ? "ukendt kilde" : new URL(event.sourceFile).pathname;
        violations.push(`${event.violatedDirective}: ${event.blockedURI} (${source})`);
      });
    });
  });

  async function violations(page: Page): Promise<string[]> {
    return page.evaluate(
      () => (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
    );
  }

  // Kravet: appen virker under CSP'en uden konsolfejl.
  for (const route of routesUnderTest) {
    test(`csp_Route${route.path}_NoConsoleErrors`, async ({ page }) => {
      // Arrange
      const errors = collectPageErrors(page);

      // Act
      await openRoute(page, route);

      // Assert
      expect(errors.messages()).toEqual([]);
    });
  }

  test("csp_SheetAndDialogOpened_NoConsoleErrors", async ({ page }) => {
    // Arrange
    const errors = collectPageErrors(page);
    await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });

    // Act
    await page.getByRole("button", { name: da.shifts.addShift, exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: da.shiftForm.title })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Tilbage/ }).click();
    await page.getByRole("button", { name: /^Notifikationer/ }).click();
    await expect(page.getByRole("dialog", { name: da.notImplemented.title })).toBeVisible();

    // Assert
    expect(errors.messages()).toEqual([]);
  });

  // Strengere: koden forsøger slet ikke noget, som CSP'en blokerer (fx eval eller new Function).
  test("csp_AllRoutes_NoBlockedAttempts", async ({ page }) => {
    // Arrange
    const found = new Set<string>();

    for (const route of routesUnderTest) {
      // Act
      await openRoute(page, route);
      for (const violation of await violations(page)) {
        found.add(`${route.path}: ${violation}`);
      }
    }

    // Assert
    expect([...found]).toEqual([]);
  });
});
