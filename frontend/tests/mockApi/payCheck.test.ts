// Løntjek pr. job og måned: forventet ud fra vagterne sammenlignes med lønsedlen i kategorierne
// hours, evening, saturday og sunday. Kun underbetaling bliver en mulig fejl (forskel × sats).
import { describe, expect, it } from "vitest";
import { hkHandelButik } from "@/mockApi/agreements/hkHandelButik";
import type {
  PayCheckCategory,
  PayCheckCategoryDto,
  PayslipDto,
  PossibleErrorDto,
  ShiftDto,
} from "@/mockApi/apiTypes";
import { calculatePayCheck, type PayCheckSummary } from "@/mockApi/payCheck";
import { calculateShift } from "@/mockApi/shiftCalculation";

function shiftDto(id: string, date: string, start: string, end: string, isSick = false): ShiftDto {
  const times = { date, start, end, pauseMinutes: 0, isSick };
  return { ...calculateShift(times, hkHandelButik), ...times, id, jobId: "job-test" };
}

/** Samme vagter som seedens oktober 2026. */
function seedShifts(sundayIsSick = false): ShiftDto[] {
  return [
    shiftDto("shift-a", "2026-10-06", "16:00", "20:00"),
    shiftDto("shift-b", "2026-10-08", "16:00", "20:00"),
    shiftDto("shift-c", "2026-10-10", "09:00", "15:00"),
    shiftDto("shift-d", "2026-10-11", "10:00", "16:00", sundayIsSick),
    shiftDto("shift-e", "2026-10-14", "15:30", "21:00"),
  ];
}

function payslip(overrides?: Partial<PayslipDto>): PayslipDto {
  return {
    id: "payslip-test",
    month: "2026-10",
    employerName: "Testbutikken ApS",
    cprMasked: "******-****",
    accountNumberMasked: "****-******",
    paidMinutes: 24 * 60,
    supplementMinutes: { evening: 7 * 60, saturday: 0, sunday: 0 },
    grossPayOere: 243000,
    ...overrides,
  };
}

function category(summary: PayCheckSummary, kind: PayCheckCategory): PayCheckCategoryDto {
  const found = summary.categories.find((entry) => entry.category === kind);
  if (found === undefined) {
    throw new Error(`Kategorien ${kind} mangler.`);
  }
  return found;
}

function possibleError(
  summary: PayCheckSummary,
  kind: PayCheckCategory,
): PossibleErrorDto | undefined {
  return summary.possibleErrors.find((entry) => entry.category === kind);
}

