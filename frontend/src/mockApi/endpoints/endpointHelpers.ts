import { fail, ok, type Result } from "@/shared/result";
import type { AgreementRuleSet } from "../agreements/agreementRuleSet";
import { findRuleSet } from "../agreements/ruleSetRegistry";
import type { JobDto, ShiftDto } from "../apiTypes";
import { isInMonth, isValidIsoMonth } from "../dateTime";
import { calculateShift } from "../shiftCalculation";
import type { JobRecord, MockStore, ShiftRecord } from "../storeTypes";

// Fælles opslag og mapping, som flere endpoints bruger.

export function requirePathParam(
  pathParams: Partial<Record<string, string>>,
  name: string,
): Result<string> {
  const value = pathParams[name];
  if (value === undefined || value === "") {
    return fail("notFound", `Missing path parameter ${name}.`);
  }
  return ok(value);
}

/** Query-parameteren month ("ÅÅÅÅ-MM") er påkrævet. */
export function requireMonth(query: URLSearchParams): Result<string> {
  const month = query.get("month");
  if (month === null || month === "") {
    return fail("validationFailed", "The month query parameter is required.", {
      fieldErrors: { month: "required" },
    });
  }
  if (!isValidIsoMonth(month)) {
    return fail("validationFailed", "The month must have the format YYYY-MM.", {
      fieldErrors: { month: "invalidFormat" },
    });
  }
  return ok(month);
}

export function findJob(store: MockStore, jobId: string): Result<JobRecord> {
  const job = store.jobs.find((candidate) => candidate.id === jobId);
  if (job === undefined) {
    return fail("notFound", "The job was not found.");
  }
  return ok(job);
}

export function ruleSetForJob(job: JobRecord): Result<AgreementRuleSet> {
  const ruleSet = findRuleSet(job.agreementCode);
  if (ruleSet === undefined) {
    return fail("serverError", "The job's agreement has no rule set.");
  }
  return ok(ruleSet);
}

export function agreementName(store: MockStore, agreementCode: string): string {
  const agreement = store.agreementCatalog.find((candidate) => candidate.code === agreementCode);
  if (agreement === undefined) {
    return agreementCode;
  }
  return agreement.name;
}

export function toJobDto(store: MockStore, job: JobRecord): JobDto {
  return {
    id: job.id,
    workplace: job.workplace,
    position: job.position,
    agreementCode: job.agreementCode,
    agreementName: agreementName(store, job.agreementCode),
  };
}

export function toShiftDto(shift: ShiftRecord, ruleSet: AgreementRuleSet): ShiftDto {
  return {
    id: shift.id,
    jobId: shift.jobId,
    date: shift.date,
    start: shift.start,
    end: shift.end,
    pauseMinutes: shift.pauseMinutes,
    isSick: shift.isSick,
    ...calculateShift(shift, ruleSet),
  };
}

function compareShifts(left: ShiftRecord, right: ShiftRecord): number {
  if (left.date !== right.date) {
    return left.date < right.date ? -1 : 1;
  }
  if (left.start !== right.start) {
    return left.start < right.start ? -1 : 1;
  }
  return 0;
}

/** Vagterne for ét job i én måned, sorteret efter dato og start. */
export function shiftsForJobAndMonth(
  store: MockStore,
  jobId: string,
  month: string,
): ShiftRecord[] {
  return store.shifts
    .filter((shift) => shift.jobId === jobId && isInMonth(shift.date, month))
    .sort(compareShifts);
}
