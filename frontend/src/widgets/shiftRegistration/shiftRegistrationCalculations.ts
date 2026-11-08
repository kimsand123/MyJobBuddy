import type { ShiftFormValues } from "@/shared/viewTypes";
import type { ShiftRequestBody } from "./shiftRegistrationTypes";

// Rene funktioner for vagtformularen.

const wholeNumberPattern = /^\d+$/;

/** Formularens tekster → body til API'et. Valideringen sker i API'et. */
export function toShiftRequestBody(values: ShiftFormValues): ShiftRequestBody {
  const pause = values.pause.trim();
  let pauseMinutes: number | string | undefined;
  if (pause !== "") {
    pauseMinutes = wholeNumberPattern.test(pause) ? Number(pause) : pause;
  }
  return {
    jobId: values.jobId,
    date: values.date,
    start: values.start,
    end: values.end,
    pauseMinutes,
  };
}

/** Estimatet hentes først, når alle felter har en værdi. */
export function isReadyForEstimate(values: ShiftFormValues): boolean {
  return [values.jobId, values.date, values.start, values.end, values.pause].every(
    (value) => value.trim() !== "",
  );
}
