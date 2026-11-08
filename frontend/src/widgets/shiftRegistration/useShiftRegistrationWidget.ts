import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { mapFieldErrors } from "@/shared/fieldErrorText";
import { formatHours, formatKr } from "@/shared/format";
import { queryKeys } from "@/shared/queryKeys";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import {
  shiftFormFields,
  type FieldFocusRequest,
  type ShiftFormErrors,
  type ShiftFormField,
  type ShiftFormSummary,
  type ShiftFormValues,
} from "@/shared/viewTypes";
import { da } from "@/texts/da";
import { createShift, estimateShift } from "./shiftRegistrationApi";
import { isReadyForEstimate, toShiftRequestBody } from "./shiftRegistrationCalculations";
import type {
  ShiftRegistrationOptions,
  ShiftRegistrationState,
  ShiftRequestBody,
} from "./shiftRegistrationTypes";

// ViewModel for "Tilføj vagt". Opsummeringen hentes live fra estimat-endpointet (debounce og
// AbortSignal). Fejl fra API'et vises ved felterne, og fokus flyttes til første felt med fejl.
// Gemt vagt invaliderer vagter og løntjek.

const estimateDelayMs = 400;

const apiToFormField: Readonly<Record<string, ShiftFormField>> = {
  jobId: "jobId",
  date: "date",
  start: "start",
  end: "end",
  pauseMinutes: "pause",
};

export function useShiftRegistrationWidget({
  jobOptions,
  defaultJobId,
  defaultDate,
  onSaved,
}: ShiftRegistrationOptions): ShiftRegistrationState {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ShiftFormValues>({
    jobId: defaultJobId,
    date: defaultDate,
    start: "",
    end: "",
    pause: "0",
  });
  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [focusRequest, setFocusRequest] = useState<FieldFocusRequest<ShiftFormField> | undefined>(
    undefined,
  );

  const debouncedValues = useDebouncedValue(values, estimateDelayMs);
  const canEstimate = isReadyForEstimate(debouncedValues);
  // Estimatet returnerer Result som data: en valideringsfejl er et forventet svar, ikke en fejl.
  const estimateQuery = useQuery({
    queryKey: queryKeys.shiftEstimate(shiftFormFields.map((field) => debouncedValues[field])),
    queryFn: ({ signal }) => estimateShift(apiClient, toShiftRequestBody(debouncedValues), signal),
    enabled: canEstimate,
  });

  const createMutation = useMutation({
    mutationFn: (body: ShiftRequestBody) => createShift(apiClient, body),
  });

  let summary: ShiftFormSummary = { status: "pending", text: da.shiftForm.summaryPending };
  if (canEstimate && estimateQuery.isFetching) {
    summary = { status: "loading", text: da.shiftForm.summaryLoading };
  }
  const estimate = estimateQuery.data;
  if (canEstimate && !estimateQuery.isFetching && estimate !== undefined) {
    if (estimate.success) {
      summary = {
        status: "ready",
        text: da.shiftForm.summaryValue(
          da.units.hoursValue(formatHours(estimate.data.paidMinutes)),
          formatKr(estimate.data.expectedPayOere),
        ),
      };
    } else if (estimate.errorType === "validationFailed") {
      summary = { status: "invalid", text: da.shiftForm.summaryInvalid };
    } else {
      summary = { status: "failed", text: da.shiftForm.summaryFailed };
    }
  }

  const change = (nextValues: ShiftFormValues): void => {
    // En fejl ved et felt forsvinder, når feltet ændres.
    const nextErrors: ShiftFormErrors = { ...errors };
    for (const field of shiftFormFields) {
      if (nextValues[field] !== values[field]) {
        delete nextErrors[field];
      }
    }
    setErrors(nextErrors);
    setFormError(undefined);
    setValues(nextValues);
  };

  const submit = (): void => {
    if (createMutation.isPending) {
      return;
    }
    createMutation.mutate(toShiftRequestBody(values), {
      onSuccess: (result) => {
        if (!result.success) {
          const fieldErrors = mapFieldErrors(result.fieldErrors, apiToFormField);
          const firstErrorField = shiftFormFields.find((field) => fieldErrors[field] !== undefined);
          setErrors(fieldErrors);
          setFormError(
            firstErrorField === undefined ? da.errors.byType[result.errorType] : undefined,
          );
          if (firstErrorField !== undefined) {
            setFocusRequest({ field: firstErrorField, token: (focusRequest?.token ?? 0) + 1 });
          }
          return;
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.allShifts });
        void queryClient.invalidateQueries({ queryKey: queryKeys.allPayChecks });
        onSaved(result.data.date);
      },
    });
  };

  return {
    values,
    jobOptions,
    errors,
    formError,
    summary,
    submitting: createMutation.isPending,
    focusRequest,
    change,
    submit,
  };
}
