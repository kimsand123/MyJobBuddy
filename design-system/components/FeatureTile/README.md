# FeatureTile

Et af de fire felter på Hjem (Kontrakt, Vagter, Løn, Rettigheder).

**Byg på shadcn/ui:** Card som button

**Du leverer:** `icon`, `title`, `description`, valgfri `status` ({tone, text}), `disabled`, `onClick`.

## Regler

- Altid fire felter i et gitter med `space-3` mellemrum; de bliver én kolonne under 320px.
- `description` siger noget om brugerens egen situation ("5 vagter i oktober"), ikke en generisk tekst.
- Status vises som Badge med ikon, aldrig kun en farvet prik.
- Deaktiveret, når noget mangler, og beskrivelsen siger hvad ("Upload kontrakt først").

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet; loading, tom og fejl også, hvor komponenten har dem.
