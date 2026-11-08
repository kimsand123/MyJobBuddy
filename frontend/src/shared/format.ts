import { da } from "@/texts/da";

// Formatering af tal og datoer med Intl og locale "da-DK".
// Beløb er i øre (heltal), og tider/timer er i minutter (heltal), som API'et leverer dem.
// Ugyldigt input giver en tom streng i stedet for "NaN".

const locale = "da-DK";

const amountFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const hoursFormatter = new Intl.NumberFormat(locale, {
  maximumFractionDigits: 2,
});

const dateWithYearFormatter = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateWithoutYearFormatter = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const weekdayFormatter = new Intl.DateTimeFormat(locale, {
  weekday: "short",
  timeZone: "UTC",
});

const weekdayLongFormatter = new Intl.DateTimeFormat(locale, {
  weekday: "long",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat(locale, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const isoMonthPattern = /^(\d{4})-(\d{2})$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Fortolker "ÅÅÅÅ-MM-DD" som et UTC-tidspunkt. Ugyldige datoer (fx 2026-02-30) giver undefined. */
function parseIsoDate(isoDate: string): number | undefined {
  const match = isoDatePattern.exec(isoDate);
  if (match === null) {
    return undefined;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, monthIndex, day);
  const parsed = new Date(timestamp);
  const isSameDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === monthIndex &&
    parsed.getUTCDate() === day;
  if (!isSameDate) {
    return undefined;
  }
  return timestamp;
}

/** 283875 øre → "2.838,75 kr." */
export function formatKr(oere: number): string {
  if (!Number.isFinite(oere)) {
    return "";
  }
  return `${amountFormatter.format(oere / 100)} ${da.units.currency}`;
}

/** 3000 øre/t → "30,00 kr./t" */
export function formatRatePerHour(oerePerHour: number): string {
  if (!Number.isFinite(oerePerHour)) {
    return "";
  }
  return `${amountFormatter.format(oerePerHour / 100)} ${da.units.perHour}`;
}

/** 1530 minutter → "25,5" (højst to decimaler). */
export function formatHours(minutes: number): string {
  if (!Number.isFinite(minutes)) {
    return "";
  }
  return hoursFormatter.format(minutes / 60);
}

/** "2026-10-11" → "11. okt. 2026", eller "11. okt." uden år. */
export function formatDate(isoDate: string, withYear: boolean = true): string {
  const timestamp = parseIsoDate(isoDate);
  if (timestamp === undefined) {
    return "";
  }
  if (withYear) {
    return dateWithYearFormatter.format(timestamp);
  }
  return dateWithoutYearFormatter.format(timestamp);
}

/** "2026-10-01" → "torsdag" (fuld ugedag, fx til skærmlæsere). */
export function weekdayLong(isoDate: string): string {
  const timestamp = parseIsoDate(isoDate);
  if (timestamp === undefined) {
    return "";
  }
  return weekdayLongFormatter.format(timestamp);
}

/** "2026-10-11" → "søn." */
export function weekdayShort(isoDate: string): string {
  const timestamp = parseIsoDate(isoDate);
  if (timestamp === undefined) {
    return "";
  }
  return weekdayFormatter.format(timestamp);
}

/** "2026-10" → "oktober 2026" */
export function formatMonth(isoMonth: string): string {
  const match = isoMonthPattern.exec(isoMonth);
  if (match === null) {
    return "";
  }
  const timestamp = parseIsoDate(`${isoMonth}-01`);
  if (timestamp === undefined) {
    return "";
  }
  return monthFormatter.format(timestamp);
}

const monthNameFormatter = new Intl.DateTimeFormat(locale, {
  month: "long",
  timeZone: "UTC",
});

const wholeAmountFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "2026-10" → "oktober" */
export function formatMonthName(isoMonth: string): string {
  if (!isoMonthPattern.test(isoMonth)) {
    return "";
  }
  const timestamp = parseIsoDate(`${isoMonth}-01`);
  if (timestamp === undefined) {
    return "";
  }
  return monthNameFormatter.format(timestamp);
}

/** 2900 øre → "29 kr./md." (satser skrives uden ",00"). */
export function formatKrPerMonth(oere: number): string {
  if (!Number.isFinite(oere)) {
    return "";
  }
  return `${wholeAmountFormatter.format(oere / 100)} ${da.units.perMonth}`;
}

/** "15:30", "21:00" → "15:30–21:00" */
export function formatTimeRange(start: string, end: string): string {
  if (!timePattern.test(start) || !timePattern.test(end)) {
    return "";
  }
  return `${start}${da.units.timeRangeSeparator}${end}`;
}
