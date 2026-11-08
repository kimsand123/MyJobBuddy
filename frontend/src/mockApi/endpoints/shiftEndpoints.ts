import { fail, ok, type Result } from "@/shared/result";
import type { ShiftDto, ShiftEstimateDto, ShiftMonthDto } from "../apiTypes";
import { nextId } from "../mockStore";
import { calculateShift } from "../shiftCalculation";
import type { MockStore, ShiftRecord } from "../storeTypes";
import { validateNoOverlap, validateShiftFields } from "../validation/shiftValidation";
import {
  findJob,
  requireMonth,
  requirePathParam,
  ruleSetForJob,
  shiftsForJobAndMonth,
  toShiftDto,
} from "./endpointHelpers";
import type { MockRequestContext } from "./mockRequest";

// GET /jobs/:jobId/shifts?month=ÅÅÅÅ-MM, POST /shifts/estimate, POST /shifts,
// PUT /shifts/:shiftId/sick og DELETE /shifts/:shiftId/sick.

export function getShiftsForMonth({
  store,
  pathParams,
  query,
}: MockRequestContext): Result<ShiftMonthDto> {
  const jobId = requirePathParam(pathParams, "jobId");
  if (!jobId.success) {
    return jobId;
  }
  const job = findJob(store, jobId.data);
  if (!job.success) {
    return job;
  }
  const month = requireMonth(query);
  if (!month.success) {
    return month;
  }
  const ruleSet = ruleSetForJob(job.data);
  if (!ruleSet.success) {
    return ruleSet;
  }

  const shifts = shiftsForJobAndMonth(store, job.data.id, month.data).map((shift) =>
    toShiftDto(shift, ruleSet.data),
  );
  return ok({
    jobId: job.data.id,
    month: month.data,
    shifts,
    totalPaidMinutes: shifts.reduce((sum, shift) => sum + shift.paidMinutes, 0),
    totalExpectedPayOere: shifts.reduce((sum, shift) => sum + shift.expectedPayOere, 0),
  });
}

/** Timer og forventet løn for en vagt, der endnu ikke er gemt (live opsummering i formularen). */
export function estimateShift({ store, body }: MockRequestContext): Result<ShiftEstimateDto> {
  const input = validateShiftFields(store, body);
  if (!input.success) {
    return input;
  }
  const ruleSet = ruleSetForJob(input.data.job);
  if (!ruleSet.success) {
    return ruleSet;
  }
  return ok(calculateShift({ ...input.data, isSick: false }, ruleSet.data));
}

export function createShift({ store, body }: MockRequestContext): Result<ShiftDto> {
  const fields = validateShiftFields(store, body);
  if (!fields.success) {
    return fields;
  }
  const input = validateNoOverlap(store, fields.data);
  if (!input.success) {
    return input;
  }
  const ruleSet = ruleSetForJob(input.data.job);
  if (!ruleSet.success) {
    return ruleSet;
  }

  const shift: ShiftRecord = {
    id: nextId(store, "shift"),
    jobId: input.data.job.id,
    date: input.data.date,
    start: input.data.start,
    end: input.data.end,
    pauseMinutes: input.data.pauseMinutes,
    isSick: false,
  };
  store.shifts.push(shift);
  return ok(toShiftDto(shift, ruleSet.data));
}

function findShift(
  store: MockStore,
  pathParams: Partial<Record<string, string>>,
): Result<ShiftRecord> {
  const shiftId = requirePathParam(pathParams, "shiftId");
  if (!shiftId.success) {
    return shiftId;
  }
  const shift = store.shifts.find((candidate) => candidate.id === shiftId.data);
  if (shift === undefined) {
    return fail("notFound", "The shift was not found.");
  }
  return ok(shift);
}

function setSick(store: MockStore, shift: ShiftRecord, isSick: boolean): Result<ShiftDto> {
  const job = findJob(store, shift.jobId);
  if (!job.success) {
    return job;
  }
  const ruleSet = ruleSetForJob(job.data);
  if (!ruleSet.success) {
    return ruleSet;
  }
  shift.isSick = isSick;
  return ok(toShiftDto(shift, ruleSet.data));
}

/** Afvises med forbidden, når samtykket til sygdom er Fra. */
export function markShiftSick({ store, pathParams }: MockRequestContext): Result<ShiftDto> {
  const shift = findShift(store, pathParams);
  if (!shift.success) {
    return shift;
  }
  if (!store.consents.sickness) {
    return fail("forbidden", "Sickness consent has not been granted.");
  }
  return setSick(store, shift.data, true);
}

/** "Ikke syg alligevel". Kræver ikke samtykke, fordi det sletter en markering. */
export function unmarkShiftSick({ store, pathParams }: MockRequestContext): Result<ShiftDto> {
  const shift = findShift(store, pathParams);
  if (!shift.success) {
    return shift;
  }
  return setSick(store, shift.data, false);
}