describe("calculatePayCheck – seed", () => {
  it("calculatePayCheck_SeedOctober_ExpectedAndPaidMatchSpec", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(summary.expectedPayOere).toBe(283875);
    expect(summary.paidPayOere).toBe(243000);
    expect(summary.differenceOere).toBe(40875);
  });

  it("calculatePayCheck_SeedOctober_TwoPossibleErrorsTotal40875", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(summary.possibleErrors).toHaveLength(2);
    expect(summary.possibleErrorsTotalOere).toBe(40875);
  });

  it("calculatePayCheck_SeedOctober_MissingHoursError", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(possibleError(summary, "hours")).toEqual({
      category: "hours",
      missingMinutes: 90,
      rateOerePerHour: 9250,
      amountOere: 13875,
      dates: [],
    });
  });

  it("calculatePayCheck_SeedOctober_MissingSundayErrorWithSundayDate", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(possibleError(summary, "sunday")).toEqual({
      category: "sunday",
      missingMinutes: 360,
      rateOerePerHour: 4500,
      amountOere: 27000,
      dates: ["2026-10-11"],
    });
  });

  it("calculatePayCheck_SeedOctober_HasAllFourCategories", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    const kinds = summary.categories.map((entry) => entry.category).sort();
    expect(kinds).toEqual(["evening", "hours", "saturday", "sunday"]);
  });

  it("calculatePayCheck_SeedOctober_HoursCategoryIncludesAllHoursAndNoDates", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(category(summary, "hours")).toEqual({
      category: "hours",
      expectedMinutes: 1530,
      paidMinutes: 1440,
      differenceMinutes: 90,
      rateOerePerHour: 9250,
      dates: [],
    });
  });

  it("calculatePayCheck_SeedOctober_EveningCategoryMatchesPayslip", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    const evening = category(summary, "evening");
    expect(evening.expectedMinutes).toBe(420);
    expect(evening.paidMinutes).toBe(420);
    expect(evening.differenceMinutes).toBe(0);
    expect(evening.rateOerePerHour).toBe(3000);
    expect(possibleError(summary, "evening")).toBeUndefined();
  });

  it("calculatePayCheck_SeedOctober_SaturdayCategoryHasNoSaturdayMinutes", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    const saturday = category(summary, "saturday");
    expect(saturday.expectedMinutes).toBe(0);
    expect(saturday.differenceMinutes).toBe(0);
    expect(saturday.rateOerePerHour).toBe(4000);
    expect(possibleError(summary, "saturday")).toBeUndefined();
  });

  it("calculatePayCheck_SeedOctober_SundayCategoryShowsSundayDates", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(), payslip(), hkHandelButik);

    // Assert
    expect(category(summary, "sunday")).toEqual({
      category: "sunday",
      expectedMinutes: 360,
      paidMinutes: 0,
      differenceMinutes: 360,
      rateOerePerHour: 4500,
      dates: ["2026-10-11"],
    });
  });
});

describe("calculatePayCheck – syg søndagsvagt", () => {
  it("calculatePayCheck_SundayShiftSick_OnePossibleErrorOf13875", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(true), payslip(), hkHandelButik);

    // Assert
    expect(summary.possibleErrors).toHaveLength(1);
    expect(possibleError(summary, "hours")?.amountOere).toBe(13875);
    expect(summary.possibleErrorsTotalOere).toBe(13875);
  });

  it("calculatePayCheck_SundayShiftSick_Expected256875", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(true), payslip(), hkHandelButik);

    // Assert
    expect(summary.expectedPayOere).toBe(256875);
    expect(summary.differenceOere).toBe(256875 - 243000);
  });

  it("calculatePayCheck_SundayShiftSick_SickHoursStillCountInHours", () => {
    // Act
    const summary = calculatePayCheck(seedShifts(true), payslip(), hkHandelButik);

    // Assert
    expect(category(summary, "hours").expectedMinutes).toBe(1530);
    expect(category(summary, "sunday").expectedMinutes).toBe(0);
  });
});

describe("calculatePayCheck – kun underbetaling", () => {
  it("calculatePayCheck_PayslipPaysMoreInAllCategories_NoPossibleErrors", () => {
    // Arrange
    const generousPayslip = payslip({
      paidMinutes: 1530 + 60,
      supplementMinutes: { evening: 420 + 60, saturday: 60, sunday: 360 + 60 },
      grossPayOere: 300000,
    });

    // Act
    const summary = calculatePayCheck(seedShifts(), generousPayslip, hkHandelButik);

    // Assert
    expect(summary.possibleErrors).toEqual([]);
    expect(summary.possibleErrorsTotalOere).toBe(0);
    expect(summary.differenceOere).toBe(283875 - 300000);
    expect(category(summary, "hours").differenceMinutes).toBe(-60);
  });

  it("calculatePayCheck_PayslipMatchesExactly_NoPossibleErrorsAndZeroDifference", () => {
    // Arrange
    const exactPayslip = payslip({
      paidMinutes: 1530,
      supplementMinutes: { evening: 420, saturday: 0, sunday: 360 },
      grossPayOere: 283875,
    });

    // Act
    const summary = calculatePayCheck(seedShifts(), exactPayslip, hkHandelButik);

    // Assert
    expect(summary.possibleErrors).toEqual([]);
    expect(summary.possibleErrorsTotalOere).toBe(0);
    expect(summary.differenceOere).toBe(0);
  });

  it("calculatePayCheck_HoursMissingButEveningOverpaid_OnlyHoursIsPossibleError", () => {
    // Arrange
    const mixedPayslip = payslip({
      paidMinutes: 1500,
      supplementMinutes: { evening: 480, saturday: 0, sunday: 360 },
    });

    // Act
    const summary = calculatePayCheck(seedShifts(), mixedPayslip, hkHandelButik);

    // Assert
    expect(summary.possibleErrors.map((entry) => entry.category)).toEqual(["hours"]);
    expect(possibleError(summary, "hours")?.missingMinutes).toBe(30);
    expect(possibleError(summary, "hours")?.amountOere).toBe(4625);
  });
});

