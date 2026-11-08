# Teknisk dokumentation – My Jobbuddy

Revision 1 · 08-11-2026
Dækker frontend 0.1.0 (der findes endnu intet API)

Dokumentet er til driftsansvarlige og nye udviklere. Det beskriver, hvordan My Jobbuddy er bygget op,
hvordan udviklingsmiljøet sættes op, og hvordan løsningen bygges, deployes og drives.

## Arkitekturoverblik

My Jobbuddy er en klikbar PWA-demo til en pitch, som der bygges videre på. Løsningen består i dag af
én del:

| Del | Mappe | Status |
|---|---|---|
| Frontend (PWA) | `frontend/` | Findes. React-app, der bygges til statiske filer i `frontend/dist`. |
| Mock-API | `frontend/src/mockApi/` | Findes. Kører i browseren og står i stedet for det rigtige API. |
| API (C#) | – | Findes ikke endnu. |
| Database | – | Findes ikke. Alle data ligger i hukommelsen i browseren. |
| Design system | `design-system/` | Reference (kopi af et Claude Design-artifact). Bygges ikke med. |

Kommunikation: View → ViewModel → Model → `ApiClient`. I demoen er `ApiClient` implementeret af
`createMockApiClient()` (`frontend/src/mockApi/createMockApiClient.ts`), som kalder mock-API'ets
endpoints direkte i browseren. Der går ingen netværkskald ud af browseren for data. Når C#-API'et
laves, erstattes mock-klienten af en `fetch`-baseret klient ét sted, i
`frontend/src/app/App.tsx`, uden at View og ViewModel skal ændres.

Hosting: de byggede filer i `frontend/dist` lægges manuelt op på Netlify, og domænet `myjobbuddy.dk`
peger dertil (se [Drift](#drift)).

## Frontend

### Opbygning

```
frontend/
  index.html                 Appens side (titel og theme-color sættes ved build)
  vite.config.ts             Vite, Tailwind, manifest- og service worker-plugin, Vitest-opsætning
  playwright.config.ts       Browsertests (e2e)
  build/
    webManifestPlugin.ts     Danner manifest.webmanifest og sætter appnavn/theme-color i index.html
    serviceWorkerPlugin.ts   Danner dist/sw.js ud fra skabelonen ved build
    serviceWorker.template.js  Service workerens kode (ret her, ikke i dist)
  public/
    _headers                 Sikkerheds- og cache-headers (Netlify)
    _redirects               SPA-fallback (Netlify)
    fonts/Figtree-*.woff2    Selvhostede fonte (400, 500, 600, 700, 800)
    icons/*.png              PWA-ikoner (192, 512, maskable 512, apple-touch 180)
  src/
    main.tsx                 Indgang. Importerer shared/zodSetup først, starter App og service worker
    app/                     App, providers, AppShell, ruter, skærme, "Ikke implementeret"-dialog
    components/              Design systemets komponenter, bygget på components/ui
    components/ui/           shadcn/ui-komponenter (Radix), holdt tæt på det genererede
    lib/utils.ts             cn()-hjælper (clsx + tailwind-merge)
    shared/                  Result, ApiClient-type, clock, Zod-skemaer, formatering, queryKeys m.m.
    styles/globals.css       Design-tokens, @font-face, shadcn-tema og Tailwind v4 @theme
    texts/da.ts              Al brugervendt tekst på dansk, inkl. appnavnet (appName) ét sted
    mockApi/                 Mock af API'et (se Kritiske entiteter)
    widgets/<widget>/        Én mappe pr. widget (MVVM)
  e2e/                       Playwright-tests
```

**MVVM pr. widget.** Hver widget i `src/widgets/<widget>/` har fem filer, fx for `payCheck`:

| Fil | Rolle |
|---|---|
| `payCheckTypes.ts` | Typer for API-data og widgetens tilstand |
| `payCheckApi.ts` | Model: kalder `ApiClient`, validerer svaret med Zod og returnerer `Result<T>` |
| `payCheckCalculations.ts` | Rene præsentationsberegninger uden React |
| `usePayCheckWidget.ts` | ViewModel: henter via Model med TanStack Query og eksponerer `loading`/`error`/`empty`/`ready` |
| `PayCheckWidget.tsx` | View: viser kun, håndterer hver tilstand med guard clauses |

Widgets: `home`, `profile`, `jobs`, `consents`, `subscription`, `shiftCalendar`,
`shiftRegistration`, `sickness`, `payCheck`, `aiChat`.

**Ruter** (`src/app/routes.tsx`, stier i `src/shared/routePaths.ts`): Hjem, Vagter, Løn, AI og Mig,
samt en "ikke fundet"-rute (`*`). Alle ruter ligger under `AppShell`, og fejl i en rute vises af
`RouteErrorScreen`.

### Installation

Krav:

- Node.js og npm.

> TODO: Angiv hvilken Node.js-version der kræves/er testet (der er ingen `engines` i `frontend/package.json` og ingen `.nvmrc`).

Kommandoer (køres fra en vilkårlig mappe med `--prefix`):

```powershell
npm --prefix E:/Repositories/Jobbuddy/frontend ci
npx --prefix E:/Repositories/Jobbuddy/frontend playwright install chromium webkit   # kun til e2e-tests; henter browsere
npm --prefix E:/Repositories/Jobbuddy/frontend run dev
```

`frontend/.npmrc` har `save-exact=true`, så nye pakker gemmes med eksakt version. Lockfilen
(`package-lock.json`) skal med i versionsstyringen.

| Kommando (`npm --prefix E:/Repositories/Jobbuddy/frontend run …`) | Hvad den gør |
|---|---|
| `dev` | Vite-udviklingsserver. Service workeren registreres ikke i dev. |
| `build` | `tsc -b && vite build` → `frontend/dist` (inkl. `manifest.webmanifest` og `sw.js`) |
| `preview` | Serverer `dist` lokalt (bruges også af Playwright på port 4173) |
| `lint` | ESLint (typescript-eslint, react-hooks, jsx-a11y, prettier-config) |
| `format` / `format:check` | Prettier skriv / kontrollér |
| `test` | Vitest (jsdom) – `src/**` og `tests/**` med `.test`/`.spec` |
| `test:e2e` | Playwright mod den byggede app: WebKit med iPhone 15-profil og Chromium med Pixel 7-profil |
| `audit` | `npm audit --audit-level=high` – fejler ved høj/kritisk sårbarhed |
| `verify` | audit, lint, format:check, build og test i rækkefølge |

Om e2e-testene: Playwright bygger og starter selv `vite preview` på `127.0.0.1:4173`. Service workers
er blokeret som standard (`serviceWorkers: "block"`), så de ikke tager kontrol midt i en test.
PWA-testene (`e2e/pwa*.spec.ts`) tillader dem selv med `test.use({ serviceWorkers: "allow" })`.

### Konfiguration

- Der er ingen miljøvariabler og ingen `.env`-filer. Der er ingen forskel på dev, test og prod ud
  over, at service workeren kun registreres i produktionsbuild (`import.meta.env.PROD`, se
  `src/app/registerServiceWorker.ts`).
- **Appnavn:** `appName` i `src/texts/da.ts` (i dag "My Jobbuddy"). Bruges i manifest, `<title>`,
  `apple-mobile-web-app-title` og logo.
- **PWA-farver:** `themeColor` (`#f4f7f6`) og `backgroundColor` (`#0e7566`) i `vite.config.ts`.
  Manifestet og `<meta name="theme-color">` dannes herfra.
- **Demodato:** "i dag" er fast 31-10-2026 (`demoToday` i `src/shared/clock.ts`) og injiceres via
  `ClockProvider`, så demoen og tests ikke afhænger af det aktuelle tidspunkt.
- **TanStack Query** (`src/app/queryClient.ts`): ingen automatiske genforsøg og ingen genhentning ved
  vinduesfokus.
- **Alias:** `@` peger på `frontend/src`.

> TODO: Når C#-API'et findes, skal API'ets base-URL hentes fra miljøkonfiguration og valideres ved opstart (jf. frontendreglerne). Dokumentér her, hvordan det konfigureres pr. miljø.

### Kritiske entiteter

**`ApiClient`** (`src/shared/apiClient.ts`) – den eneste kontrakt, Model kender:

```ts
type ApiRequest = { method: HttpMethod; path: string; body?: unknown; signal?: AbortSignal };
type ApiClient = { request: (request: ApiRequest) => Promise<Result<unknown>> };
```

**`Result<T>`** (`src/shared/result.ts`) – egen kode kaster aldrig; fejl returneres som
`{ success: false, errorType, message, traceId?, fieldErrors? }`. `ErrorType` spejler API'ets
`ResponseErrorType` (400 `validationFailed`, 401 `unauthorized`, 403 `forbidden`, 404 `notFound`,
409 `conflict`, 500 `serverError`, 503 `serviceUnavailable`) plus de klientside-fejl
`networkError`, `aborted` og `invalidResponse` (svaret bestod ikke Zod-valideringen).
`fieldErrors` bruges ved `validationFailed`, så formularer kan vise fejlen ved det rigtige felt.

**Mock-API** (`src/mockApi/`):

- `createMockApiClient()` implementerer `ApiClient`. Hvert kald venter 300 ms (så loading-tilstande
  ses; tests kan sætte `delayMs: 0`), respekterer `AbortSignal`, og data sendes gennem JSON, så
  klienten altid får kopier. Fejl får et trace-id (`mock-trace-<n>`).
- `mockStore.ts` / `seed.ts`: in-memory store, dannet fra seed ved hver opstart. **Alt nulstilles ved
  genindlæsning**, så demoen altid starter ens. Id'er dannes med en tæller (fx `shift-100`).
- `routes.ts`: alle endpoints (`:navn` er en sti-parameter):

  | Metode | Sti |
  |---|---|
  | GET | `/profile`, `/subscription`, `/consents`, `/agreements`, `/jobs` |
  | PUT | `/consents/sickness` |
  | POST | `/jobs`, `/shifts/estimate`, `/shifts` |
  | GET | `/jobs/:jobId/shifts?month=ÅÅÅÅ-MM`, `/jobs/:jobId/pay-check` |
  | PUT / DELETE | `/shifts/:shiftId/sick` |
  | GET | `/chat/questions`, `/chat/questions/:questionId`, `/chat/questions/:questionId/answer` |

- `apiTypes.ts`: API-kontrakten (DTO'er). **Beløb er i øre (heltal), tider og timer i minutter
  (heltal), datoer `ÅÅÅÅ-MM-DD`, måneder `ÅÅÅÅ-MM`.** Frontendens Zod-skemaer ligger i
  `src/shared/apiSchemas.ts`.
- `agreements/`: regelsæt pr. overenskomst. `agreementRuleSet.ts` definerer typen
  (timeløn, betalt pause, tillægsregler, om syge vagter giver tillæg), `hkHandelButik.ts` er det
  eneste regelsæt, og `ruleSetRegistry.ts` slår op på overenskomstkode. En overenskomst kan kun
  vælges, når den har et regelsæt. Satserne er eksempelsatser, ikke overenskomstens rigtige.
- `shiftCalculation.ts`: beregning af en vagts timer, tillæg og forventede løn.
- `payCheck.ts`: løntjekket – sammenligner det forventede ud fra vagterne med lønsedlen (timer,
  aften-, lørdags- og søndagstimer); kun underbetaling bliver en "mulig fejl".
- `validation/`: validering af vagter og job, med fejl pr. felt.
- Sygdom kræver samtykke: API'et afviser at markere en vagt som syg, når samtykket er fra, og
  trækkes samtykket tilbage, slettes alle sygdomsmarkeringer.

**Vigtigt for det kommende API:** forretningsreglerne (regelsættene i `mockApi/agreements/`,
vagtberegning, løntjek i `payCheck.ts`, validering og samtykkereglen) er businesslogik og skal
flyttes til C#-API'et, når det laves. `apiTypes.ts` og `routes.ts` er udgangspunktet for
API-kontrakten. Specifikationen af reglerne og seed-tallene står i planen for demoen.

**Andre centrale dele:**

- `src/app/AppProviders.tsx`: `QueryClientProvider` → `ApiClientProvider` → `ClockProvider` →
  `NotImplementedProvider`. Tests kan give egne instanser.
- `useNotImplemented()` (`src/app/notImplemented/`): åbner dialogen "Ikke implementeret" for
  funktioner, der ikke er en del af demoen.
- `src/components/ErrorBoundary.tsx`: Error Boundary omkring hver widget.
- `src/shared/zodSetup.ts`: `z.config({ jitless: true })`. Skal importeres før alle Zod-skemaer
  (først i `main.tsx` og øverst i `shared/apiSchemas.ts`), fordi Zod ellers forsøger at generere kode
  med `new Function`, hvilket CSP'en forbyder.

### Design system

- `design-system/` er en uændret kopi af et Claude Design-artifact (README, tokens, komponenter og
  assets). Den er kun reference og indgår ikke i buildet. Ret ikke i den.
- Tokens er oversat til `frontend/src/styles/globals.css` (shadcn-tema og Tailwind v4
  `@theme inline` samt tekststile).
- Fonten Figtree (vægt 400–800) hostes selv fra `frontend/public/fonts/`. Der hentes ingen fonte,
  scripts eller andet fra CDN'er.

### Afhængigheder

Eksakte versioner står i `frontend/package.json`.

| Pakke | Version | Bruges til |
|---|---|---|
| react, react-dom | 19.3.1 | UI |
| react-router | 8.5.0 | Routing (`createBrowserRouter`) |
| @tanstack/react-query | 5.104.5 | Datahentning, mutationer og cache-invalidering |
| zod | 4.6.7 | Validering af API-svar i Model (kører jitless) |
| radix-ui | 1.8.1 | Grundlag for shadcn/ui-komponenterne (tastatur og ARIA) |
| react-day-picker | 10.0.2 | shadcn Calendar |
| lucide-react | 1.61.0 | Ikoner |
| class-variance-authority, clsx, tailwind-merge | 0.7.1 / 2.1.1 / 3.7.0 | Varianter og sammensætning af Tailwind-klasser (`cn()`) |
| tw-animate-css | 1.4.0 | Animationer til shadcn |
| typescript | 6.0.3 | Strict TypeScript |
| vite, @vitejs/plugin-react | 8.3.5 / 6.1.2 | Build og dev-server |
| tailwindcss, @tailwindcss/vite | 4.3.3 | Styling |
| eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, eslint-config-prettier | 9.39.5 / 8.72.0 / 7.1.1 / 6.10.2 / 10.1.8 | Lint |
| prettier | 3.9.10 | Formatering |
| vitest, jsdom, @testing-library/* | 5.0.5 / 30.1.3 / … | Unit- og komponenttests |
| @playwright/test, @axe-core/playwright | 1.64.1 / 4.14.0 | Browsertests og tilgængelighedstests |

Bemærk:

- shadcn/ui er ikke en npm-pakke; komponenterne er hentet som kildekode til `src/components/ui/`
  (konfiguration i `frontend/components.json`).
- TypeScript 6 og ESLint 9 er valgt på grund af peer-krav fra de øvrige værktøjer.
- Service workeren er håndskrevet og bruger ingen pakker.

## API

Der findes endnu intet API. Mock-API'et i `frontend/src/mockApi/` står i stedet for det (se
[Kritiske entiteter](#kritiske-entiteter)).

> TODO: Når C#-API'et laves: installation, konfiguration (connection strings m.m.), Swagger-URL, domænemodeller og afhængigheder.

## Sikkerhed

Headers sendes af Netlify ud fra `frontend/public/_headers` (kopieres til `dist/_headers` ved build):

- **Content-Security-Policy:** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`.
  Scripts må kun komme fra egen server (ingen `unsafe-inline` eller `unsafe-eval`). `style-src`
  tillader `'unsafe-inline'`, fordi Radix (Dialog, Sheet, Select) via react-remove-scroll indsætter et
  `<style>`-element under kørsel, som ikke kan få en fast hash eller nonce på en statisk host.
- **Strict-Transport-Security:** `max-age=31536000`.
- **X-Content-Type-Options:** `nosniff`.
- **Referrer-Policy:** `no-referrer`.
- **Permissions-Policy:** `camera=(), microphone=(), geolocation=(), payment=(), usb=()`.

Øvrigt:

- Alle data er syntetiske og ligger kun i hukommelsen i browseren. Intet sendes til en server, og
  service workeren cacher ingen data.
- Der er ingen login, cookies eller tokens i demoen.

## PWA og service worker

**Manifest:** dannes af `build/webManifestPlugin.ts` (i dev serveret af Vite, ved build skrevet som
`dist/manifest.webmanifest`): `id` og `start_url` `/`, `display: standalone`, `lang: da`, ikoner 192,
512 og maskable 512. Apple-touch-ikonet (180) og `apple-mobile-web-app-*` står i `index.html`.

**Service worker:** `build/serviceWorkerPlugin.ts` skriver `dist/sw.js` ved build ud fra
`build/serviceWorker.template.js`. Den registreres af `src/app/registerServiceWorker.ts` efter
`load`, kun i produktionsbuild. Fejler registreringen, kører appen videre uden.

| Emne | Opførsel |
|---|---|
| Precache, påkrævet | Appens side (gemt under `/`, ikke `/index.html`) og alle filer under `/assets/`. Fejler én af dem, fejler installationen, og den forrige service worker og dens cache bliver stående. |
| Precache, best-effort | `/manifest.webmanifest`, `/fonts/*`, `/icons/*` |
| Cache-version | SHA-256 (16 tegn) af navn og indhold af `index.html`, assets, manifest, fonte og ikoner. Cachen hedder `my-jobbuddy-<version>`. |
| Ny version | `skipWaiting` og `clients.claim`; gamle `my-jobbuddy-*`-caches slettes i `activate`. |
| Navigation | Network-first. HTML-svar gemmes som appens side; uden net bruges den gemte side. |
| `/assets/*`, `/fonts/*`, `/icons/*` | Cache-first (match med `ignoreVary`) |
| Alt andet | Går direkte til nettet. Kun same-origin GET håndteres. |
| Data | Caches ikke. |

Ret altid i `build/serviceWorker.template.js`, aldrig i `dist/sw.js`.

## Drift

### Hosting (Netlify)

Frontenden hostes på Netlify som statiske filer med manuel upload ("Deploy manually").

**Ny version:**

1. Byg: `npm --prefix E:/Repositories/Jobbuddy/frontend run verify` (eller mindst `run build`).
2. Upload hele mappen `frontend/dist` til sitet i Netlify (Deploys → "Deploy manually", træk mappen
   ind).
3. Kontrollér, at `dist` indeholder `index.html`, `sw.js`, `manifest.webmanifest`, `_headers` og
   `_redirects`.

Service workeren får automatisk en ny cache-version, når filerne er ændret, og tager over ved næste
besøg. Rollback sker ved at udgive en tidligere deploy i Netlifys deploy-liste eller uploade en
tidligere `dist`.

**Routing:** `public/_redirects` indeholder `/* /index.html 200`, så alle ruter (fx `/loen`) får
appens side, mens eksisterende filer (`/assets/*`, `/sw.js`) stadig serveres først.

**Cache-headers** (`public/_headers`): `/sw.js`, `/`, `/index.html` og `/manifest.webmanifest` har
`Cache-Control: no-cache`, så en ny version altid hentes. `/assets/*` har
`public, max-age=31536000, immutable` (filnavnene har hash).

### Domæne (myjobbuddy.dk hos One.com)

DNS for `myjobbuddy.dk` ligger hos One.com og peges mod Netlify:

1. Tilføj domænet under sitets **Domain management** i Netlify og notér den IP, Netlify viser for
   apex-domænet.
2. Hos One.com: fjern One.coms egne A-, AAAA- og CNAME-records for `@` og `www`.
3. Opret en **A-record** for `@` til IP'en fra Netlify.
4. Opret en **CNAME** for `www` → `<site>.netlify.app`.
5. Rør ikke MX-records (mail).
6. HTTPS-certifikatet udstedes af Netlify, når DNS peger rigtigt.

> TODO: Netlify-sitets navn (`<site>.netlify.app`) og den A-record-IP, Netlify viser, er ikke registreret i projektet. Notér dem her, når sitet er oprettet.

### Logs, overvågning og fejlsøgning

- Der er ingen server-side logs ud over Netlifys deploy-log og eventuelle Netlify-analyser. Appen
  logger ikke.
- Fejl i en widget vises for brugeren med et trace-id (fra mock-API'et: `mock-trace-<n>`).
- Fejlsøgning af PWA'en: browserens udviklerværktøjer → Application → Service Workers / Cache
  Storage. Ved mistanke om forældet cache: "Unregister" og "Clear site data", og genindlæs.
- CSP-fejl ses i browserkonsollen. Fejler Zod med en CSP-fejl, er `shared/zodSetup.ts` ikke
  importeret før et skema.

> TODO: Overvågning (oppetid, fejlrapportering) er ikke sat op. Afklar om det skal med, før løsningen bruges ud over pitch-demoen.

### Kendte forhold

- Bundlet er 786 kB (237 kB gzip). Det er accepteret for demoen.
- `npm audit` viser 7 moderate fund i udviklingsværktøjer. `audit`-scriptet fejler kun ved høj eller
  kritisk alvorlighed.
- TypeScript 6 og ESLint 9 er valgt på grund af peer-krav.
- shadcn-komponenterne er hentet som kildekode uden npm-pakken `cn`.
- At service workeren beholder den forrige version, når installationen af en ny fejler, kan ikke
  testes i e2e-testene.
- Appen er ikke afprøvet på en rigtig iPhone, kun i Playwrights WebKit med iPhone 15-profil.
- Alle data nulstilles ved genindlæsning (forventet opførsel i demoen).

### Inden rigtig drift

Det følgende mangler, før løsningen kan bruges med rigtige brugere og data:

> TODO: C#-API, database, login og sessionshåndtering findes ikke; forretningsreglerne skal flyttes fra mock-API'et til API'et, og mock-klienten skiftes ud i `src/app/App.tsx`.

> TODO: Regelsættet for HK Handel – Butik bruger eksempelsatser; de rigtige overenskomstsatser og helligdage mangler.

> TODO: Tilgængelighedserklæring (link i sidefoden og viderestilling af `/was` på webserveren) er ikke lavet.

> TODO: Byg og deploy er manuelle; der er ingen CI/CD-pipeline, der kører `verify` før udgivelse.

## Revisionshistorik

| Revision | Dato | Dækker | Ændring |
|---|---|---|---|
| 1 | 08-11-2026 | frontend 0.1.0 | Første udgave: opbygning, mock-API, design system, PWA, sikkerhed, hosting på Netlify og domæne |
