import { createSeedStore } from "./seed";
import type { MockStore } from "./storeTypes";

// In-memory store. Den dannes fra seed ved hver opstart, så alt nulstilles ved genindlæsning.

export function createMockStore(): MockStore {
  return createSeedStore();
}

/** Nyt id, fx "shift-100". Bruger en tæller i stedet for crypto.randomUUID, som kræver https. */
export function nextId(store: MockStore, prefix: string): string {
  const id = `${prefix}-${String(store.nextSequenceNumber)}`;
  store.nextSequenceNumber += 1;
  return id;
}
