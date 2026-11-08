import { use } from "react";
import type { ApiClient } from "@/shared/apiClient";
import { ApiClientContext } from "./apiClientContext";

/** Den fælles ApiClient. ViewModels sender den videre til Model. */
export function useApiClient(): ApiClient {
  return use(ApiClientContext);
}
