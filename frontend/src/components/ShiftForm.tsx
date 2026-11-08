import { useEffect, useRef, type FormEvent, type ReactElement } from "react";
import type {
  FieldFocusRequest,
  SelectOption,
  ShiftFormErrors,
  ShiftFormField,
  ShiftFormSummary,
  ShiftFormValues,
} from "@/shared/viewTypes";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

// Formular til en vagt: job (når der er flere), dato, start, slut og pause samt live opsummering.
// Fejltekster står ved felterne. focusRequest flytter fokus til et felt (fx første fejl efter gem),
// så skærmlæseren læser label og fejltekst op.

export type ShiftFormProps = {
  values: ShiftFormValues;
  jobOptions: readonly SelectOption[];
  errors?: ShiftFormErrors;
  summary: ShiftFormSummary;
  /** Fejl, der ikke hører til et bestemt felt. */
  formError?: string;
  submitting?: boolean;
  focusRequest?: FieldFocusRequest<ShiftFormField>;
  onChange: (values: ShiftFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ShiftForm({
  values,
  jobOptions,
  errors = {},
  summary,
  formError,
  submitting = false,
  focusRequest,
  onChange,
  onSubmit,
  onCancel,
}: ShiftFormProps): ReactElement {
  const jobRef = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusRequest === undefined) {
      return;
    }
    const elements: Record<ShiftFormField, HTMLElement | null> = {
      jobId: jobRef.current ?? dateRef.current,
      date: dateRef.current,
      start: startRef.current,
      end: endRef.current,
      pause: pauseRef.current,
    };
    elements[focusRequest.field]?.focus();
  }, [focusRequest]);

  const setField =
    (field: ShiftFormField) =>
    (value: string): void => {
      onChange({ ...values, [field]: value });
    };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {jobOptions.length > 1 && (
        <SelectField
          label={da.shiftForm.job}
          value={values.jobId}
          options={jobOptions}
          error={errors.jobId}
          disabled={submitting}
          triggerRef={jobRef}
          onChange={setField("jobId")}
        />
      )}
      <TextField
        label={da.shiftForm.date}
        type="date"
        value={values.date}
        error={errors.date}
        disabled={submitting}
        inputRef={dateRef}
        onChange={setField("date")}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(8rem,100%),1fr))] gap-4">
        <TextField
          label={da.shiftForm.start}
          type="time"
          value={values.start}
          error={errors.start}
          disabled={submitting}
          inputRef={startRef}
          onChange={setField("start")}
        />
        <TextField
          label={da.shiftForm.end}
          type="time"
          value={values.end}
          error={errors.end}
          disabled={submitting}
          inputRef={endRef}
          onChange={setField("end")}
        />
      </div>
      <TextField
        label={da.shiftForm.pause}
        inputMode="numeric"
        value={values.pause}
        hint={da.shiftForm.pauseHint}
        error={errors.pause}
        disabled={submitting}
        inputRef={pauseRef}
        onChange={setField("pause")}
      />
      <div
        role="status"
        className="flex flex-wrap justify-between gap-3 rounded-md bg-secondary px-4 py-3 text-label text-secondary-foreground"
      >
        <span>{da.shiftForm.summaryLabel}</span>
        <span className="tabular-nums">{summary.text}</span>
      </div>
      {formError !== undefined && (
        <p role="alert" className="text-label text-danger">
          {formError}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <AppButton type="submit" size="lg" block loading={submitting}>
          {submitting ? da.common.saving : da.shiftForm.save}
        </AppButton>
        <AppButton variant="ghost" block disabled={submitting} onClick={onCancel}>
          {da.common.cancel}
        </AppButton>
      </div>
    </form>
  );
}
