# Dagbog

Løbende log over hvad der konkret er lavet med Claude Code i projektet My Jobbuddy, og hvad vi har lært undervejs. Nyeste indgang står øverst.

## 2026-11-08

Første session i projektet. Claude Code kørte som Orchestrator med subagenter: csharpdev (implementer), csharpreviewer (review), csharptester (test) og dokumenter (dokumentation). Der fandtes ingen frontend-agenter, så vi brugte de nærmeste C#-agenter, også til React/TypeScript-koden.

### Dagens resultater

- **Fra idé til forståelse.** Orchestrator læste projektbeskrivelsen og et mockup-billede og opsummerede projektet. Mockuppet var en BMP-fil, så det blev konverteret til PNG i scratchpad, før det kunne ses.
- **Navn og domæne.** Første valg, "Min Jobbuddy", gik ikke, fordi domænet var taget. Orchestrator lavede 20 navneforslag og tjekkede .dk-domænerne via DNS. Vi endte med **My Jobbuddy** og **myjobbuddy.dk**.
- **Beslutninger truffet med Kim:**
  - Klikbar demo med syntetiske data.
  - HK Handel-overenskomsten holdes isoleret som et selvstændigt regelsæt.
  - GDPR er drøftet og parkeret. Det vi nåede frem til: originaldokumenter slettes, oplysninger om sygdom gemmes kun med samtykke, chats gemmes ikke, og pseudonymisering er skitseret.
  - Indtægtsmodel drøftet.
  - Teknologi: vi drøftede først en native iPhone-app i SwiftUI, men den kræver en Mac. I stedet valgte vi en PWA i React + TypeScript.
  - Hosting på Netlify med DNS hos One.com.
- **Design.** Orchestrator skrev en brief til Claude Design, og Kim lavede designsystemet dér. Orchestrator hentede det fra Claude-artifactet, og csharpdev kopierede det ind uændret: 83 filer, kontrolleret med SHA-256.
- **Implementering i to faser:**
  - Fase A: fundament og mock-API.
  - Fase B: skærmene.
  - Hver fase gik gennem arbejdsgangen implementer (csharpdev) → review (csharpreviewer) → test (csharptester), med højst 2 runder pr. trin. Testeren skrev black-box-tests ud fra et API-overblik med .d.ts-filer og så aldrig implementeringen.
  - Resultat: 896 Vitest-tests og 218 Playwright-tests, alle grønne.
- **Lavet ud over planen:**
  - PWA-installation: service worker og filerne til Netlify.
  - "Spørg AI" med et forvalgt spørgsmål.
  - Et oversigtsdokument som PDF til gruppen, lavet som Claude Docs-dokument og eksporteret.

### Dagens læring

#### 1. Reviewerens fund var konkrete og rigtige

**Situation:** csharpreviewer reviewede frontend-koden fra fase A og B.

**Hvad skete der:** Revieweren fandt tre konkrete fejl, som blev rettet:
- Fokusringen fra shadcn havde for lav kontrast.
- Radioknapper åbnede en dialog, når man flyttede rundt i dem med piletasterne. Det bryder WCAG 3.2.2, fordi et skift af valg ikke må udløse en uventet ændring af konteksten.
- Service workeren gav en hvid skærm offline, når man havde besøgt siden én gang.

**Årsag:** Revieweren fik en afgrænset opgave og havde regler at reviewe imod, fx tilgængelighedsreglerne (WCAG 2.1 AA). Det gav fund med en præcis årsag i stedet for generelle bemærkninger.

**Lære:** En reviewer-agent med eksplicitte regler finder fejl, man ellers først ser i drift, fx tilgængelighed og offline-adfærd. Det betaler sig at give revieweren noget konkret at holde koden op imod.

#### 2. Testeren fandt fejl, som reviewet ikke så

**Situation:** csharptester skrev black-box-tests ud fra API-overblikket, uden at se implementeringen.

