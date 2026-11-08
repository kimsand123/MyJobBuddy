import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import type { ApiClient } from "@/shared/apiClient";
import type { Clock } from "@/shared/clock";
import { ApiClientProvider } from "./apiClient/ApiClientProvider";
import { ClockProvider } from "./clock/ClockProvider";
import { NotImplementedProvider } from "./notImplemented/NotImplementedProvider";

// Alle providers samlet. Tests kan give egne instanser (fx en mock-klient uden forsinkelse).

export type AppProvidersProps = {
  queryClient: QueryClient;
  apiClient: ApiClient;
  clock: Clock;
  children: ReactNode;
};

export function AppProviders({
  queryClient,
  apiClient,
  clock,
  children,
}: AppProvidersProps): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider apiClient={apiClient}>
        <ClockProvider clock={clock}>
          <NotImplementedProvider>{children}</NotImplementedProvider>
        </ClockProvider>
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
