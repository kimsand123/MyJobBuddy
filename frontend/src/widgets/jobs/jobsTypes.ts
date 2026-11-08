import type {
  FieldFocusRequest,
  JobFormAgreement,
  JobFormErrors,
  JobFormField,
  JobFormValues,
} from "@/shared/viewTypes";
import type { WidgetError } from "@/shared/widgetError";

// Tilstand for job og overenskomster under Mig.

/** Body til POST /jobs. */
export type JobRequestBody = {
  workplace: string;
  position: string;
  agreementCode: string;
};

export type JobView = {
  id: string;
  workplace: string;
  description: string;
};

export type JobFormState = {
  open: boolean;
  /** Ny key ved hver åbning, så formularen starter forfra. */
  key: number;
  values: JobFormValues;
  agreements: readonly JobFormAgreement[];
  errors: JobFormErrors;
  formError: string | undefined;
  submitting: boolean;
  /** Fokus til første felt med fejl efter gem. */
  focusRequest: FieldFocusRequest<JobFormField> | undefined;
};

export type JobsState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | {
      status: "ready";
      jobs: readonly JobView[];
      form: JobFormState;
      statusMessage: string;
      openForm: () => void;
      setFormOpen: (open: boolean) => void;
      changeForm: (values: JobFormValues) => void;
      submitForm: () => void;
    };
