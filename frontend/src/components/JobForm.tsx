import { useEffect, useId, useRef, type FormEvent, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import type {
  FieldFocusRequest,
  JobFormAgreement,
  JobFormErrors,
  JobFormField,
  JobFormValues,
} from "@/shared/viewTypes";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";
import { FieldError } from "./FieldError";
import { StatusBadge } from "./StatusBadge";
import { TextField } from "./TextField";

// Formular til et nyt job: arbejdsplads, stilling og overenskomst fra kataloget.
// Kun overenskomster med regelsæt er radioknapper. "Kommer snart" er almindelige knapper i samme
// gruppe, så dialogen "Ikke implementeret" kun åbner ved et bevidst tryk – aldrig ved piletaster
// i radiogruppen (WCAG 3.2.2). focusRequest flytter fokus til et felt (fx første fejl efter gem).

export type JobFormProps = {
  values: JobFormValues;
  agreements: readonly JobFormAgreement[];
  errors?: JobFormErrors;
  submitting?: boolean;
  focusRequest?: FieldFocusRequest<JobFormField>;
  onChange: (values: JobFormValues) => void;
  onUnavailableAgreement: (trigger: HTMLElement) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const optionClassName =
  "flex min-h-tap-target w-full items-center gap-3 rounded-md border px-3 py-2";

export function JobForm({
  values,
  agreements,
  errors = {},
  submitting = false,
  focusRequest,
  onChange,
  onUnavailableAgreement,
  onSubmit,
  onCancel,
}: JobFormProps): ReactElement {
  const groupName = useId();
  const agreementErrorId = `${groupName}-error`;
  const agreementError = errors.agreementCode;
  const workplaceRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<HTMLInputElement>(null);
  const agreementGroupRef = useRef<HTMLFieldSetElement>(null);
  const availableAgreements = agreements.filter((agreement) => agreement.isAvailable);
  const comingSoonAgreements = agreements.filter((agreement) => !agreement.isAvailable);

  useEffect(() => {
    if (focusRequest === undefined) {
      return;
    }
    if (focusRequest.field === "workplace") {
      workplaceRef.current?.focus();
      return;
    }
    if (focusRequest.field === "position") {
      positionRef.current?.focus();
      return;
    }
    agreementGroupRef.current?.querySelector<HTMLInputElement>("input[type='radio']")?.focus();
  }, [focusRequest]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <TextField
        label={da.jobForm.workplace}
        value={values.workplace}
        error={errors.workplace}
        disabled={submitting}
        autoComplete="organization"
        inputRef={workplaceRef}
        onChange={(workplace) => {
          onChange({ ...values, workplace });
        }}
      />
      <TextField
        label={da.jobForm.position}
        value={values.position}
        error={errors.position}
        disabled={submitting}
        autoComplete="organization-title"
        inputRef={positionRef}
        onChange={(position) => {
          onChange({ ...values, position });
        }}
      />
      <fieldset ref={agreementGroupRef} className="flex flex-col gap-2">
        <legend className="mb-2 text-label">{da.jobForm.agreement}</legend>
        {availableAgreements.map((agreement) => (
          <label
            key={agreement.code}
            className={cn(
              optionClassName,
              "cursor-pointer",
              values.agreementCode === agreement.code
                ? "border-2 border-primary bg-secondary"
                : "border-input bg-card",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={agreement.code}
              checked={values.agreementCode === agreement.code}
              disabled={submitting}
              aria-describedby={agreementError === undefined ? undefined : agreementErrorId}
              onChange={() => {
                onChange({ ...values, agreementCode: agreement.code });
              }}
              className="size-5 flex-none accent-primary"
            />
            <span className="min-w-0 flex-1 text-body">{agreement.name}</span>
          </label>
        ))}
        {comingSoonAgreements.map((agreement) => (
          <button
            key={agreement.code}
            type="button"
            disabled={submitting}
            onClick={(event) => {
              onUnavailableAgreement(event.currentTarget);
            }}
            // Navnet sættes samlet, så det læses "…, Kommer snart" (navn og badge er separate
            // elementer, og browseren ville ellers lægge mellemrum eller intet imellem).
            aria-label={`${agreement.name}${da.units.listSeparator}${da.status.comingSoon}`}
            className={cn(optionClassName, "border-dashed border-input bg-muted text-left")}
          >
            <span className="min-w-0 flex-1 text-body">{agreement.name}</span>
            {/* Mellemrum i teksten (vises ikke i flex), så den synlige tekst svarer til navnet. */}{" "}
            <StatusBadge tone="neutral">{da.status.comingSoon}</StatusBadge>
          </button>
        ))}
        {agreementError !== undefined && (
          <FieldError id={agreementErrorId} message={agreementError} />
        )}
      </fieldset>
      <div className="flex flex-col gap-2">
        <AppButton type="submit" size="lg" block loading={submitting}>
          {submitting ? da.common.saving : da.jobForm.save}
        </AppButton>
        <AppButton variant="ghost" block disabled={submitting} onClick={onCancel}>
          {da.common.cancel}
        </AppButton>
      </div>
    </form>
  );
}
