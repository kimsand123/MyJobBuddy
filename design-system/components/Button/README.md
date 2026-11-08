# Button

Knappen til alle handlinger; én primary pr. skærm.

**Byg på shadcn/ui:** Button

**Du leverer:** `children` (dansk verbum, fx "Bekræft", "Gem vagt"), `variant`, valgfrit `icon`/`iconRight` (Lucide-navn), `loading`, `disabled`, `onClick`.

## Regler

- `primary` (teal) til skærmens hovedhandling, i bunden og fuld bredde (`size="lg" block`).
- `secondary` til næste skridt ved siden af en primær, fx "Sådan spørger du din chef".
- `outline` til neutrale handlinger som "Hent data"; `ghost` til "Ret", "Annuller" og "Ikke nu".
- `destructive` kun til "Slet alle mine data", og altid efterfulgt af en Dialog, der bekræfter.
- `navy` kun inde i PromoBanner.
- `loading` skifter ikon til spinner og teksten til "Gemmer…"; knappen er deaktiveret imens.
- Højde mindst `control-height` (48px), `sm` mindst `tap-target` (44px).

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
