import { Scale } from "lucide-react";
import type { ReactElement, Ref } from "react";
import { da } from "@/texts/da";
import { StatusBadge } from "./StatusBadge";

// Hilsen på Hjem: fornavn, job og arbejdsplads samt overenskomsten som badge.

export type GreetingCardProps = {
  firstName: string;
  job: string;
  workplace: string;
  agreement: string;
  /** Hilsenen kan få fokus (tabIndex -1), fx når et kort over den lukkes. */
  headingRef?: Ref<HTMLHeadingElement>;
};

function GreetingArt(): ReactElement {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 flex-none">
      <rect className="fill-secondary" x={0} y={8} width={56} height={56} rx={16} />
      <circle className="fill-primary-bright" cx={44} cy={20} r={20} />
      <rect className="fill-navy" x={12} y={36} width={24} height={16} rx={8} />
    </svg>
  );
}

export function GreetingCard({
  firstName,
  job,
  workplace,
  agreement,
  headingRef,
}: GreetingCardProps): ReactElement {
  return (
    <section className="flex items-start gap-4 rounded-xl bg-card p-5 shadow-card">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <h2 ref={headingRef} tabIndex={-1} className="rounded-sm text-title-1">
          {da.home.greeting(firstName)}
        </h2>
        <p className="mb-2 text-body-sm text-muted-foreground">{da.home.jobLine(job, workplace)}</p>
        <StatusBadge tone="primary" icon={Scale}>
          {agreement}
        </StatusBadge>
      </div>
      <GreetingArt />
    </section>
  );
}
