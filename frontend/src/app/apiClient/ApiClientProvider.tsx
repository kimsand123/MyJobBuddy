import type { ReactElement, ReactNode } from "react";
import type { ApiClient } from "@/shared/apiClient";
import { ApiClientContext } from "./apiClientContext";

export type ApiClientProviderProps = {
  apiClient: ApiClient;
  children: ReactNode;
};

export function ApiClientProvider({ apiClient, children }: ApiClientProviderProps): ReactElement {
  return <ApiClientContext value={apiClient}>{children}</ApiClientContext>;
}
