# ConsentSheet

Ark fra bunden, der viser præcis hvad der deles med fagforeningen, før noget sendes.

**Byg på shadcn/ui:** Sheet (side="bottom")

**Du leverer:** `open`, `recipient`, `shared` ({label, value}[]), `notShared` (string[]), `sending`, `onConfirm`, `onCancel`.

## Regler

- Listen "Det her sender vi" viser de rigtige værdier, ikke kategorier.
- "Det deler vi ikke" nævner altid CPR, adresse, kontonummer og dokumenter.
- Knappen siger, hvem der modtager: "Del med HK Handel".
- Fokus fanges i arket; luk med "Annuller" eller tryk på baggrunden.

## Tilstande

Normal, fokus (2px `ring`, 2px afstand) og deaktiveret er vist i previewet.