describe("calculatePayCheck – tomme lister og grænser", () => {
  it("calculatePayCheck_NoShiftsAndEmptyPayslip_EverythingZero", () => {
    // Arrange
    const emptyPayslip = payslip({
      paidMinutes: 0,
      supplementMinutes: { evening: 0, saturday: 0, sunday: 0 },
      grossPayOere: 0,
    });

    // Act
    const summary = calculatePayCheck([], emptyPayslip, hkHandelButik);

    // Assert
    expect(summary.expectedPayOere).toBe(0);
    expect(summary.paidPayOere).toBe(0);
    expect(summary.differenceOere).toBe(0);
    expect(summary.possibleErrors).toEqual([]);
    expect(summary.possibleErrorsTotalOere).toBe(0);
    for (const entry of summary.categories) {
      expect(entry.expectedMinutes).toBe(0);
      expect(entry.dates).toEqual([]);
    }
  });

  it("calculatePayCheck_NoShiftsButPaidPayslip_NoPossibleErrorsNegativeDifference", () => {
    // Act
    const summary = calculatePayCheck([], payslip(), hkHandelButik);

    // Assert
    expect(summary.expectedPayOere).toBe(0);
    expect(summary.possibleErrors).toEqual([]);
    expect(summary.differenceOere).toBe(-243000);
  });

  it("calculatePayCheck_OneHourMinuteMissing_AmountRoundedToWholeOere", () => {
    // Arrange: 1 × 9250 / 60 = 154,17 øre
    const shifts = [shiftDto("shift-x", "2026-10-05", "10:00", "11:00")];
    const shortPayslip = payslip({
      paidMinutes: 59,
      supplementMinutes: { evening: 0, saturday: 0, sunday: 0 },
      grossPayOere: 9096,
    });

    // Act
    const summary = calculatePayCheck(shifts, shortPayslip, hkHandelButik);

    // Assert
    expect(possibleError(summary, "hours")?.missingMinutes).toBe(1);
    expect(possibleError(summary, "hours")?.amountOere).toBe(154);
    expect(summary.possibleErrorsTotalOere).toBe(154);
  });

  it("calculatePayCheck_TwoSundayShifts_SundayDatesListsBoth", () => {
    // Arrange
    const shifts = [
      shiftDto("shift-x", "2026-10-11", "10:00", "12:00"),
      shiftDto("shift-y", "2026-10-18", "10:00", "12:00"),
    ];
    const noSupplementsPayslip = payslip({
      paidMinutes: 240,
      supplementMinutes: { evening: 0, saturday: 0, sunday: 0 },
      grossPayOere: 37000,
    });

    // Act
    const summary = calculatePayCheck(shifts, noSupplementsPayslip, hkHandelButik);

    // Assert
    const sundayError = possibleError(summary, "sunday");
    expect(sundayError?.missingMinutes).toBe(240);
    expect(sundayError?.amountOere).toBe(18000);
    expect([...(sundayError?.dates ?? [])].sort()).toEqual(["2026-10-11", "2026-10-18"]);
  });
});
