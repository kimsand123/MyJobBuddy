# AppHeader

Topbjælken med logo og notifikationer på Hjem eller tilbage-knap og titel på undersider.

**Byg på shadcn/ui:** —

**Du leverer:** `title` (udelad på Hjem, så vises logoet), `onBack`, `action` ({icon, label, badge}).

## Regler

- Header har `padding-top: env(safe-area-inset-top)`, så intet ligger under notch eller Dynamic Island.
- Baggrunden er `background`, som også er PWA theme_color, så statuslinjen flyder sammen med den.
- Tilbage-knappen og handlingsknappen er 44 × 44 px.
- En prik på klokken betyder "nye"; det står også i `aria-label`.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
