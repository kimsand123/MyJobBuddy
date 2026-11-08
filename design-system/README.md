Min Jobbuddy er "første hjælp" til unge med fritids- og studiejob. Appen samler kontrakt, overenskomst, vagter og lønseddel ét sted. Den tjekker lønnen og forklarer rettigheder. Undertitel: **Din arbejdsplads i lommen**.

Systemet er bygget til en PWA i React + TypeScript + Tailwind + shadcn/ui. Tokens hedder det samme som shadcn's CSS-variabler, og hver komponent nævner den shadcn-primitive, den skal bygges på.

## Tone og sprog

- Skriv kort og enkelt dansk, og tiltal brugeren med **du**. Brug ikke juridisk sprog: skriv "Du kan sige op med 14 dages varsel", ikke "Opsigelsesvarslet udgør 14 dage".
- Vær venlig, direkte og tryg, men ikke barnlig. Appen handler om penge og rettigheder. Brug ingen emojis og ingen udråbstegn i fejl.
- Svar først, forklar bagefter: "Ja. Du er under 18, så du skal have mindst 30 minutters pause, når du arbejder mere end 4,5 timer."
- Skriv "mulige fejl", ikke "fejl", når appen sammenligner løn. Appen vejleder; den dømmer ikke.
- Disclaimeren står roligt og er altid den samme: "Jeg er en AI og giver vejledning, ikke juridisk rådgivning."
- Knapper er verber: "Kom i gang", "Bekræft", "Gem vagt", "Del min sag", "Prøv igen".
- Komponentnavne er på engelsk og al tekst i appen er på dansk.

## Tal og datoer

- Beløb: `1.234,56 kr.` (punktum i tusinder, komma i decimaler, altid to decimaler). Brug `formatKr`.
- Satser: `30,00 kr./t` og `29 kr./md.`
- Timer: `25,5 t`. Brug `formatHours`.
- Datoer: `11. okt. 2026` og i lister `søn. 11. okt.`. Brug `formatDate` og `weekdayShort`.
- Tider: `15:30–21:00` med tankestreg.
- Sæt beløb i kolonner med `.mj-num` (tabular-nums) og højrestil dem.

## Farver

Primærfarven er `primary` (teal), og `foreground` (mørkeblå) bruges til overskrifter, tekst og ikoner. Baggrunden er lys (`background`) og indholdet ligger på hvide kort (`card`).

- Brug `primary` til den ene hovedhandling pr. skærm, til aktiv fane og til valgt dag. Tekst ovenpå er `primary-foreground`.
- Brug `secondary` med `secondary-foreground` til ikonfelter, tillægs-badges og sekundære knapper.
- Brug `navy` med `navy-foreground` kun til PromoBanner og brugerens chatbobler. Ikoner på navy er `navy-accent`.
- `primary-bright` er kun til grafik (logo, illustrationer). Det er aldrig tekst.
- `muted-foreground` er til hjælpetekst, kilder og metadata.
- `destructive` bruges kun til "Slet alle mine data".
- `border` er dekorativ. Kanter på felter og switches er `input` (3:1 eller mere).

**Status.** `success` (I orden), `warning` (Mulig fejl), `danger` (Fejl) og `info` (Til info) har hver en `-soft` baggrund. Status vises **altid** med ikon og tekst, og i løntjekket også med beløb: `circle-check`, `triangle-alert`, `circle-alert` og `info`.

**Mørk tilstand.** Kun lys tilstand er lavet. Tokens er semantiske, så en mørk tilstand tilføjes som et nyt tema med de samme navne, uden at komponenterne ændres.

## Typografi

Skrifttypen er **Figtree** (SIL Open Font License). Fem vægte (400–800) ligger som woff2 under `fonts/` og hostes selv; den færdige app henter intet fra CDN'er.

- `text-display` kun på velkomstskærmen.
- `text-title-1` til skærmtitel og hilsen, `text-title-2` til sektioner og store kort, `text-title-3` til titler i kort og rækker.
- `text-body` (16px) til brødtekst, chat og alle felter. Felter må aldrig være mindre, ellers zoomer iOS.
- `text-body-sm` til hjælpetekst og kilder, `text-label` til feltlabels og `text-caption` (12px) kun til fanebjælken og ugedage.
- `text-amount` til store beløb og `text-amount-sm` til beløb i rækker.
- Størrelser er i `rem`, så de følger brugerens tekststørrelse og virker ved 200 % zoom.

