import { z } from "zod";
import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  jobSchema,
  shiftMonthSchema,
  type JobData,
  type ShiftMonthData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for vagtkalenderen: job og vagter pr. job og måned.

export function fetchJobs(apiClient: ApiClient, signal: AbortSignal): Promise<Result<JobData[]>> {
  return requestData(apiClient, { method: "GET", path: "/jobs", signal }, z.array(jobSchema));
}

export function fetchShiftMonth(
  apiClient: ApiClient,
  jobId: string,
  month: string,
  signal: AbortSignal,
): Promise<Result<ShiftMonthData>> {
  const path = `/jobs/${encodeURIComponent(jobId)}/shifts?month=${encodeURIComponent(month)}`;
  return requestData(apiClient, { method: "GET", path, signal }, shiftMonthSchema);
}
