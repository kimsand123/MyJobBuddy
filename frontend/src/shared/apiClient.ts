import type { Result } from "./result";

// Den fælles kontrakt for kald til API'et. Model kender kun denne type.
// I demoen er implementeringen createMockApiClient(); senere erstattes den af en fetch-baseret
// klient uden at røre View og ViewModel.

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ApiRequest = {
  method: HttpMethod;
  /** Sti inkl. evt. query string, fx "/jobs/job-1/shifts?month=2026-10". */
  path: string;
  body?: unknown;
  signal?: AbortSignal;
};

/** Svaret er rå data (unknown). Model validerer det med Zod. */
export type ApiClient = {
  request: (request: ApiRequest) => Promise<Result<unknown>>;
};
