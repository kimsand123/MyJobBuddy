# PayCheckSummary

Resultatet af løntjekket: forventet, udbetalt og forskel.

**Byg på shadcn/ui:** Card

**Du leverer:** `month`, `expected`, `paid`, `issueCount`, `loading`.

## Regler

- Overskriften siger resultatet med tal: "Vi fandt 2 mulige fejl – i alt 408,75 kr."
- Status har altid ikon, tekst og beløb.
- Ordet er "mulige fejl", ikke "fejl"; appen giver vejledning.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
