import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import { profileSchema, type ProfileData } from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for profilen.

export function fetchProfile(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ProfileData>> {
  return requestData(apiClient, { method: "GET", path: "/profile", signal }, profileSchema);
}
