import { ChevronDown, TriangleAlert } from "lucide-react";
import { Fragment, type ReactElement, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatKr } from "@/shared/format";
import type { DeviationDetail } from "@/shared/viewTypes";
import { da } from "@/texts/da";

// En mulig fejl i løntjekket. Udfoldes (shadcn Collapsible) og viser udregningen.

export type DeviationCardProps = {
  title: string;
  /** Hvornår: datoerne for vagterne eller måneden. */
  date: string;
  amountOere: number;
  details: readonly DeviationDetail[];
  explanation?: string;
  defaultExpanded?: boolean;
  children?: ReactNode;
};

export function DeviationCard({
  title,
  date,
  amountOere,
  details,
  explanation,
  defaultExpanded = false,
  children,
}: DeviationCardProps): ReactElement {
  return (
    <Collapsible defaultOpen={defaultExpanded} asChild>
      <section className="group/deviation overflow-hidden rounded-lg bg-card shadow-card">
        <h3>
          <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg p-4 text-left text-foreground">
            <span className="inline-flex size-10 flex-none items-center justify-center rounded-md bg-warning-soft text-warning">
              <TriangleAlert className="size-5.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label text-warning">{da.pay.deviation.kicker(date)}</span>
              <span className="block text-title-3">{title}</span>
            </span>
            <span className="text-amount-sm">{formatKr(amountOere)}</span>
            <ChevronDown
              className="size-5 flex-none text-muted-foreground transition-transform group-data-[state=open]/deviation:rotate-180"
              aria-hidden="true"
            />
          </CollapsibleTrigger>
        </h3>
        <CollapsibleContent className="px-4 pb-4">
          <dl className="mb-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-md bg-background p-3 tabular-nums">
            {details.map((detail) => (
              <Fragment key={detail.label}>
                <dt className="text-muted-foreground">{detail.label}</dt>
                <dd className="text-right font-semibold">{detail.value}</dd>
              </Fragment>
            ))}
          </dl>
          {explanation !== undefined && <p className="mb-3 text-body-sm">{explanation}</p>}
          {children}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
