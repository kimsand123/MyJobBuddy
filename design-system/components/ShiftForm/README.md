# ShiftForm

Formular til at tilføje eller rette en vagt: dato, start, slut og pause.

**Byg på shadcn/ui:** Card/Sheet + Input + Button

**Du leverer:** `values`, `errors` pr. felt, `summary`, `submitting`, `onChange`, `onSubmit`, `onCancel`.

## Regler

- Alle felter har synlige labels; fejlteksten står ved det felt, den handler om.
- Validér, når brugeren trykker "Gem vagt", og igen, når et fejlfelt ændres.
- Forventet løn opdateres live i opsummeringen.
- Åbnes fra "Tilføj vagt" som Sheet fra bunden.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
