import { Check, CircleCheck } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PlanUsage } from "@/shared/viewTypes";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";
import { StatusBadge } from "./StatusBadge";

// Et abonnement. Det nuværende har primary-kant og badgen "Dit abonnement". Forbruget vises som
// tekst og Progress.

export type PlanCardProps = {
  name: string;
  price: string;
  features: readonly string[];
  current?: boolean;
  usage?: PlanUsage;
  ctaLabel?: string;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function PlanCard({
  name,
  price,
  features,
  current = false,
  usage,
  ctaLabel,
  onSelect,
}: PlanCardProps): ReactElement {
  const usageText =
    usage === undefined ? "" : da.subscription.remaining(usage.remaining, usage.total, usage.unit);
  return (
    <section
      aria-label={da.subscription.cardLabel(name)}
      className={cn(
        "flex flex-col gap-3 rounded-lg border-2 bg-card p-5 shadow-card",
        current ? "border-primary" : "border-transparent",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-title-2">{name}</h3>
          <span className="text-body tabular-nums">{price}</span>
        </div>
        {current && (
          <StatusBadge tone="primary" icon={CircleCheck}>
            {da.subscription.current}
          </StatusBadge>
        )}
      </div>
      {usage !== undefined && (
        <div className="flex flex-col gap-2">
          <span className="text-label tabular-nums">{usageText}</span>
          <Progress
            value={usage.remainingPercent}
            aria-label={usageText}
            className="h-2 bg-muted"
          />
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-body-sm">
            <Check
              className="mt-0.5 size-4.5 flex-none text-primary"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>
      {ctaLabel !== undefined && (
        <AppButton variant={current ? "outline" : "primary"} block onClick={onSelect}>
          {ctaLabel}
        </AppButton>
      )}
    </section>
  );
}
