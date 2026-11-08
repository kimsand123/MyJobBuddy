// Typer for data, som widgets giver til design systemets komponenter. De ligger her, så hverken
// ViewModels eller komponenter afhænger af hinandens typer (afhængigheder går kun én vej).

export type SelectOption = {
  value: string;
  label: string;
};

export type ShiftFormValues = {
  jobId: string;
  date: string;
  start: string;
  end: string;
  pause: string;
};

export type ShiftFormField = keyof ShiftFormValues;

/** Felterne i den rækkefølge, de står i formularen. */
export const shiftFormFields: readonly ShiftFormField[] = [
  "jobId",
  "date",
  "start",
  "end",
  "pause",
];

export type ShiftFormErrors = Partial<Record<ShiftFormField, string>>;

export type ShiftFormSummary = {
  status: "pending" | "loading" | "ready" | "invalid" | "failed";
  text: string;
};

export type JobFormValues = {
  workplace: string;
  position: string;
  agreementCode: string;
};

export type JobFormField = keyof JobFormValues;

/** Felterne i den rækkefølge, de står i formularen. */
export const jobFormFields: readonly JobFormField[] = ["workplace", "position", "agreementCode"];

export type JobFormErrors = Partial<Record<JobFormField, string>>;

export type JobFormAgreement = {
  code: string;
  name: string;
  isAvailable: boolean;
};

/** Beder formularen flytte fokus til et felt. token skifter ved hver ny anmodning. */
export type FieldFocusRequest<TField extends string> = {
  field: TField;
  token: number;
};

export type DeviationDetail = {
  label: string;
  value: string;
};

export type SharedItem = {
  label: string;
  value: string;
};

export type SuggestedQuestion = {
  id: string;
  text: string;
};

export type PlanUsage = {
  remaining: number;
  total: number;
  /** 0–100 */
  remainingPercent: number;
  unit: string;
};
