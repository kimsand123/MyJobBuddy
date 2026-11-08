import type { SupplementKind } from "./agreements/agreementRuleSet";

// Det, mock-API'et gemmer i hukommelsen. Svarer til tabellerne i det rigtige API.
// Beløb i øre (heltal), tider og timer i minutter (heltal), datoer som "ÅÅÅÅ-MM-DD".

export type ProfileRecord = {
  firstName: string;
  age: number;
};

export type PlanCode = "free" | "plus" | "payPerQuestion";

export type PlanRecord = {
  code: PlanCode;
  /** null = prisen er ikke fastsat i demoen. */
  priceOere: number | null;
  billingPeriod: "month" | "question";
  /** null = ubegrænset eller ikke relevant. */
  questionsPerMonth: number | null;
  /** null = ubegrænset eller ikke relevant. */
  payChecksPerMonth: number | null;
};

export type SubscriptionRecord = {
  currentPlanCode: PlanCode;
  questionsRemaining: number;
  questionsTotal: number;
};

export type ConsentRecord = {
  sickness: boolean;
};

export type AgreementCatalogRecord = {
  code: string;
  name: string;
};

export type JobRecord = {
  id: string;
  workplace: string;
  position: string;
  agreementCode: string;
};

export type ShiftRecord = {
  id: string;
  jobId: string;
  date: string;
  /** "TT:MM" */
  start: string;
  /** "TT:MM" */
  end: string;
  pauseMinutes: number;
  isSick: boolean;
};

export type PayslipRecord = {
  id: string;
  jobId: string;
  /** "ÅÅÅÅ-MM" */
  month: string;
  employerName: string;
  /** Kun maskeret. Det rigtige CPR-nummer gemmes aldrig. */
  cprMasked: string;
  /** Kun maskeret. Det rigtige kontonummer gemmes aldrig. */
  accountNumberMasked: string;
  /** Timer til timeløn i alt (inkl. syge timer). */
  paidMinutes: number;
  /** Tillægstimer pr. tillægstype. */
  supplementMinutes: Record<SupplementKind, number>;
  grossPayOere: number;
};

export type ChatQuestionRecord = {
  id: string;
  question: string;
  answer: string;
  source: string;
  /** true = sagen er alvorlig, og appen skal henvise til en fagforening. */
  referToUnion: boolean;
  /**
   * true = vises som forslag (GET /chat/questions). false = opfølgning, der kun stilles fra
   * appen, fx "Spørg AI" ved en mulig fejl i løntjekket.
   */
  isSuggested: boolean;
};

export type MockStore = {
  profile: ProfileRecord;
  subscription: SubscriptionRecord;
  plans: PlanRecord[];
  consents: ConsentRecord;
  agreementCatalog: AgreementCatalogRecord[];
  jobs: JobRecord[];
  shifts: ShiftRecord[];
  payslips: PayslipRecord[];
  chatQuestions: ChatQuestionRecord[];
  /** Tæller til nye id'er og trace-id'er. */
  nextSequenceNumber: number;
};
