// Service workerens precache (Chromium, serviceWorkers "allow"):
// - appens side gemmes under "/" (ikke /index.html) og kun som text/html,
// - offline efter ét besøg virker på alle ruter (deep links),
// - en installation, hvor en påkrævet /assets/-fil fejler, afvises, og den gamle SW og cache bliver,
// - en host, der omdirigerer appens side, giver ikke netværksfejl offline.
// Fejl simuleres med context.route på service workerens egne kald (request.serviceWorker()).
// Hver test tjekker, at simuleringen faktisk ramte, så den ikke kan blive grøn uden at have prøvet.
import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";
import { documentTitle, openRoute, routesUnderTest } from "./support/appRoutes";
import { collectPageErrors } from "./support/pageErrors";

test.use({ serviceWorkers: "allow" });

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Service worker-testene køres i Chromium.");
});

type CacheEntry = { path: string; contentType: string; redirected: boolean };

async function waitForActiveServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}

async function cacheEntries(page: Page): Promise<CacheEntry[]> {
  return page.evaluate(async () => {
    const entries: { path: string; contentType: string; redirected: boolean }[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        entries.push({
          path: new URL(request.url).pathname,
          contentType: response?.headers.get("content-type") ?? "",
          redirected: response?.redirected ?? false,
        });
      }
    }
    return entries;
  });
}

async function cacheSnapshot(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const lines: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        lines.push(`${name} ${new URL(request.url).pathname}`);
      }
    }
    return lines.sort();
  });
}

/** Router alle kald fra service workeren gennem handler. Giver en tæller over ramte kald. */
async function routeServiceWorkerRequests(
  context: BrowserContext,
  handler: (route: Route, pathname: string) => Promise<boolean>,
): Promise<{ handled: () => number }> {
  let handledCount = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (request.serviceWorker() === null) {
      await route.fallback();
      return;
    }
    const pathname = new URL(request.url()).pathname;
    if (await handler(route, pathname)) {
      handledCount += 1;
      return;
    }
    await route.fallback();
  });
  return { handled: () => handledCount };
}

test("serviceWorker_FirstVisit_AppPageCachedUnderRootAsHtml", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });

  // Act
  await waitForActiveServiceWorker(page);
  const entries = await cacheEntries(page);

  // Assert
  const appPage = entries.find((entry) => entry.path === "/");
  expect(appPage?.contentType).toContain("text/html");
  expect(appPage?.redirected).toBe(false);
  expect(entries.map((entry) => entry.path)).not.toContain("/index.html");
});

test("serviceWorker_OfflineAfterOneVisit_EveryRouteStarts", async ({ page, context }) => {
  // Arrange
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await waitForActiveServiceWorker(page);
  await context.setOffline(true);

  for (const route of routesUnderTest) {
    // Act
    await page.goto(route.path);

    // Assert
    await expect(page).toHaveTitle(documentTitle(route.pageTitle));
  }
  expect(errors.messages()).toEqual([]);
});

test("serviceWorker_HostRedirectsAppPage_StoredCleanAndWorksOffline", async ({ page, context }) => {
  // Arrange: hosten omdirigerer appens side, når service workeren henter den
  const redirects = await routeServiceWorkerRequests(context, async (route, pathname) => {
    if (pathname !== "/") {
      return false;
    }
    await route.fulfill({ status: 302, headers: { location: "/index.html" } });
    return true;
  });
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await waitForActiveServiceWorker(page);
  test.skip(
    redirects.handled() === 0,
    "Service workerens kald kunne ikke routes i denne Playwright-version; omdirigering ikke simuleret.",
  );

  // Act
  const entries = await cacheEntries(page);
  await context.setOffline(true);
  await page.goto("/loen");

  // Assert
  const appPage = entries.find((entry) => entry.path === "/");
  expect(appPage?.redirected).toBe(false);
  expect(appPage?.contentType).toContain("text/html");
  await expect(page).toHaveTitle(documentTitle("Løn"));
  await expect(page.getByText(/Vi fandt 2 mulige fejl – i alt 408,75\skr\./)).toBeVisible();
});

test("serviceWorker_AppPageNotHtml_NotStoredAsAppPage", async ({ page, context }) => {
  // Arrange: hosten svarer med noget andet end HTML, når service workeren henter appens side
  const replaced = await routeServiceWorkerRequests(context, async (route, pathname) => {
    if (pathname !== "/") {
      return false;
    }
    await route.fulfill({ status: 200, contentType: "text/plain", body: "Vedligeholdelse" });
    return true;
  });
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = registration?.installing ?? registration?.waiting ?? registration?.active;
    return worker === null || worker === undefined || worker.state !== "installing";
  });
  test.skip(
    replaced.handled() === 0,
    "Service workerens kald kunne ikke routes i denne Playwright-version; svar ikke simuleret.",
  );

  // Act
  const entries = await cacheEntries(page);

  // Assert
  const appPages = entries.filter((entry) => entry.path === "/");
  for (const entry of appPages) {
    expect(entry.contentType).toContain("text/html");
  }
});

