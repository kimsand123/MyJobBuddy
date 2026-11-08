import { describe, expect, it } from "vitest";
import {
  isInMonth,
  isValidIsoDate,
  isValidIsoMonth,
  minuteOfDay,
  weekdayOf,
} from "@/mockApi/dateTime";

describe("isValidIsoDate", () => {
  it.each(["2026-10-31", "2026-01-01", "2026-12-31", "2028-02-29"])(
    "isValidIsoDate_Valid%s_ReturnsTrue",
    (isoDate) => {
      // Act
      const valid = isValidIsoDate(isoDate);

      // Assert
      expect(valid).toBe(true);
    },
  );

  it.each([
    "2026-02-29",
    "2026-02-30",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-10-00",
    "2026-10-1",
    "31-10-2026",
    "2026/10/31",
    "",
    "abcd-ef-gh",
  ])("isValidIsoDate_Invalid'%s'_ReturnsFalse", (isoDate) => {
    // Act
    const valid = isValidIsoDate(isoDate);

    // Assert
    expect(valid).toBe(false);
  });
});

describe("isValidIsoMonth", () => {
  it.each(["2026-01", "2026-10", "2026-12"])("isValidIsoMonth_Valid%s_ReturnsTrue", (month) => {
    // Act
    const valid = isValidIsoMonth(month);

    // Assert
    expect(valid).toBe(true);
  });

  it.each(["2026-00", "2026-13", "2026-1", "2026-10-01", "10-2026", ""])(
    "isValidIsoMonth_Invalid'%s'_ReturnsFalse",
    (month) => {
      // Act
      const valid = isValidIsoMonth(month);

      // Assert
      expect(valid).toBe(false);
    },
  );
});

describe("weekdayOf", () => {
  it.each([
    ["2026-10-11", 0],
    ["2026-10-05", 1],
    ["2026-10-06", 2],
    ["2026-10-09", 5],
    ["2026-10-10", 6],
    ["2026-10-31", 6],
  ])("weekdayOf_%s_Returns%s", (isoDate, expected) => {
    // Act
    const weekday = weekdayOf(isoDate);

    // Assert
    expect(weekday).toBe(expected);
  });

  it("weekdayOf_InvalidDate_ReturnsUndefined", () => {
    // Act
    const weekday = weekdayOf("2026-02-30");

    // Assert
    expect(weekday).toBeUndefined();
  });
});

describe("minuteOfDay", () => {
  it.each([
    ["00:00", 0],
    ["15:30", 930],
    ["18:00", 1080],
    ["23:59", 1439],
  ])("minuteOfDay_%s_Returns%s", (time, expected) => {
    // Act
    const minute = minuteOfDay(time);

    // Assert
    expect(minute).toBe(expected);
  });

  it.each(["24:00", "25:00", "12:60", "ab:cd", "", "1530"])(
    "minuteOfDay_Invalid'%s'_ReturnsUndefined",
    (time) => {
      // Act
      const minute = minuteOfDay(time);

      // Assert
      expect(minute).toBeUndefined();
    },
  );
});

describe("isInMonth", () => {
  it.each([
    ["2026-10-01", "2026-10", true],
    ["2026-10-31", "2026-10", true],
    ["2026-09-30", "2026-10", false],
    ["2026-11-01", "2026-10", false],
    ["2025-10-15", "2026-10", false],
  ])("isInMonth_%s_In%s_Returns%s", (isoDate, month, expected) => {
    // Act
    const inMonth = isInMonth(isoDate, month);

    // Assert
    expect(inMonth).toBe(expected);
  });
});