## Afstand, hjørner og skygger

- Sidemargin og padding i kort er `space-4` (16px). Store kort bruger `space-5`.
- Kort i en liste har `space-3` imellem, og sektioner har `space-6`.
- Hjørner: knapper og felter `radius-md`, kort `radius-lg`, store kort og Sheet `radius-xl`, chips og switch `radius-full`.
- Skygger: `shadow-card` på kort, `shadow-raised` på AI-fanen, `shadow-bar` på fanebjælken og `shadow-sheet` på ark. Skyggerne er svage, og kort skal også kunne skelnes på farven alene.

## Layout og PWA

- Design til 390 × 844 px. Alt skal virke ned til 320 px uden vandret scroll. Gitre bruger `auto-fit`, så de falder til én kolonne.
- Indholdet er højst `content-max` (480px) bredt og centreret på store skærme.
- **Safe areas.** Sæt `viewport-fit=cover` i viewport-tagget. AppHeader har `padding-top: env(safe-area-inset-top)`, og BottomTabBar og Sheet har `padding-bottom: env(safe-area-inset-bottom)`. Intet indhold må ligge under notch, Dynamic Island eller hjemmeindikatoren.
- **Manifest:** `"display": "standalone"`, `"theme_color": "#f4f7f6"` (= `background`, så statuslinjen flyder sammen med AppHeader), `"background_color": "#0e7566"` (= `primary`, opstartsskærm med det hvide mærke). Til iOS: `apple-mobile-web-app-status-bar-style` = `default`.
- **Ikoner:** `app-icon-1024.png` er masteren (fuld flade, ingen afrundede hjørner, så styresystemet afrunder selv). `app-icon-maskable-1024.png` har mærket inden for den sikre cirkel på 80 % og bruges med `"purpose": "maskable"`. Lav 512, 192 og 180 px (apple-touch-icon) ud fra masteren.
- Appen har sit eget udtryk og kopierer ikke iOS: egen fanebjælke med hævet AI-knap, egne ark og ingen iOS-specifikke kontroller.
- **Touch, ikke hover.** Feedback ved tryk gives med `:active` (`accent` baggrund eller let skalering). Intet må afhænge af hover.
- Fanebjælken har tre faner: **Hjem**, **AI** (midten, fremhævet) og **Mig**. Kontrakt, Vagter og Løn åbnes fra felterne på Hjem.

## Ikoner

Brug Lucide (lucide-react) med streg 2 i 24px; mindre ikoner i badges er 14px med streg 2,5. Ikoner har tekstens farve. Faste ikoner: Kontrakt `file-text`, Vagter `calendar-days`, Løn `wallet`, Rettigheder `scale`, AI `sparkles`, Hjem `house`, Mig `user`, skjult `eye-off`, henvisning `life-buoy`. Ingen emojis.

## Tilgængelighed (WCAG 2.1 AA)

- Tekst har mindst 4,5:1 kontrast, og ikoner, kanter og grafik har mindst 3:1. Hvert farvetoken nævner sin kontrast i usage-noten.
- Farve bærer aldrig betydning alene: status har ikon og tekst, aktiv fane er understreget, og vagtdage har en streg.
- Trykflader er mindst `tap-target` (44 × 44 px).
- **Fokus** er altid synligt: 2px solid `ring` med 2px afstand (`:focus-visible`). Klassen `.is-focus` viser det samme i previews.
- Felter har synlige labels, og fejlteksten står ved feltet med `aria-describedby`.
- Respektér `prefers-reduced-motion`: spinnere og skeletons stopper.

## Data og GDPR i designet

- Velkomstflowet har skærmen **"Dine data er dine"** med fire løfter, hver med et ikon:
  1. `eye-off` "Vi fjerner CPR, adresse og kontonummer, før AI'en læser dine dokumenter."
  2. `file-text` "Vi gemmer tallene, ikke selve dokumentet."
  3. `download` "Du kan se, hente og slette alle dine data med ét tryk."
  4. `shield-check` "Vi sælger aldrig dine data, heller ikke til samarbejdspartnere."
