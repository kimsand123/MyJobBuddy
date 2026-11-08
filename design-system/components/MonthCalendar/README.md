# MonthCalendar

Månedsoversigt, hvor dage med vagter er markeret.

**Byg på shadcn/ui:** Calendar (react-day-picker)

**Du leverer:** `year`, `month`, `shiftDays`, `selectedDay`, `today`, `onSelect`, `onPrev`, `onNext`.

## Regler

- Ugen starter mandag, og ugedagene er på dansk.
- En vagtdag har `secondary` baggrund, fed tekst og en streg under tallet, så den ikke kun vises med farve; `aria-label` siger "vagt".
- I dag har en mørk ring; valgt dag er `primary`.
- Hver dag er mindst 44px høj.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
