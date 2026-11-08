import type { Result } from "@/shared/result";
import type { MockStore } from "../storeTypes";

// Det, et endpoint får med: store, sti-parametre, query string og body.

export type MockRequestContext = {
  store: MockStore;
  pathParams: Partial<Record<string, string>>;
  query: URLSearchParams;
  body: unknown;
};

export type MockHandler = (context: MockRequestContext) => Result<unknown>;