- Sygdom har sit eget samtykke (ConsentToggle), som er **Fra** fra start: "Må vi gemme, når du har været syg? Det bruger vi til at tjekke din løn under sygdom."
- Efter upload vises CPR og kontonummer med MaskedField og mærket "Skjult for AI".
- Intet deles med en fagforening, før brugeren har trykket "Del min sag" og set ConsentSheet med præcis, hvad der deles og ikke deles.
- Under "Mig" › "Mine data" findes Se, Hent og "Slet alle mine data" (`destructive`, bekræftes i en Dialog).

## Eksempeldata

Alt er fiktivt og ens på alle skærme. Det ligger i `MinJobbuddy.exampleData`. Satserne er eksempler, ikke overenskomstens rigtige satser, og teamet faktatjekker alt fagligt indhold før pitchen.

- Maja, 17 år, butiksmedarbejder i Torvebutikken, HK Handel – Butik.
- Timeløn 92,50 kr.; aftentillæg 30,00 kr./t (hverdage efter kl. 18); lørdagstillæg 40,00 kr./t (efter kl. 15); søndags- og helligdagstillæg 45,00 kr./t; pause 30 min. ved mere end 4,5 timer (betalt).
- Vagter i oktober 2026: tir. 6/10 16–20 (430,00), tor. 8/10 16–20 (430,00), lør. 10/10 9–15 (555,00), søn. 11/10 10–16 (825,00), ons. 14/10 15:30–21 (598,75). I alt 25,5 t og 2.838,75 kr.
- Lønseddel: 24 t, aftentillæg for 7 t, intet søndagstillæg, 2.430,00 kr.
- Mulige fejl: 1,5 t mangler ons. 14/10 (138,75 kr.) og søndagstillæg mangler for 6 t søn. 11/10 (270,00 kr.). I alt 408,75 kr.
- Teksterne for opsigelse og sygdom ("Du kan sige op med 14 dages varsel", "Meld dig syg til din leder inden vagten") er pladsholdere, som skal faktatjekkes.
- HK Handel nævnes kun med tekst, aldrig med logo. Brug ingen rigtige logoer, varemærker eller personoplysninger.

## Abonnement

- **Gratis:** 5 AI-spørgsmål og 1 løntjek om måneden. Vis forbruget: "3 af 5 spørgsmål tilbage".
- **Plus:** 29 kr./md. med 100 AI-spørgsmål og ubegrænset løntjek.
- **Betal pr. spørgsmål:** prisen vises, før brugeren betaler.

## Overdragelse til kode

Kopiér tokens direkte ind i shadcn-temaet (`globals.css`). Navnene er de samme:

```css
:root {
  --background: #f4f7f6;   --foreground: #0f2a44;
  --card: #ffffff;         --card-foreground: #0f2a44;
  --popover: #ffffff;      --popover-foreground: #0f2a44;
  --primary: #0e7566;      --primary-foreground: #ffffff;
  --secondary: #e2f3ef;    --secondary-foreground: #0b5e52;
  --muted: #eef2f1;        --muted-foreground: #4a5b69;
  --accent: #e7eef7;       --accent-foreground: #0f2a44;
  --destructive: #b3261e;  --destructive-foreground: #ffffff;
  --border: #d3dedb;       --input: #6b7c88;   --ring: #0f2a44;
  --success: #16734a; --success-soft: #e3f5ec;
  --warning: #975400; --warning-soft: #fdf1dc;
  --danger: #b3261e;  --danger-soft: #fdecea;
  --info: #1f5fa8;    --info-soft: #e7effa;
  --navy: #0f2a44; --navy-foreground: #ffffff; --navy-accent: #7fd8c6;
  --primary-bright: #14a08a;
  --radius: 12px; /* = radius-md */
}
/* .dark { … } tilføjes senere med de samme navne */
```

- Med Tailwind v4: tilføj `--color-success: var(--success);` osv. i `@theme inline`, så `bg-success-soft text-success` virker. Med v3: tilføj dem under `theme.extend.colors`.
- Læg `fonts/Figtree-*.woff2` i `public/fonts` og brug `@font-face` som i `tokens.css`.
- Komponenterne i `components/src/index.tsx` er referencer. Byg hver komponent på den shadcn-primitive, dens README nævner (Button, Card, Input, Sheet, Dialog, Tabs, Switch, Badge, Progress, Calendar). Skift `<Icon name="wallet" />` ud med `<Wallet />` fra lucide-react.
- Behold props-navnene fra `components/index.d.ts`, så prototype og app taler samme sprog.
