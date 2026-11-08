import type { ShiftData } from "@/shared/apiSchemas";
import { dayOfDate, monthOfDate, toIsoDate } from "@/shared/month";

// Præsentationsberegninger for vagtkalenderen.

/** Dagene i måneden, der har mindst én vagt, sorteret. */
export function shiftDaysOf(shifts: readonly ShiftData[]): number[] {
  const days = new Set(shifts.map((shift) => dayOfDate(shift.date)));
  return [...days].sort((left, right) => left - right);
}

/** Vagterne på én dag. Uden valgt dag gives alle vagter. */
export function shiftsOnDay<T extends { date: string }>(
  shifts: readonly T[],
  day: number | undefined,
): readonly T[] {
  if (day === undefined) {
    return shifts;
  }
  return shifts.filter((shift) => dayOfDate(shift.date) === day);
}

/**
 * Dato, som en ny vagt starter med: den valgte dag, ellers i dag, hvis i dag ligger i måneden,
 * ellers den første i måneden.
 */
export function newShiftDate(
  year: number,
  month: number,
  selectedDay: number | undefined,
  todayIso: string,
): string {
  if (selectedDay !== undefined) {
    return toIsoDate(year, month, selectedDay);
  }
  if (monthOfDate(todayIso) === monthOfDate(toIsoDate(year, month, 1))) {
    return todayIso;
  }
  return toIsoDate(year, month, 1);
}
