// Hjælpere til at kalde mock-API'et i tests. Hver test laver sin egen friske store fra seed, så
// tests aldrig afhænger af hinanden.
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { MockStore } from "@/mockApi/storeTypes";
import type { ApiClient, HttpMethod } from "@/shared/apiClient";
import type { Failure, Result } from "@/shared/result";
import { expectFailure, expectSuccess } from "./resultAssertions";

export type TestApi = {
  store: MockStore;
  client: ApiClient;
  send: (method: HttpMethod, path: string, body?: unknown) => Promise<Result<unknown>>;
  /** Kalder API'et og forventer success. Data castes til den type, kontrakten lover. */
  data: <T>(method: HttpMethod, path: string, body?: unknown) => Promise<T>;
  /** Kalder API'et og forventer en fejl. */
  failure: (method: HttpMethod, path: string, body?: unknown) => Promise<Failure>;
};

export function createTestApi(store: MockStore = createSeedStore()): TestApi {
  const client = createMockApiClient({ delayMs: 0, store });
  const send = (method: HttpMethod, path: string, body?: unknown): Promise<Result<unknown>> =>
    client.request({ method, path, body });

  return {
    store,
    client,
    send,
    data: async <T>(method: HttpMethod, path: string, body?: unknown): Promise<T> =>
      expectSuccess(await send(method, path, body)) as T,
    failure: async (method: HttpMethod, path: string, body?: unknown): Promise<Failure> =>
      expectFailure(await send(method, path, body)),
  };
}

/** Fejl skal altid have et traceId. */
export function expectTraceId(failure: Failure): void {
  if (typeof failure.traceId !== "string" || failure.traceId.length === 0) {
    throw new Error(`Fejlen ${failure.errorType} mangler traceId.`);
  }
}
