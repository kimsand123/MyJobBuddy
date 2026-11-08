# Versionsdokumentation

Overblik over hvad der er tilføjet, rettet og fjernet i My Jobbuddy (myjobbuddy.dk), nyeste øverst.
Projektet har indtil videre kun en frontend (PWA). Data kommer fra et mock-API i browseren, så der er
ingen API-sektion endnu.

Ændringer samles under "Ikke udgivet", indtil versionsnummeret bumpes i koden. Sidste version i
`frontend/package.json` er 0.1.0.

## Ikke udgivet

### Frontend

#### Tilføjet

- Første version af My Jobbuddy som klikbar PWA-demo til pitch: AI-baseret "første hjælp" til unge
  15–25 år med fritidsjob. Al data er syntetisk.
- Designsystemet "Min Jobbuddy" (brandbog, tokens, Figtree-fonte, komponentbeskrivelser, logoer og
  app-ikoner) i `design-system/`.
- Mock-API i browseren med regelsættet HK Handel – Butik (eksempelsatser), løntjek, validering og
  eksempeldata: Maja, 17 år, ansat i Torvebutikken, med 5 vagter i oktober 2026 og en lønseddel.
- Hjem: forside med overblik.
- Vagter: kalender, vagtliste, tilføj vagt med løbende lønestimat og "Jeg var syg" med samtykke.
- Løn: løntjek, der viser "2 mulige fejl – 408,75 kr.", lønseddel med maskeret CPR- og kontonummer
  og "Spørg AI", der åbner chatten med et relevant spørgsmål.
- AI: rådgiver med 3 forslag og færdigskrevne svar samt henvisning til fagforening med samtykkeark.
- Mig: profil, flere job med overenskomst, samtykke til sygdom, abonnement og Mine data.
- Dialogen "Ikke implementeret" for handlinger, der ikke er bygget i demoen.
- Installation som app (PWA): manifest, app-ikoner og service worker, så appen kan starte offline.
- Sikkerhedsheadere (bl.a. CSP og HSTS) og omdirigeringer til hosting på Netlify.
- Automatiske tests: 896 Vitest-tests og 218 Playwright-tests på WebKit (iPhone 15) og Chromium
  (Pixel 7), inkl. tilgængelighedstjek med axe, monkey-tests, skærmbredder på 320 og 360 px og
  offline-start.

#### Kendte forhold

- Den samlede JavaScript-pakke er 786 kB (237 kB gzip). Det er accepteret af Kim til demoen.
- `npm audit` viser 7 moderate fund i et udviklingsværktøj (minimatch via typescript-eslint). De
  indgår ikke i den færdige app.
- Lønsatser og chatsvar er eksempler og skal faktatjekkes, før de bruges som rådgivning.
- Appen er ikke afprøvet på en rigtig iPhone.
- Forkortede ugedage følger browserens danske standard (fx "tirs." og "tors.").
