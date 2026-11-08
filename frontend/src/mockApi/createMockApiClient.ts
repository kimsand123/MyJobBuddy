import type { ApiClient, ApiRequest } from "@/shared/apiClient";
import { fail, ok, type Result } from "@/shared/result";
import { createMockStore, nextId } from "./mockStore";
import { findRoute } from "./routes";
import type { MockStore } from "./storeTypes";

// Mock af API'et. Implementerer ApiClient, så Model ikke kan se forskel på mock og rigtigt API.
// Hvert kald venter lidt (så loading-tilstande ses), respekterer AbortSignal og sender data
// gennem JSON, så klienten får kopier og aldrig kan ændre store direkte.

export const defaultMockDelayMs = 300;

export type MockApiClientOptions = {
  /** Forsinkelse pr. kald i ms. Standard 300. Tests kan bruge 0. */
  delayMs?: number;
  /** Egen store, fx i tests. Standard: en ny store dannet fra seed. */
  store?: MockStore;
};

type WaitOutcome = "completed" | "aborted";

function waitForDelay(delayMs: number, signal: AbortSignal | undefined): Promise<WaitOutcome> {
  return new Promise((resolve) => {
    if (signal?.aborted === true) {
      resolve("aborted");
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve("aborted");
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve("completed");
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Kopierer en værdi via JSON, som et rigtigt HTTP-kald ville gøre. */
function cloneAsJson(value: unknown): Result<unknown> {
  if (value === undefined) {
    return ok(undefined);
  }
  try {
    const copy: unknown = JSON.parse(JSON.stringify(value));
    return ok(copy);
  } catch {
    return fail("validationFailed", "The value could not be serialized as JSON.");
  }
}

function splitPath(path: string): { pathname: string; query: URLSearchParams } {
  const queryStart = path.indexOf("?");
  if (queryStart === -1) {
    return { pathname: path, query: new URLSearchParams() };
  }
  return {
    pathname: path.slice(0, queryStart),
    query: new URLSearchParams(path.slice(queryStart + 1)),
  };
}

function handleRequest(store: MockStore, request: ApiRequest): Result<unknown> {
  const body = cloneAsJson(request.body);
  if (!body.success) {
    return body;
  }
  const { pathname, query } = splitPath(request.path);
  const route = findRoute(request.method, pathname);
  if (route === undefined) {
    return fail("notFound", `No endpoint for ${request.method} ${pathname}.`);
  }
  const result = route.handler({ store, pathParams: route.pathParams, query, body: body.data });
  if (!result.success) {
    return result;
  }
  return cloneAsJson(result.data);
}

/** Fejl får et trace-id, som brugeren kan oplyse ved henvendelse. */
function withTraceId(store: MockStore, result: Result<unknown>): Result<unknown> {
  if (result.success || result.traceId !== undefined) {
    return result;
  }
  return { ...result, traceId: nextId(store, "mock-trace") };
}

export function createMockApiClient(options: MockApiClientOptions = {}): ApiClient {
  const store = options.store ?? createMockStore();
  const delayMs = options.delayMs ?? defaultMockDelayMs;

  return {
    request: async (request: ApiRequest): Promise<Result<unknown>> => {
      const outcome = await waitForDelay(delayMs, request.signal);
      if (outcome === "aborted") {
        return withTraceId(store, fail("aborted", "The request was aborted."));
      }
      return withTraceId(store, handleRequest(store, request));
    },
  };
}
