import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  jobSchema,
  payCheckSchema,
  profileSchema,
  shiftMonthSchema,
  type JobData,
  type PayCheckData,
  type ProfileData,
  type ShiftMonthData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";
import { z } from "zod";

// Model for Hjem: profil, job, vagter og løntjek for den aktuelle måned.

export function fetchProfile(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ProfileData>> {
  return requestData(apiClient, { method: "GET", path: "/profile", signal }, profileSchema);
}

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

export function fetchPayCheck(
  apiClient: ApiClient,
  jobId: string,
  month: string,
  signal: AbortSignal,
): Promise<Result<PayCheckData>> {
  const path = `/jobs/${encodeURIComponent(jobId)}/pay-check?month=${encodeURIComponent(month)}`;
  return requestData(apiClient, { method: "GET", path, signal }, payCheckSchema);
}
