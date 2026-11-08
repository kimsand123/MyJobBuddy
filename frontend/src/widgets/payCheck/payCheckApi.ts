import { z } from "zod";
import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import { jobSchema, payCheckSchema, type JobData, type PayCheckData } from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for løntjekket: job og løntjek pr. job og måned.

export function fetchJobs(apiClient: ApiClient, signal: AbortSignal): Promise<Result<JobData[]>> {
  return requestData(apiClient, { method: "GET", path: "/jobs", signal }, z.array(jobSchema));
}

export function fetchPayCheck(
  apiClient: ApiClient,
  jobId: string,
  month: string,
  signal: AbortSignal,
): Promise<Result<PayCheckData>> {
  const path = `/jobs/${encodeURIComponent(jobId)}/pay-check?month=${encodeURIComponent(month)}`;
  return requestData(apiClient, { method: "GET", path, signal }, payCheckSchema);
}
