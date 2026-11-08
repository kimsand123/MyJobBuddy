# FactRow

Et vilkår fra kontrakten: navn, værdi, kilde og knappen "Ret".

**Byg på shadcn/ui:** Card-liste + Button

**Du leverer:** `label`, `value`, `source`, `edited`, `onEdit`, `loading`, `disabled`. Pak rækkerne ind i `FactList`.

## Regler

- Kilden står altid under værdien ("Din kontrakt, § 3" eller "Overenskomst").
- Når brugeren har rettet en værdi, vises badgen "Rettet af dig".
- "Ret" har skjult tekst med vilkårets navn, så skærmlæsere siger "Ret timeløn".
- Under listen ligger én primærknap: "Bekræft".

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
