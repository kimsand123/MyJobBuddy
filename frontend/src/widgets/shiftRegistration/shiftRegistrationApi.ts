import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  shiftEstimateSchema,
  shiftSchema,
  type ShiftData,
  type ShiftEstimateData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";
import type { ShiftRequestBody } from "./shiftRegistrationTypes";

// Model for registrering af vagter: estimat (live opsummering) og oprettelse.
// Valideringsfejl kommer tilbage som validationFailed med fieldErrors pr. felt.

export function estimateShift(
  apiClient: ApiClient,
  body: ShiftRequestBody,
  signal: AbortSignal,
): Promise<Result<ShiftEstimateData>> {
  return requestData(
    apiClient,
    { method: "POST", path: "/shifts/estimate", body, signal },
    shiftEstimateSchema,
  );
}

export function createShift(
  apiClient: ApiClient,
  body: ShiftRequestBody,
): Promise<Result<ShiftData>> {
  return requestData(apiClient, { method: "POST", path: "/shifts", body }, shiftSchema);
}
