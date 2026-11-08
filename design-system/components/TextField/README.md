# TextField

Tekstfelt med synlig label, hjælpetekst og fejltekst ved feltet.

**Byg på shadcn/ui:** Input + Label

**Du leverer:** `label` (altid synlig, aldrig kun placeholder), `value`, `onChange`, `type`, `hint`, `error`, `disabled`.

## Regler

- Fejlteksten står lige under feltet med ikonet circle-alert, og feltet får en 2px `danger`-kant og `aria-invalid`.
- Fejltekster siger, hvad der skal ske: "Slut skal være efter start (15:30)."
- Skriftstørrelse 16px (`text-body`), så iOS Safari ikke zoomer ind.
- Deaktiveret: `muted` baggrund og stiplet kant.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
