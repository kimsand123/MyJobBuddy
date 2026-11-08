import { use } from "react";
import type { Clock } from "@/shared/clock";
import { ClockContext } from "./clockContext";

/** "I dag" for appen. I demoen 2026-10-31; i tests kan den sættes med ClockProvider. */
export function useClock(): Clock {
  return use(ClockContext);
}
