import type { SupplementKind } from "./agreements/agreementRuleSet";
import type { PlanRecord, PlanCode } from "./storeTypes";

// API-kontrakten: de data, endpoints returnerer. Model i frontenden validerer dem med Zod.
// Beløb i øre (heltal), tider og timer i minutter (heltal), datoer "ÅÅÅÅ-MM-DD", måneder "ÅÅÅÅ-MM".

export type ProfileDto = {
  firstName: string;
  age: number;
};

export type PlanDto = PlanRecord;

export type SubscriptionDto = {
  currentPlanCode: PlanCode;
  questionsRemaining: number;
  questionsTotal: number;
  plans: PlanDto[];
};

export type ConsentsDto = {
  sicknessConsent: boolean;
};

export type SicknessConsentChangedDto = {
  sicknessConsent: boolean;
  /** Antal sygdomsmarkeringer, der blev slettet (kun når samtykket trækkes tilbage). */
  removedSickMarkings: number;
};

export type AgreementDto = {
  code: string;
  name: string;
  /** true = overenskomsten har et regelsæt og kan vælges. false = "Kommer snart". */
  isAvailable: boolean;
};

export type JobDto = {
  id: string;
  workplace: string;
  position: string;
  agreementCode: string;
  agreementName: string;
};

export type SupplementLineDto = {
  kind: SupplementKind;
  minutes: number;
  rateOerePerHour: number;
  amountOere: number;
};

export type ShiftEstimateDto = {
  /** Timer, der betales (ved betalt pause = slut − start). */
  paidMinutes: number;
  hourlyWageOere: number;
  basePayOere: number;
  supplements: SupplementLineDto[];
  expectedPayOere: number;
};

export type ShiftDto = ShiftEstimateDto & {
  id: string;
  jobId: string;
  date: string;
  start: string;
  end: string;
  pauseMinutes: number;
  isSick: boolean;
};

export type ShiftMonthDto = {
  jobId: string;
  month: string;
  shifts: ShiftDto[];
  totalPaidMinutes: number;
  totalExpectedPayOere: number;
};

export type PayslipDto = {
  id: string;
  month: string;
  employerName: string;
  cprMasked: string;
  accountNumberMasked: string;
  paidMinutes: number;
  supplementMinutes: Record<SupplementKind, number>;
  grossPayOere: number;
};

export type PayCheckCategory = "hours" | SupplementKind;

export type PayCheckCategoryDto = {
  category: PayCheckCategory;
  expectedMinutes: number;
  paidMinutes: number;
  /** Forventet − på lønsedlen. Positiv = for lidt på lønsedlen. */
  differenceMinutes: number;
  rateOerePerHour: number;
  /** Datoer for vagterne i kategorien. Tom for "hours", hvor måneden vises i stedet. */
  dates: string[];
};

export type PossibleErrorDto = {
  category: PayCheckCategory;
  missingMinutes: number;
  rateOerePerHour: number;
  /** missingMinutes × sats. */
  amountOere: number;
  dates: string[];
};

export type PayCheckNoPayslipDto = {
  status: "noPayslip";
  jobId: string;
  month: string;
};

export type PayCheckCheckedDto = {
  status: "checked";
  jobId: string;
  month: string;
  payslip: PayslipDto;
  expectedPayOere: number;
  paidPayOere: number;
  /** Forventet − udbetalt. */
  differenceOere: number;
  categories: PayCheckCategoryDto[];
  possibleErrors: PossibleErrorDto[];
  possibleErrorsTotalOere: number;
};

export type PayCheckDto = PayCheckNoPayslipDto | PayCheckCheckedDto;

export type ChatQuestionDto = {
  id: string;
  text: string;
};

export type ChatAnswerDto = {
  questionId: string;
  answer: string;
  source: string;
  referToUnion: boolean;
};