test("serviceWorker_FirstInstallWithFailingAsset_InstallRejected", async ({ page, context }) => {
  // Arrange: en påkrævet /assets/-fil fejler, når service workeren henter den
  const failures = await routeServiceWorkerRequests(context, async (route, pathname) => {
    if (!pathname.startsWith("/assets/")) {
      return false;
    }
    await route.fulfill({ status: 500, body: "Serverfejl" });
    return true;
  });

  // Act
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined && registration.installing === null;
  });
  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      active: registration?.active?.state ?? "ingen",
      waiting: registration?.waiting?.state ?? "ingen",
    };
  });
  // Iagttagelse til rapporten: hvad den afviste installation efterlod i Cache Storage
  process.stdout.write(
    `[sw-afvist] cache efter afvist installation: ${(await cacheSnapshot(page)).join(" | ")}\n`,
  );

  // Assert: installationen blev afvist; ingen service worker tager over
  expect(failures.handled()).toBeGreaterThan(0);
  expect(state).toEqual({ active: "ingen", waiting: "ingen" });
});

/** Serverer en ny udgave af sw.js (et byte ændret), så browseren ser en ny version. */
async function serveNewServiceWorkerVersion(
  context: BrowserContext,
): Promise<{ served: () => number }> {
  let servedCount = 0;
  await context.route("**/sw.js", async (route) => {
    const response = await route.fetch();
    const body = `${await response.text()}\n// testversion 2\n`;
    servedCount += 1;
    await route.fulfill({ response, body });
  });
  return { served: () => servedCount };
}

type UpdateOutcome = { updateFound: boolean; state: string };

/** Beder browseren lede efter en ny version og venter, til den nye installation er afgjort. */
async function updateServiceWorker(page: Page): Promise<UpdateOutcome> {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration === undefined) {
      return { updateFound: false, state: "ingen registrering" };
    }
    const finalStates = ["installed", "activating", "activated", "redundant"];
    const settled = new Promise<string>((resolve) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (worker === null) {
          resolve("ukendt");
          return;
        }
        worker.addEventListener("statechange", () => {
          if (finalStates.includes(worker.state)) {
            resolve(worker.state);
          }
        });
      });
    });
    const timeout = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve("ingen installation");
      }, 10_000);
    });
    await registration.update().catch(() => undefined);
    const state = await Promise.race([settled, timeout]);
    return { updateFound: state !== "ingen installation", state };
  });
}

test("serviceWorker_UpdateWithFailingAsset_OldWorkerAndCacheRemain", async ({ page, context }) => {
  // Arrange: første version installeres normalt
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await waitForActiveServiceWorker(page);
  const cacheBefore = await cacheSnapshot(page);
  const scriptBefore = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL ?? "",
  );

  // En ny version af sw.js, hvor én påkrævet /assets/-fil fejler
  const newVersion = await serveNewServiceWorkerVersion(context);
  const failures = await routeServiceWorkerRequests(context, async (route, pathname) => {
    if (!pathname.startsWith("/assets/")) {
      return false;
    }
    await route.fulfill({ status: 500, body: "Serverfejl" });
    return true;
  });

  // Act: browseren leder efter en ny version
  const outcome = await updateServiceWorker(page);
  process.stdout.write(
    `[sw-update] sw.js serveret=${String(newVersion.served())}, ny installation=${String(outcome.updateFound)} (${outcome.state}), fejlede /assets/-kald=${String(failures.handled())}\n`,
  );
  test.skip(
    newVersion.served() === 0 || !outcome.updateFound || failures.handled() === 0,
    `Kunne ikke simuleres: sw.js serveret ${String(newVersion.served())} gange, ny installation ${String(outcome.updateFound)}, fejlede /assets/-kald ${String(failures.handled())}.`,
  );

  // Assert: den nye installation blev afvist, og den gamle virker stadig
  expect(outcome.state).toBe("redundant");
  const after = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      activeState: registration?.active?.state,
      activeScript: registration?.active?.scriptURL ?? "",
      waiting: registration?.waiting !== null && registration?.waiting !== undefined,
    };
  });
  expect(after.activeState).toBe("activated");
  expect(after.activeScript).toBe(scriptBefore);
  expect(after.waiting).toBe(false);
  expect(await cacheSnapshot(page)).toEqual(cacheBefore);

  await context.unroute("**/*");
  await context.setOffline(true);
  await page.goto("/loen");
  await expect(page.getByText(/Vi fandt 2 mulige fejl – i alt 408,75\skr\./)).toBeVisible();
});

test("serviceWorker_UpdateWithoutFailures_NewWorkerInstalls", async ({ page, context }) => {
  // Arrange: kontrol af simuleringen; samme opdatering uden fejl skal give en ny installation
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await waitForActiveServiceWorker(page);
  const newVersion = await serveNewServiceWorkerVersion(context);

  // Act
  const outcome = await updateServiceWorker(page);
  process.stdout.write(
    `[sw-update kontrol] sw.js serveret=${String(newVersion.served())}, resultat=${outcome.state}\n`,
  );
  test.skip(
    newVersion.served() === 0,
    "Kunne ikke simuleres: browserens hentning af sw.js gik ikke gennem context.route.",
  );

  // Assert
  expect(["installed", "activating", "activated"]).toContain(outcome.state);
});
