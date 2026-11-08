import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge kender ikke design systemets egne navne, så de registreres her.
//
// Tekststilene (text-display … text-amount-sm) sætter både skriftstørrelse, linjehøjde, vægt,
// sporing og skrifttype. De ligger derfor i deres egen gruppe "text-style", som fjerner tidligere
// klasser for de egenskaber. Så vinder fx text-title-2 over shadcn's font-semibold.
// Uden gruppen ville "text-title-1" blive tolket som en tekstfarve.
const textStyles = [
  "display",
  "title-1",
  "title-2",
  "title-3",
  "body",
  "body-sm",
  "label",
  "button",
  "caption",
  "amount",
  "amount-sm",
];

type AdditionalClassGroupIds = "text-style";

const twMerge = extendTailwindMerge<AdditionalClassGroupIds>({
  extend: {
    classGroups: {
      "text-style": [{ text: textStyles }],
    },
    conflictingClassGroups: {
      "text-style": ["font-size", "font-weight", "leading", "tracking", "font-family"],
    },
    theme: {
      shadow: ["card", "raised", "bar", "sheet"],
      spacing: ["tap-target", "control", "control-lg", "header", "tabbar"],
      container: ["content"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
