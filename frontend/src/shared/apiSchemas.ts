// Skal stå først: slår Zods kodegenerering (eval) fra, før skemaerne nedenfor oprettes.
import "./zodSetup";
import { z } from "zod";

// Zod-skemaer for API'ets svar. Model validerer hvert svar, fordi TypeScript-typer ikke
// kontrolleres under kørsel. Beløb i øre og tider i minutter (heltal).

const integer = z.number().int();

export const supplementKindSchema = z.enum(["evening", "saturday", "sunday"]);
export type SupplementKind = z.infer<typeof supplementKindSchema>;

export const planCodeSchema = z.enum(["free", "plus", "payPerQuestion"]);
export type PlanCode = z.infer<typeof planCodeSchema>;

export const profileSchema = z.object({
  firstName: z.string(),
  age: integer,
});
export type ProfileData = z.infer<typeof profileSchema>;

export const planSchema = z.object({
  code: planCodeSchema,
  priceOere: integer.nullable(),
  billingPeriod: z.enum(["month", "question"]),
  questionsPerMonth: integer.nullable(),
  payChecksPerMonth: integer.nullable(),
});
export type PlanData = z.infer<typeof planSchema>;

export const subscriptionSchema = z.object({
  currentPlanCode: planCodeSchema,
  questionsRemaining: integer,
  questionsTotal: integer,
  plans: z.array(planSchema),
});
export type SubscriptionData = z.infer<typeof subscriptionSchema>;

export const consentsSchema = z.object({
  sicknessConsent: z.boolean(),
});
export type ConsentsData = z.infer<typeof consentsSchema>;

export const sicknessConsentChangedSchema = z.object({
  sicknessConsent: z.boolean(),
  removedSickMarkings: integer,
});
export type SicknessConsentChangedData = z.infer<typeof sicknessConsentChangedSchema>;

export const agreementSchema = z.object({
  code: z.string(),
  name: z.string(),
  isAvailable: z.boolean(),
});
export type AgreementData = z.infer<typeof agreementSchema>;

export const jobSchema = z.object({
  id: z.string(),
  workplace: z.string(),
  position: z.string(),
  agreementCode: z.string(),
  agreementName: z.string(),
});
export type JobData = z.infer<typeof jobSchema>;

export const supplementLineSchema = z.object({
  kind: supplementKindSchema,
  minutes: integer,
  rateOerePerHour: integer,
  amountOere: integer,
});
export type SupplementLineData = z.infer<typeof supplementLineSchema>;

export const shiftEstimateSchema = z.object({
  paidMinutes: integer,
  hourlyWageOere: integer,
  basePayOere: integer,
  supplements: z.array(supplementLineSchema),
  expectedPayOere: integer,
});
export type ShiftEstimateData = z.infer<typeof shiftEstimateSchema>;

export const shiftSchema = shiftEstimateSchema.extend({
  id: z.string(),
  jobId: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  pauseMinutes: integer,
  isSick: z.boolean(),
});
export type ShiftData = z.infer<typeof shiftSchema>;

export const shiftMonthSchema = z.object({
  jobId: z.string(),
  month: z.string(),
  shifts: z.array(shiftSchema),
  totalPaidMinutes: integer,
  totalExpectedPayOere: integer,
});
export type ShiftMonthData = z.infer<typeof shiftMonthSchema>;

const payCheckCategorySchema = z.enum(["hours", "evening", "saturday", "sunday"]);
export type PayCheckCategory = z.infer<typeof payCheckCategorySchema>;

export const payslipSchema = z.object({
  id: z.string(),
  month: z.string(),
  employerName: z.string(),
  cprMasked: z.string(),
  accountNumberMasked: z.string(),
  paidMinutes: integer,
  supplementMinutes: z.object({ evening: integer, saturday: integer, sunday: integer }),
  grossPayOere: integer,
});
export type PayslipData = z.infer<typeof payslipSchema>;

export const possibleErrorSchema = z.object({
  category: payCheckCategorySchema,
  missingMinutes: integer,
  rateOerePerHour: integer,
  amountOere: integer,
  dates: z.array(z.string()),
});
export type PossibleErrorData = z.infer<typeof possibleErrorSchema>;

const payCheckCategoryLineSchema = z.object({
  category: payCheckCategorySchema,
  expectedMinutes: integer,
  paidMinutes: integer,
  differenceMinutes: integer,
  rateOerePerHour: integer,
  dates: z.array(z.string()),
});

export const payCheckSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("noPayslip"),
    jobId: z.string(),
    month: z.string(),
  }),
  z.object({
    status: z.literal("checked"),
    jobId: z.string(),
    month: z.string(),
    payslip: payslipSchema,
    expectedPayOere: integer,
    paidPayOere: integer,
    differenceOere: integer,
    categories: z.array(payCheckCategoryLineSchema),
    possibleErrors: z.array(possibleErrorSchema),
    possibleErrorsTotalOere: integer,
  }),
]);
export type PayCheckData = z.infer<typeof payCheckSchema>;

export const chatQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type ChatQuestionData = z.infer<typeof chatQuestionSchema>;

export const chatAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  source: z.string(),
  referToUnion: z.boolean(),
});
export type ChatAnswerData = z.infer<typeof chatAnswerSchema>;
