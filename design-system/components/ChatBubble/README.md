# ChatBubble

En besked i chatten fra brugeren (navy, højre) eller AI (hvid, venstre).

**Byg på shadcn/ui:** —

**Du leverer:** `from`, `children`, `source`, `typing`, `error`, `onRetry`.

## Regler

- AI-svar starter med svaret ("Ja." / "Nej,") og er korte.
- `source` viser, hvor svaret kommer fra ("Fra din kontrakt, § 7").
- Mens AI skriver, vises tre prikker med `role="status"`.
- Under AI-svar står AiDisclaimer.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
