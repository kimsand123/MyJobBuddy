import { Info } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { da } from "@/texts/da";

// Den faste AI-disclaimer. I boks øverst på AI-skærmen og uden boks under hvert AI-svar.

export type AiDisclaimerProps = {
  boxed?: boolean;
};

export function AiDisclaimer({ boxed = false }: AiDisclaimerProps): ReactElement {
  return (
    <p
      className={cn(
        "flex items-start gap-2",
        boxed
          ? "rounded-md bg-accent p-3 text-body-sm text-accent-foreground"
          : "text-[0.8125rem] leading-[1.125rem] text-muted-foreground",
      )}
    >
      <Info className="mt-0.5 size-4 flex-none" aria-hidden="true" />
      {da.ai.disclaimer}
    </p>
  );
}
