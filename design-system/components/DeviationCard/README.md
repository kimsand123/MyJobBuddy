# DeviationCard

En mulig fejl på lønsedlen, som kan foldes ud.

**Byg på shadcn/ui:** Collapsible i Card

**Du leverer:** `title`, `date`, `amount`, `details` ({label, value}[]), `explanation`, `defaultExpanded`; `children` til næste skridt.

## Regler

- Lukket viser den ikon, "Mulig fejl · dato", titel og beløb.
- Åben viser udregningen, en forklaring og knapperne "Sådan spørger du din chef" og "Spørg AI".
- Hovedet er en knap med `aria-expanded`.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
