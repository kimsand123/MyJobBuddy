import type {
  FieldFocusRequest,
  SelectOption,
  ShiftFormErrors,
  ShiftFormField,
  ShiftFormSummary,
  ShiftFormValues,
} from "@/shared/viewTypes";

// Tilstand for registrering af en vagt (arket "Tilføj vagt").

/** Body til POST /shifts og /shifts/estimate. pauseMinutes er tekst, hvis feltet ikke er et tal. */
export type ShiftRequestBody = {
  jobId: string;
  date: string;
  start: string;
  end: string;
  pauseMinutes: number | string | undefined;
};

export type ShiftRegistrationOptions = {
  jobOptions: readonly SelectOption[];
  defaultJobId: string;
  defaultDate: string;
  onSaved: (savedDate: string) => void;
};

export type ShiftRegistrationState = {
  values: ShiftFormValues;
  jobOptions: readonly SelectOption[];
  errors: ShiftFormErrors;
  formError: string | undefined;
  summary: ShiftFormSummary;
  submitting: boolean;
  /** Fokus til første felt med fejl efter gem. */
  focusRequest: FieldFocusRequest<ShiftFormField> | undefined;
  change: (values: ShiftFormValues) => void;
  submit: () => void;
};
