import { CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { formatKr } from "@/shared/format";
import { da } from "@/texts/da";
import { StatusBadge } from "./StatusBadge";

// Løntjekkets resultat: overskrift med antal mulige fejl og beløb, forventet og udbetalt.
// Med mulige fejl viser "Du mangler måske" summen af de mulige fejl (samme beløb som overskriften);
// uden fejl vises forskellen (forventet − udbetalt).
// Status vises med ikon, tekst og beløb – aldrig kun med farve.

export type PayCheckSummaryProps = {
  monthTitle: string;
  expectedOere: number;
  paidOere: number;
  differenceOere: number;
  issueCount: number;
  issuesTotalOere: number;
};

export function PayCheckSummary({
  monthTitle,
  expectedOere,
  paidOere,
  differenceOere,
  issueCount,
  issuesTotalOere,
}: PayCheckSummaryProps): ReactElement {
  const hasIssues = issueCount > 0;
  const Icon = hasIssues ? TriangleAlert : CircleCheck;
  const headline = hasIssues
    ? da.pay.summary.headlineIssues(issueCount, formatKr(issuesTotalOere))
    : da.pay.summary.headlineOk;

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex size-tap-target flex-none items-center justify-center rounded-full",
            hasIssues ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-label text-muted-foreground">{da.pay.summary.kicker(monthTitle)}</p>
          <h2 className="text-title-2">{headline}</h2>
        </div>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 tabular-nums">
        <dt className="text-muted-foreground">{da.pay.summary.expected}</dt>
        <dd className="text-right font-bold">{formatKr(expectedOere)}</dd>
        <dt className="text-muted-foreground">{da.pay.summary.paid}</dt>
        <dd className="text-right font-bold">{formatKr(paidOere)}</dd>
        <dt className="border-t border-border pt-2 text-muted-foreground">
          {hasIssues ? da.pay.summary.missing : da.pay.summary.difference}
        </dt>
        <dd
          className={cn(
            "border-t border-border pt-2 text-right text-amount",
            hasIssues ? "text-warning" : "text-success",
          )}
        >
          {formatKr(hasIssues ? issuesTotalOere : differenceOere)}
        </dd>
      </dl>
      {hasIssues && (
        <StatusBadge tone="warning" className="self-start">
          {da.status.possibleErrors(issueCount)}
        </StatusBadge>
      )}
    </section>
  );
}
