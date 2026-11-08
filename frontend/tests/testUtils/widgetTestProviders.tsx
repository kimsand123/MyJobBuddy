// Providere til test af ViewModels og Views: QueryClient uden genforsøg, ApiClient, demoens clock,
// "Ikke implementeret" og en memory-router. Hver test laver sin egen QueryClient og store.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type InitialEntry } from "react-router";
import { ApiClientProvider } from "@/app/apiClient/ApiClientProvider";
import { ClockProvider } from "@/app/clock/ClockProvider";
import { NotImplementedProvider } from "@/app/notImplemented/NotImplementedProvider";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { MockStore } from "@/mockApi/storeTypes";
import type { ApiClient, ApiRequest } from "@/shared/apiClient";
import { createFixedClock, type Clock } from "@/shared/clock";
import type { Result } from "@/shared/result";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export type WrapperOptions = {
  apiClient: ApiClient;
  clock?: Clock;
  initialEntries?: InitialEntry[];
  queryClient?: QueryClient;
};

export function createWrapper(
  options: WrapperOptions,
): (props: { children: ReactNode }) => ReactElement {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const clock = options.clock ?? createFixedClock("2026-10-31");
  const initialEntries = options.initialEntries ?? ["/"];

  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider apiClient={options.apiClient}>
          <ClockProvider clock={clock}>
            <NotImplementedProvider>
              <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
            </NotImplementedProvider>
          </ClockProvider>
        </ApiClientProvider>
      </QueryClientProvider>
    );
  };
}

/** Mock-API'et uden forsinkelse på en frisk seed-store (eller den givne store). */
export function createSeedApiClient(store: MockStore = createSeedStore()): ApiClient {
  return createMockApiClient({ delayMs: 0, store });
}

export type Override = (
  request: ApiRequest,
) => Promise<Result<unknown>> | Result<unknown> | undefined;

/**
 * Mock-API'et, hvor enkelte kald kan erstattes. Returnerer override undefined, bruges mock-API'et.
 * Alle kald gemmes i requests.
 */
export type RecordingApiClient = ApiClient & { requests: ApiRequest[] };

export function createOverridableApiClient(
  override: Override,
  store: MockStore = createSeedStore(),
): RecordingApiClient {
  const inner = createSeedApiClient(store);
  const requests: ApiRequest[] = [];
  return {
    requests,
    request: async (request: ApiRequest): Promise<Result<unknown>> => {
      requests.push(request);
      const replaced = await override(request);
      if (replaced !== undefined) {
        return replaced;
      }
      return inner.request(request);
    },
  };
}

/** Et løfte, som testen selv afgør, hvornår det opfyldes. */
export type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };

export function createDeferred<T>(): Deferred<T> {
  let resolveValue: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolveValue = resolve;
  });
  return { promise, resolve: resolveValue };
}