**Hvad skete der:** Testerne afslørede fejl, som revieweren ikke havde fanget:
- Fokus vendte ikke tilbage til det element, der åbnede en dialog, når dialogen blev lukket.
- App'en forsøgte at bruge `eval` under Content Security Policy. Zod-konfigurationen kørte først, efter at modulerne var indlæst, så rækkefølgen af ES-imports havde betydning.
- Et skærmlæsernavn indeholdt et overflødigt mellemrum.

**Årsag:** En review læser koden. En test kører den. Fejl i rækkefølgen ved kørsel (som import-rækkefølgen) og fejl i fokushåndteringen viser sig først, når koden faktisk kører i en browser.

**Lære:** Review og test fanger forskellige fejl, så de supplerer hinanden. Black-box-tests mod en kørende app, især med Playwright, fanger fejl, man ikke ser ved at læse koden.

#### 3. Agenterne lavede også selv fejl

**Situation:** Undervejs lavede både Orchestrator og agenterne fejl i deres eget arbejde.

**Hvad skete der:**
- Orchestrator kørte `tsc` for at danne API-overblikket til testeren, og kørslen skrev 21 .d.ts-filer ind i `tests/`. Kørslen fejlede, men den skrev filerne alligevel. Testeren opdagede det, fordi lint fejlede.
- Implementeren skrev en fil uden for `frontend/` og ryddede selv op bagefter.
- Et PowerShell-script blev blokeret, først af execution policy og derefter af sikkerhedsvagten. Det blev skrevet om til Node.

**Årsag:** Værktøjer kan have bivirkninger, man ikke forventer, fx at en fejlet kørsel stadig skriver output. Og agenter arbejder ikke altid inden for de rammer, man tror.

**Lære:** Lad værktøjer skrive output i en isoleret mappe (scratchpad), ikke i projektet. Lint og de automatiske vagter er et sikkerhedsnet, der fanger fejl, som ingen agent selv har opdaget. Man skal heller ikke gå ud fra, at Orchestrator ikke laver fejl.

#### 4. Kim kunne styre undervejs, og pakkerne blev holdt inden for det godkendte

**Situation:** Arbejdsgangen kørte uden at Orchestrator ventede på Kim mellem trinene, men Kim fulgte med.

**Hvad skete der:** Kim kunne sætte testrunder på pause, starte fase B parallelt og ændre beslutninger undervejs. Samtidig blev der kun brugt godkendte pakker. Fx blev shadcn's nye `cn`-pakke bevidst ikke taget i brug.

**Årsag:** Når faserne og rollerne er klart adskilt, kan man gribe ind et bestemt sted uden at hele kæden bryder sammen. Reglen om, at nye pakker skal godkendes, var skrevet ned, så agenterne kunne følge den.

**Lære:** En opdelt arbejdsgang gør det muligt for et menneske at styre undervejs. Regler, der står skrevet, bliver fulgt, også når et værktøj selv foreslår at trække en ny afhængighed ind.

#### 5. Det, der stadig er åbent

**Situation:** Demoen er bygget og testet, men er ikke færdig til brug.

**Hvad skete der:** Tre ting står tilbage:
- Satser og chatsvar er ikke faktatjekket.
- App'en er ikke afprøvet på en rigtig iPhone.
- Dokumentationen blev lavet til sidst i stedet for løbende.

**Årsag:** De automatiske tests kontrollerer, at koden opfører sig som specificeret. De kontrollerer ikke, om indholdet er rigtigt, og de kører ikke på en rigtig telefon.

**Lære:** Grønne tests betyder ikke, at indholdet er korrekt. Fagligt indhold, fx satser fra en overenskomst og AI-svar, skal tjekkes af et menneske, og afprøvning på en fysisk enhed kan ikke erstattes af Playwright. Dokumentationen bør laves som en del af hver fase, ikke samlet til sidst.
