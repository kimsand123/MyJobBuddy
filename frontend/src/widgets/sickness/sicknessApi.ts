import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  consentsSchema,
  shiftSchema,
  sicknessConsentChangedSchema,
  type ConsentsData,
  type ShiftData,
  type SicknessConsentChangedData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for sygdom: samtykke og markering af en vagt som syg.
// At markere afvises med forbidden, når samtykket er Fra.

export function fetchConsents(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ConsentsData>> {
  return requestData(apiClient, { method: "GET", path: "/consents", signal }, consentsSchema);
}

export function markShiftSick(apiClient: ApiClient, shiftId: string): Promise<Result<ShiftData>> {
  const path = `/shifts/${encodeURIComponent(shiftId)}/sick`;
  return requestData(apiClient, { method: "PUT", path }, shiftSchema);
}

export function unmarkShiftSick(apiClient: ApiClient, shiftId: string): Promise<Result<ShiftData>> {
  const path = `/shifts/${encodeURIComponent(shiftId)}/sick`;
  return requestData(apiClient, { method: "DELETE", path }, shiftSchema);
}

export function grantSicknessConsent(
  apiClient: ApiClient,
): Promise<Result<SicknessConsentChangedData>> {
  return requestData(
    apiClient,
    { method: "PUT", path: "/consents/sickness", body: { granted: true } },
    sicknessConsentChangedSchema,
  );
}
