# BottomTabBar

Fanebjælken i bunden med Hjem, AI og Mig; AI ligger i midten og er fremhævet.

**Byg på shadcn/ui:** Tabs (styret af routeren)

**Du leverer:** `active` og `onChange`.

## Regler

- Altid tre faner. AI-fanen er en hævet `primary`-rundel; når den er aktiv, bliver den `navy`.
- Aktiv fane har farve og understreget label, så den ikke kun vises med farve.
- Bjælken har `padding-bottom: env(safe-area-inset-bottom)`, så den ligger over hjemmeindikatoren.
- Aktiv fane har `aria-current="page"`.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
