import type { DeviationDetail, SelectOption } from "@/shared/viewTypes";
import type { WidgetError } from "@/shared/widgetError";

// Tilstand for løntjekket.

export type PayslipView = {
  title: string;
  employerName: string;
  cprMasked: string;
  accountNumberMasked: string;
  grossPayText: string;
};

export type PayCheckSummaryView = {
  monthTitle: string;
  expectedOere: number;
  paidOere: number;
  differenceOere: number;
  issueCount: number;
  issuesTotalOere: number;
};

export type DeviationView = {
  key: string;
  title: string;
  when: string;
  amountOere: number;
  details: readonly DeviationDetail[];
  /** Spørgsmålet, AI-chatten stiller med det samme ved "Spørg AI". Undefined: åbn bare chatten. */
  askAiQuestionId: string | undefined;
};

export type PayCheckResultView =
  /** Den nye måned (eller det nye job) hentes. */
  | { kind: "loading" }
  | { kind: "noPayslip"; title: string }
  | {
      kind: "checked";
      payslip: PayslipView;
      summary: PayCheckSummaryView;
      deviations: readonly DeviationView[];
    };

export type PayCheckState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      jobOptions: readonly SelectOption[];
      selectedJobId: string;
      monthTitle: string;
      result: PayCheckResultView;
      selectJob: (jobId: string) => void;
      showPreviousMonth: () => void;
      showNextMonth: () => void;
    };
