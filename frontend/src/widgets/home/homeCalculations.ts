import type { PayCheckData } from "@/shared/apiSchemas";

// Præsentationsberegninger for Hjem.

export type PayCheckOutcome =
  { kind: "noPayslip" } | { kind: "ok" } | { kind: "possibleErrors"; count: number };

/** Hvad løntjekket viste: ingen lønseddel, i orden eller et antal mulige fejl. */
export function payCheckOutcome(payCheck: PayCheckData): PayCheckOutcome {
  if (payCheck.status === "noPayslip") {
    return { kind: "noPayslip" };
  }
  const count = payCheck.possibleErrors.length;
  if (count === 0) {
    return { kind: "ok" };
  }
  return { kind: "possibleErrors", count };
}
