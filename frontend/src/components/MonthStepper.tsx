import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { da } from "@/texts/da";

// Skift måned med to knapper. Måneden annonceres med aria-live, når den skifter.

export type MonthStepperProps = {
  monthTitle: string;
  onPrev: () => void;
  onNext: () => void;
};

const stepButtonClassName =
  "inline-flex size-tap-target flex-none items-center justify-center rounded-full text-foreground active:bg-accent";

export function MonthStepper({ monthTitle, onPrev, onNext }: MonthStepperProps): ReactElement {
  return (
    <div
      role="group"
      aria-label={da.pay.monthPicker}
      className="flex items-center justify-between gap-2 rounded-lg bg-card px-2 py-1 shadow-card"
    >
      <button
        type="button"
        className={stepButtonClassName}
        aria-label={da.calendar.previousMonth}
        onClick={onPrev}
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <p aria-live="polite" className="text-title-3 capitalize">
        {monthTitle}
      </p>
      <button
        type="button"
        className={stepButtonClassName}
        aria-label={da.calendar.nextMonth}
        onClick={onNext}
      >
        <ChevronRight className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}
