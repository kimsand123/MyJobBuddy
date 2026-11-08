import type { Weekday } from "./agreements/agreementRuleSet";

// Fortolkning af datoer og klokkeslæt i API'ets formater. Alt regnes i UTC, så tidszonen på
// enheden aldrig flytter en dato.

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const isoMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "ÅÅÅÅ-MM-DD" → UTC-tidsstempel. Ugyldige datoer (fx 2026-02-30) giver undefined. */
function parseIsoDate(isoDate: string): Date | undefined {
  const match = isoDatePattern.exec(isoDate);
  if (match === null) {
    return undefined;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day));
  const isSameDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === monthIndex &&
    date.getUTCDate() === day;
  if (!isSameDate) {
    return undefined;
  }
  return date;
}

export function isValidIsoDate(isoDate: string): boolean {
  return parseIsoDate(isoDate) !== undefined;
}

/** "ÅÅÅÅ-MM" med måned 01–12. */
export function isValidIsoMonth(isoMonth: string): boolean {
  return isoMonthPattern.test(isoMonth);
}

export function weekdayOf(isoDate: string): Weekday | undefined {
  const date = parseIsoDate(isoDate);
  if (date === undefined) {
    return undefined;
  }
  const weekdays: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];
  return weekdays[date.getUTCDay()];
}

/** "15:30" → 930 minutter efter midnat. Ugyldige klokkeslæt giver undefined. */
export function minuteOfDay(time: string): number | undefined {
  const match = timePattern.exec(time);
  if (match === null) {
    return undefined;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isInMonth(isoDate: string, isoMonth: string): boolean {
  return isoDate.startsWith(`${isoMonth}-`);
}
