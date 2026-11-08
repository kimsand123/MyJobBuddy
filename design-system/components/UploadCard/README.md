# UploadCard

Upload af kontrakt eller lønseddel med status: Uploader → AI læser → Færdig.

**Byg på shadcn/ui:** Card + Progress

**Du leverer:** `title`, `description`, `status` (idle, uploading, reading, done, error), `fileName`, `progress`, `readingText`, `doneText`, `onSelect`, `onRetry`; `children` til fx MaskedField efter upload.

## Regler

- Trinnene vises altid med tal eller flueben og tekst, ikke kun farve.
- Statusteksten er `role="status"`, så skærmlæsere hører "AI læser din kontrakt…".
- Ved fejl står fejlteksten i kortet med en "Prøv igen"-knap.
- Efter upload af lønseddel vises MaskedField for CPR og kontonummer.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
