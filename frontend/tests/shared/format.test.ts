import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatHours,
  formatKr,
  formatMonth,
  formatRatePerHour,
  formatTimeRange,
  weekdayLong,
  weekdayShort,
} from "@/shared/format";

// Intl kan bruge hårdt mellemrum mellem tal og enhed. Det ser ens ud for brugeren, så testen
// sammenligner med almindelige mellemrum.
const noBreakSpace = String.fromCharCode(0xa0);
const narrowNoBreakSpace = String.fromCharCode(0x202f);

function normalizeSpaces(text: string): string {
  return text.replaceAll(noBreakSpace, " ").replaceAll(narrowNoBreakSpace, " ");
}

describe("formatKr", () => {
  it.each([
    [283875, "2.838,75 kr."],
    [40875, "408,75 kr."],
    [13875, "138,75 kr."],
    [43000, "430,00 kr."],
    [100, "1,00 kr."],
    [5, "0,05 kr."],
    [0, "0,00 kr."],
    [100000000, "1.000.000,00 kr."],
  ])("formatKr_Oere%s_Returns%s", (oere, expected) => {
    // Act
    const text = formatKr(oere);

    // Assert
    expect(normalizeSpaces(text)).toBe(expected);
  });
});

describe("formatRatePerHour", () => {
  it.each([
    [3000, "30,00 kr./t"],
    [9250, "92,50 kr./t"],
    [4500, "45,00 kr./t"],
    [0, "0,00 kr./t"],
  ])("formatRatePerHour_OerePerHour%s_Returns%s", (oerePerHour, expected) => {
    // Act
    const text = formatRatePerHour(oerePerHour);

    // Assert
    expect(normalizeSpaces(text)).toBe(expected);
  });
});

describe("formatHours", () => {
  it.each([
    [1530, "25,5"],
    [1440, "24"],
    [420, "7"],
    [90, "1,5"],
    [0, "0"],
    [15, "0,25"],
    [20, "0,33"],
    [50, "0,83"],
    [1, "0,02"],
  ])("formatHours_Minutes%s_Returns%s", (minutes, expected) => {
    // Act
    const text = formatHours(minutes);

    // Assert
    expect(text).toBe(expected);
  });

  it("formatHours_AnyMinutes_ReturnsNoUnit", () => {
    // Act
    const text = formatHours(1530);

    // Assert
    expect(text).not.toContain("t");
  });
});

describe("formatDate", () => {
  it("formatDate_WithoutYearArgument_ReturnsDateWithYear", () => {
    // Act
    const text = formatDate("2026-10-11");

    // Assert
    expect(normalizeSpaces(text)).toBe("11. okt. 2026");
  });

  it("formatDate_WithYearTrue_ReturnsDateWithYear", () => {
    // Act
    const text = formatDate("2026-10-11", true);

    // Assert
    expect(normalizeSpaces(text)).toBe("11. okt. 2026");
  });

  it("formatDate_WithYearFalse_ReturnsDateWithoutYear", () => {
    // Act
    const text = formatDate("2026-10-11", false);

    // Assert
    expect(normalizeSpaces(text)).toBe("11. okt.");
  });

  it.each([
    ["2026-01-01", "1. jan. 2026"],
    ["2026-12-31", "31. dec. 2026"],
    ["2026-10-31", "31. okt. 2026"],
  ])("formatDate_YearBoundary%s_DoesNotShiftDay", (isoDate, expected) => {
    // Act
    const text = formatDate(isoDate);

    // Assert
    expect(normalizeSpaces(text)).toBe(expected);
  });
});

// Forkortelserne er Intl's for da-DK (CLDR), fx "tirs." og "tors.".
describe("weekdayShort", () => {
  it.each([
    ["2026-10-05", "man."],
    ["2026-10-06", "tirs."],
    ["2026-10-07", "ons."],
    ["2026-10-08", "tors."],
    ["2026-10-09", "fre."],
    ["2026-10-10", "lør."],
    ["2026-10-11", "søn."],
  ])("weekdayShort_%s_Returns%s", (isoDate, expected) => {
    // Act
    const text = weekdayShort(isoDate);

    // Assert
    expect(text).toBe(expected);
  });
});

describe("weekdayLong", () => {
  it.each([
    ["2026-10-01", "torsdag"],
    ["2026-10-05", "mandag"],
    ["2026-10-06", "tirsdag"],
    ["2026-10-07", "onsdag"],
    ["2026-10-09", "fredag"],
    ["2026-10-10", "lørdag"],
    ["2026-10-11", "søndag"],
    ["2026-01-01", "torsdag"],
    ["2026-12-31", "torsdag"],
  ])("weekdayLong_%s_Returns%s", (isoDate, expected) => {
    // Act
    const text = weekdayLong(isoDate);

    // Assert
    expect(text).toBe(expected);
  });
});

describe("formatMonth", () => {
  it.each([
    ["2026-10", "oktober 2026"],
    ["2026-01", "januar 2026"],
    ["2026-12", "december 2026"],
  ])("formatMonth_%s_Returns%s", (isoMonth, expected) => {
    // Act
    const text = formatMonth(isoMonth);

    // Assert
    expect(normalizeSpaces(text)).toBe(expected);
  });
});

describe("formatTimeRange", () => {
  it("formatTimeRange_StartAndEnd_ReturnsRangeWithEnDash", () => {
    // Act
    const text = formatTimeRange("15:30", "21:00");

    // Assert
    expect(text).toBe("15:30–21:00");
  });
});
