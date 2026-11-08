import { EyeOff, Lock } from "lucide-react";
import type { ReactElement } from "react";
import { da } from "@/texts/da";
import { StatusBadge } from "./StatusBadge";

// Et felt, der kun vises maskeret (fx CPR og kontonummer) med mærket "Skjult for AI".
// Skærmlæsere hører "CPR-nummer er skjult" i stedet for prikkerne.

export type MaskedFieldProps = {
  label: string;
  maskedValue: string;
  badgeText?: string;
};

export function MaskedField({
  label,
  maskedValue,
  badgeText = da.pay.payslip.hiddenForAi,
}: MaskedFieldProps): ReactElement {
  return (
    <div className="flex min-h-control flex-wrap items-center gap-3 rounded-md bg-muted px-3 py-2">
      <Lock className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <span className="block text-body-sm text-muted-foreground">{label}</span>
        <span aria-hidden="true" className="block text-body font-bold tracking-[0.08em]">
          {maskedValue}
        </span>
        <span className="sr-only">{da.pay.payslip.hidden(label)}</span>
      </div>
      <StatusBadge tone="primary" icon={EyeOff}>
        {badgeText}
      </StatusBadge>
    </div>
  );
}
