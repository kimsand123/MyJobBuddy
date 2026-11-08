# ShiftListItem

En vagt i listen med dato, tid, timer, tillæg og forventet løn.

**Byg på shadcn/ui:** Card som button

**Du leverer:** `date` (ISO), `start`, `end`, `pauseMinutes`, `hours`, `expectedPay`, `supplement`, `onClick`.

## Regler

- Datoen skrives "tir. 6. okt." via `formatDate` og `weekdayShort`.
- Beløb højrestilles med `tabular-nums` og skrives "598,75 kr."
- Tillæg vises som `primary`-badge med plus ("Aften 3 t").
- Under listen står "Timer i alt" og "Forventet bruttoløn" i `text-amount`.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
