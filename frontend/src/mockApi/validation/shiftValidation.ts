import type { FieldErrorCode } from "@/shared/fieldErrorCode";
import { fail, ok, type Result } from "@/shared/result";
import { isValidIsoDate, minuteOfDay } from "../dateTime";
import type { JobRecord, MockStore, ShiftRecord } from "../storeTypes";
import { isRequestBody, readIntegerField, readTextField, type RequestBody } from "./requestFields";

// Validering af en vagt (estimat og oprettelse). Fejl samles pr. felt, så formularen kan vise
// fejlteksten ved feltet. Feltnavne: jobId, date, start, end, pauseMinutes.
//
// Regler:
//  - alle felter skal udfyldes,
//  - slut skal ligge efter start på samme dag (ingen vagter hen over midnat),
//  - pausen er 0–120 min. og kortere end vagten,
//  - ingen overlap med en anden vagt på samme job og dato (kun ved oprettelse).

export type ValidShiftInput = {
  job: JobRecord;
  date: string;
  start: string;
  end: string;
  pauseMinutes: number;
};

type ShiftField = "jobId" | "date" | "start" | "end" | "pauseMinutes";
type ShiftFieldErrors = Partial<Record<ShiftField, FieldErrorCode>>;

const maxPauseMinutes = 120;

function validateJob(
  store: MockStore,
  body: RequestBody,
  errors: ShiftFieldErrors,
): JobRecord | undefined {
  const jobId = readTextField(body, "jobId");
  if (jobId.status === "missing") {
    errors.jobId = "required";
    return undefined;
  }
  if (jobId.status === "invalid") {
    errors.jobId = "invalidFormat";
    return undefined;
  }
  const job = store.jobs.find((candidate) => candidate.id === jobId.value);
  if (job === undefined) {
    errors.jobId = "unknownJob";
    return undefined;
  }
  return job;
}

function validateDate(body: RequestBody, errors: ShiftFieldErrors): string | undefined {
  const date = readTextField(body, "date");
  if (date.status === "missing") {
    errors.date = "required";
    return undefined;
  }
  if (date.status === "invalid" || !isValidIsoDate(date.value)) {
    errors.date = "invalidFormat";
    return undefined;
  }
  return date.value;
}

function validateTime(
  body: RequestBody,
  field: "start" | "end",
  errors: ShiftFieldErrors,
): string | undefined {
  const time = readTextField(body, field);
  if (time.status === "missing") {
    errors[field] = "required";
    return undefined;
  }
  if (time.status === "invalid" || minuteOfDay(time.value) === undefined) {
    errors[field] = "invalidFormat";
    return undefined;
  }
  return time.value;
}

function validatePause(body: RequestBody, errors: ShiftFieldErrors): number | undefined {
  const pause = readIntegerField(body, "pauseMinutes");
  if (pause.status === "missing") {
    errors.pauseMinutes = "required";
    return undefined;
  }
  if (pause.status === "invalid") {
    errors.pauseMinutes = "invalidFormat";
    return undefined;
  }
  if (pause.value < 0 || pause.value > maxPauseMinutes) {
    errors.pauseMinutes = "pauseOutOfRange";
    return undefined;
  }
  return pause.value;
}

/** Slut efter start, og pausen kortere end vagten. Kaldes kun, når felterne hver for sig er gyldige. */
function validateTimeSpan(
  start: string,
  end: string,
  pauseMinutes: number,
  errors: ShiftFieldErrors,
): void {
  const startMinute = minuteOfDay(start);
  const endMinute = minuteOfDay(end);
  if (startMinute === undefined || endMinute === undefined) {
    return;
  }
  if (endMinute <= startMinute) {
    errors.end = "endNotAfterStart";
    return;
  }
  if (pauseMinutes >= endMinute - startMinute) {
    errors.pauseMinutes = "pauseNotShorterThanShift";
  }
}

function hasErrors(errors: ShiftFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validateShiftFields(store: MockStore, body: unknown): Result<ValidShiftInput> {
  if (!isRequestBody(body)) {
    return fail("validationFailed", "The request body must be an object.");
  }

  const errors: ShiftFieldErrors = {};
  const job = validateJob(store, body, errors);
  const date = validateDate(body, errors);
  const start = validateTime(body, "start", errors);
  const end = validateTime(body, "end", errors);
  const pauseMinutes = validatePause(body, errors);
  if (start !== undefined && end !== undefined && pauseMinutes !== undefined) {
    validateTimeSpan(start, end, pauseMinutes, errors);
  }

  if (
    hasErrors(errors) ||
    job === undefined ||
    date === undefined ||
    start === undefined ||
    end === undefined ||
    pauseMinutes === undefined
  ) {
    return fail("validationFailed", "The shift is not valid.", { fieldErrors: errors });
  }
  return ok({ job, date, start, end, pauseMinutes });
}

function overlaps(input: ValidShiftInput, existing: ShiftRecord): boolean {
  const newStart = minuteOfDay(input.start);
  const newEnd = minuteOfDay(input.end);
  const existingStart = minuteOfDay(existing.start);
  const existingEnd = minuteOfDay(existing.end);
  if (
    newStart === undefined ||
    newEnd === undefined ||
    existingStart === undefined ||
    existingEnd === undefined
  ) {
    return false;
  }
  // Vagter, der kun rører hinanden (fx 16–20 og 20–22), overlapper ikke.
  return newStart < existingEnd && existingStart < newEnd;
}

/** Ingen overlap med en anden vagt på samme job og dato. Fejlen vises ved start. */
export function validateNoOverlap(
  store: MockStore,
  input: ValidShiftInput,
): Result<ValidShiftInput> {
  const sameDayShifts = store.shifts.filter(
    (shift) => shift.jobId === input.job.id && shift.date === input.date,
  );
  const hasOverlap = sameDayShifts.some((shift) => overlaps(input, shift));
  if (hasOverlap) {
    return fail("validationFailed", "The shift overlaps another shift.", {
      fieldErrors: { start: "overlapsExistingShift" },
    });
  }
  return ok(input);
}
