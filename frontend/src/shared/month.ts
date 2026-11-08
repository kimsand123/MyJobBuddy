// Små rene funktioner til måneder ("ÅÅÅÅ-MM") og datoer ("ÅÅÅÅ-MM-DD").

const isoMonthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type YearMonth = {
  year: number;
  /** 1–12 */
  month: number;
};

export function parseIsoMonth(isoMonth: string): YearMonth | undefined {
  const match = isoMonthPattern.exec(isoMonth);
  if (match === null) {
    return undefined;
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoMonth(year: number, month: number): string {
  return `${String(year)}-${pad(month)}`;
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${toIsoMonth(year, month)}-${pad(day)}`;
}

/** "2026-10-31" → "2026-10" */
export function monthOfDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** "2026-10-31" → 31 */
export function dayOfDate(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

/** "2026-10" + 1 → "2026-11". Ugyldig måned gives uændret tilbage. */
export function addMonths(isoMonth: string, delta: number): string {
  const parsed = parseIsoMonth(isoMonth);
  if (parsed === undefined) {
    return isoMonth;
  }
  const monthIndex = parsed.year * 12 + (parsed.month - 1) + delta;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  return toIsoMonth(year, month);
}
