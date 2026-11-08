import { z } from "zod";
import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import { agreementSchema, jobSchema, type AgreementData, type JobData } from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";
import type { JobRequestBody } from "./jobsTypes";

// Model for job og overenskomster. Valideringsfejl kommer som validationFailed med fieldErrors.

export function fetchJobs(apiClient: ApiClient, signal: AbortSignal): Promise<Result<JobData[]>> {
  return requestData(apiClient, { method: "GET", path: "/jobs", signal }, z.array(jobSchema));
}

export function fetchAgreements(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<AgreementData[]>> {
  return requestData(
    apiClient,
    { method: "GET", path: "/agreements", signal },
    z.array(agreementSchema),
  );
}

export function createJob(apiClient: ApiClient, body: JobRequestBody): Promise<Result<JobData>> {
  return requestData(apiClient, { method: "POST", path: "/jobs", body }, jobSchema);
}
