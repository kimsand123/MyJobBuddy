import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { mapFieldErrors } from "@/shared/fieldErrorText";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import {
  jobFormFields,
  type FieldFocusRequest,
  type JobFormErrors,
  type JobFormField,
  type JobFormValues,
} from "@/shared/viewTypes";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { createJob, fetchAgreements, fetchJobs } from "./jobsApi";
import type { JobRequestBody, JobsState } from "./jobsTypes";

// ViewModel for job og overenskomster. "Tilføj job" gemmes med POST /jobs; fejl vises ved
// felterne, og fokus flyttes til første felt med fejl. Et nyt job invaliderer job-listen, så Hjem,
// Vagter og Løn kender det.

const emptyForm: JobFormValues = { workplace: "", position: "", agreementCode: "" };

const apiToFormField: Readonly<Record<string, JobFormField>> = {
  workplace: "workplace",
  position: "position",
  agreementCode: "agreementCode",
};

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

function toRequestBody(values: JobFormValues): JobRequestBody {
  return {
    workplace: values.workplace,
    position: values.position,
    agreementCode: values.agreementCode,
  };
}

export function useJobsWidget(): JobsState {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [values, setValues] = useState<JobFormValues>(emptyForm);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [focusRequest, setFocusRequest] = useState<FieldFocusRequest<JobFormField> | undefined>(
    undefined,
  );
  const [statusMessage, setStatusMessage] = useState("");

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async ({ signal }) => unwrap(await fetchJobs(apiClient, signal)),
  });
  const agreementsQuery = useQuery({
    queryKey: queryKeys.agreements,
    queryFn: async ({ signal }) => unwrap(await fetchAgreements(apiClient, signal)),
  });
  const createMutation = useMutation({
    mutationFn: (body: JobRequestBody) => createJob(apiClient, body),
  });

  const failedError = jobsQuery.error ?? agreementsQuery.error;
  if (failedError !== null) {
    return {
      status: "error",
      error: toWidgetError(failedError),
      retry: () => {
        void jobsQuery.refetch();
        void agreementsQuery.refetch();
      },
    };
  }
  const jobs = jobsQuery.data;
  const agreements = agreementsQuery.data;
  if (jobs === undefined || agreements === undefined) {
    return { status: "loading" };
  }

  const submitForm = (): void => {
    if (createMutation.isPending) {
      return;
    }
    createMutation.mutate(toRequestBody(values), {
      onSuccess: (result) => {
        if (!result.success) {
          const fieldErrors = mapFieldErrors(result.fieldErrors, apiToFormField);
          const firstErrorField = jobFormFields.find((field) => fieldErrors[field] !== undefined);
          setErrors(fieldErrors);
          setFormError(
            firstErrorField === undefined ? da.errors.byType[result.errorType] : undefined,
          );
          if (firstErrorField !== undefined) {
            setFocusRequest({ field: firstErrorField, token: (focusRequest?.token ?? 0) + 1 });
          }
          return;
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
        setFormOpen(false);
        setStatusMessage(da.jobForm.saved);
      },
    });
  };

  return {
    status: "ready",
    jobs: jobs.map((job) => ({
      id: job.id,
      workplace: job.workplace,
      description: `${job.position} · ${job.agreementName}`,
    })),
    form: {
      open: formOpen,
      key: formKey,
      values,
      agreements: agreements.map((agreement) => ({
        code: agreement.code,
        name: agreement.name,
        isAvailable: agreement.isAvailable,
      })),
      errors,
      formError,
      submitting: createMutation.isPending,
      focusRequest,
    },
    statusMessage,
    openForm: () => {
      setFormKey(formKey + 1);
      setValues(emptyForm);
      setErrors({});
      setFormError(undefined);
      setFocusRequest(undefined);
      setFormOpen(true);
    },
    setFormOpen,
    changeForm: (nextValues) => {
      // En fejl ved et felt forsvinder, når feltet ændres.
      const nextErrors: JobFormErrors = { ...errors };
      for (const field of jobFormFields) {
        if (nextValues[field] !== values[field]) {
          delete nextErrors[field];
        }
      }
      setErrors(nextErrors);
      setValues(nextValues);
      setFormError(undefined);
    },
    submitForm,
  };
}
