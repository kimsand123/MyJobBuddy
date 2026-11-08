import { FileX, MessageCircleQuestion, Sparkles, UserRound } from "lucide-react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AppButton } from "@/components/AppButton";
import { DeviationCard } from "@/components/DeviationCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { MaskedField } from "@/components/MaskedField";
import { MonthStepper } from "@/components/MonthStepper";
import { PayCheckSummary } from "@/components/PayCheckSummary";
import { SelectField } from "@/components/SelectField";
import { UploadCard } from "@/components/UploadCard";
import { askAiNavigationState } from "@/shared/askAiNavigation";
import { routePaths } from "@/shared/routePaths";
import { da } from "@/texts/da";
import type { PayCheckResultView } from "./payCheckTypes";
import { usePayCheckWidget } from "./usePayCheckWidget";

// View for Løn: job- og månedsvælger, lønsedlen med skjulte felter, løntjekkets resultat og de
// mulige fejl med udregning. Uden lønseddel: tom tilstand og upload (ikke bygget).
// "Spørg AI" åbner chatten med det spørgsmål, der passer til den mulige fejl.

type PayCheckResultProps = {
  result: PayCheckResultView;
};

function PayCheckResult({ result }: PayCheckResultProps): ReactElement {
  const showNotImplemented = useNotImplemented();
  const navigate = useNavigate();

  if (result.kind === "loading") {
    return <LoadingSkeleton variant="card" rows={2} label={da.pay.loadingLabel} />;
  }
  if (result.kind === "noPayslip") {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState icon={FileX} title={result.title} text={da.pay.noPayslip.text} />
        <UploadCard
          title={da.pay.upload.title}
          description={da.pay.upload.description}
          hint={da.pay.upload.hint}
          selectLabel={da.pay.upload.select}
          onSelect={showNotImplemented}
        />
      </div>
    );
  }

  const { payslip, summary, deviations } = result;
  return (
    <div className="flex flex-col gap-4">
      <PayCheckSummary
        monthTitle={summary.monthTitle}
        expectedOere={summary.expectedOere}
        paidOere={summary.paidOere}
        differenceOere={summary.differenceOere}
        issueCount={summary.issueCount}
        issuesTotalOere={summary.issuesTotalOere}
      />
      {deviations.length > 0 && (
        <ul className="flex flex-col gap-3">
          {deviations.map((deviation, index) => (
            <li key={deviation.key}>
              <DeviationCard
                title={deviation.title}
                date={deviation.when}
                amountOere={deviation.amountOere}
                details={deviation.details}
                defaultExpanded={index === 0}
              >
                <div className="flex flex-wrap gap-2">
                  <AppButton
                    variant="secondary"
                    size="sm"
                    icon={MessageCircleQuestion}
                    onClick={showNotImplemented}
                  >
                    {da.pay.deviation.askBoss}
                  </AppButton>
                  <AppButton
                    variant="ghost"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => {
                      const questionId = deviation.askAiQuestionId;
                      void navigate(routePaths.ai, {
                        state:
                          questionId === undefined ? undefined : askAiNavigationState(questionId),
                      });
                    }}
                  >
                    {da.pay.deviation.askAi}
                  </AppButton>
                </div>
              </DeviationCard>
            </li>
          ))}
        </ul>
      )}
      <section
        aria-labelledby="payslip-title"
        className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card"
      >
        <h2 id="payslip-title" className="text-title-3">
          {payslip.title}
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 tabular-nums">
          <dt className="text-muted-foreground">{da.pay.payslip.employer}</dt>
          <dd className="text-right font-semibold">{payslip.employerName}</dd>
          <dt className="text-muted-foreground">{da.pay.payslip.grossPay}</dt>
          <dd className="text-right font-semibold">{payslip.grossPayText}</dd>
        </dl>
        <MaskedField label={da.pay.payslip.cpr} maskedValue={payslip.cprMasked} />
        <MaskedField label={da.pay.payslip.account} maskedValue={payslip.accountNumberMasked} />
      </section>
    </div>
  );
}

export function PayCheckWidget(): ReactElement {
  const payCheck = usePayCheckWidget();
  const navigate = useNavigate();

  if (payCheck.status === "loading") {
    return <LoadingSkeleton variant="card" rows={2} label={da.pay.loadingLabel} />;
  }
  if (payCheck.status === "error") {
    return <ErrorState error={payCheck.error} onRetry={payCheck.retry} />;
  }
  if (payCheck.status === "empty") {
    return (
      <EmptyState
        icon={UserRound}
        title={da.pay.noJobs.title}
        text={da.pay.noJobs.text}
        actionLabel={da.pay.noJobs.action}
        onAction={() => {
          void navigate(routePaths.me);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {payCheck.jobOptions.length > 1 && (
        <SelectField
          label={da.pay.jobLabel}
          value={payCheck.selectedJobId}
          options={payCheck.jobOptions}
          onChange={payCheck.selectJob}
        />
      )}
      <MonthStepper
        monthTitle={payCheck.monthTitle}
        onPrev={payCheck.showPreviousMonth}
        onNext={payCheck.showNextMonth}
      />
      <PayCheckResult result={payCheck.result} />
    </div>
  );
}
