import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  consentsSchema,
  sicknessConsentChangedSchema,
  type ConsentsData,
  type SicknessConsentChangedData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for samtykke. Fra sletter alle sygdomsmarkeringer i API'et.

export function fetchConsents(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ConsentsData>> {
  return requestData(apiClient, { method: "GET", path: "/consents", signal }, consentsSchema);
}

export function setSicknessConsent(
  apiClient: ApiClient,
  granted: boolean,
): Promise<Result<SicknessConsentChangedData>> {
  return requestData(
    apiClient,
    { method: "PUT", path: "/consents/sickness", body: { granted } },
    sicknessConsentChangedSchema,
  );
}
