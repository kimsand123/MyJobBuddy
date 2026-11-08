import { createContext } from "react";
import type { ApiClient } from "@/shared/apiClient";
import { fail } from "@/shared/result";

// Uden ApiClientProvider svarer klienten med en fejl i stedet for at kaste.
const missingApiClient: ApiClient = {
  request: () => Promise.resolve(fail("serviceUnavailable", "No ApiClient has been provided.")),
};

export const ApiClientContext = createContext<ApiClient>(missingApiClient);
