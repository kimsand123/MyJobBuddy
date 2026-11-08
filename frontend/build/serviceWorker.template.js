/*
 * My Jobbuddy – service worker (håndskrevet, ingen pakker).
 * Skabelon: build/serviceWorkerPlugin.ts skriver den som dist/sw.js ved build og indsætter
 * precache-listerne og cache-versionen (en hash af appens filer). Ret her, ikke i dist.
 *
 * Formål: gøre appen installérbar (Chrome på Android kræver en reel fetch-handler) og lade den
 * åbne uden net – også første gang efter ét online besøg. Kun appens egne statiske filer caches.
 * Data ligger i hukommelsen i appen (mock-API), så intet data caches, og demoen starter stadig
 * forfra ved genindlæsning.
 *
 * Strategi (kun same-origin GET):
 *  - Installation: appens side ("/") og alle filer under /assets/ SKAL gemmes, ellers fejler
 *    installationen, og den forrige service worker og dens komplette cache bliver stående.
 *    Manifest, fonte og ikoner gemmes, hvis det lykkes.
 *  - Navigationer: network-first. Et svar med Content-Type text/html gemmes som appens side ("/");
 *    uden net bruges det gemte. Alle ruter er samme side.
 *  - /assets/* (filnavne med hash), /fonts/* og /icons/*: cache-first.
 *  - Alt andet går direkte til nettet (sendes ikke gennem service workeren).
 *
 * Appens side gemmes under "/" (ikke /index.html), fordi nogle hosts omdirigerer /index.html til /.
 * Et omdirigeret svar kopieres til et nyt svar, før det gemmes, da browseren afviser omdirigerede
 * svar til navigationer.
 *
 * Cachen har en version fra build. Ved en ny deploy ryddes gamle caches i "activate".
 * skipWaiting og clients.claim gør, at en ny version tager over med det samme.
 * Skrivning til cachen blokerer aldrig svaret, og en fejl i cachen giver aldrig et dårligere svar.
 */

const CACHE_PREFIX = "my-jobbuddy-";
const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const APP_PAGE_URL = "/";
const REQUIRED_ASSET_URLS = /* REQUIRED_ASSET_URLS */ [];
const OPTIONAL_URLS = /* OPTIONAL_URLS */ [];
const CACHE_FIRST_PREFIXES = ["/assets/", "/fonts/", "/icons/"];

function isHtml(response) {
  return (response.headers.get("content-type") ?? "").includes("text/html");
}

/** Et omdirigeret svar kan ikke bruges til en navigation; lav et rent svar med samme indhold. */
async function withoutRedirect(response) {
  if (!response.redirected) {
    return response;
  }
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function cacheAppPage(cache) {
  const response = await fetch(new Request(APP_PAGE_URL, { cache: "reload" }));
  if (!response.ok || !isHtml(response)) {
    // Afvist promise = installationen fejler (den gamle service worker bliver stående).
    return Promise.reject(new Error("Appens side kunne ikke hentes."));
  }
  return cache.put(APP_PAGE_URL, await withoutRedirect(response));
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  // Påkrævet: uden siden og dens JS/CSS kan appen ikke starte offline.
  await cacheAppPage(cache);
  await cache.addAll(REQUIRED_ASSET_URLS.map((url) => new Request(url, { cache: "reload" })));
  // Ikke påkrævet: én fil, der fejler, stopper ikke installationen.
  await Promise.all(
    OPTIONAL_URLS.map((url) =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
    ),
  );
}

// Installation: fejler precachen, fejler installationen, og den gamle service worker bliver.
self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

// Aktivering: ryd caches fra tidligere deploys og tag kontrol over åbne faner.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .catch(() => undefined)
      .then(() => self.clients.claim()),
  );
});

function isCacheFirstPath(pathname) {
  return CACHE_FIRST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Gemmer et svar uden at blokere det svar, der sendes til siden. Fejl ignoreres.
function putInCache(event, key, responsePromise) {
  event.waitUntil(
    Promise.all([caches.open(CACHE_NAME), responsePromise])
      .then(([cache, response]) => cache.put(key, response))
      .catch(() => undefined),
  );
}

// ignoreVary: hosten kan sende fx "Vary: Origin" eller "Vary: Accept-Encoding". Cachen indeholder
// kun appens egne statiske filer, så de må gerne matche uanset Vary (ellers fejler fx de
// crossorigin-indlæste JS- og CSS-filer offline).
function matchInCache(key) {
  return caches.match(key, { cacheName: CACHE_NAME, ignoreVary: true }).catch(() => undefined);
}

// Navigation: net først. Kun HTML gemmes som appens side.
async function networkFirstNavigation(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok && isHtml(response)) {
      putInCache(event, APP_PAGE_URL, withoutRedirect(response.clone()));
    }
    return response;
  } catch {
    const cached = await matchInCache(APP_PAGE_URL);
    return cached ?? Response.error();
  }
}

// Statiske filer: cache først, ellers net (og gem svaret).
async function cacheFirst(event) {
  const cached = await matchInCache(event.request);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const response = await fetch(event.request);
    if (response.ok && response.type === "basic") {
      putInCache(event, event.request, Promise.resolve(response.clone()));
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }
  if (isCacheFirstPath(url.pathname)) {
    event.respondWith(cacheFirst(event));
  }
  // Alt andet: ingen respondWith, så browseren henter det direkte.
});
