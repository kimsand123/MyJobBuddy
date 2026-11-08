// Vagtberegning efter regelsættet "HK Handel – Butik" (eksempelsatser):
// timeløn 92,50 kr., aften 30 kr./t efter 18 man–fre, lørdag 40 kr./t efter 15, søndag 45 kr./t
// hele dagen. Syg vagt uden tillæg. Pausen er betalt. Beløb i øre, afrundet til hele øre.
// Datoer i oktober 2026: 5 = mandag, 9 = fredag, 10 = lørdag, 11 = søndag.
import { describe, expect, it } from "vitest";
import type { AgreementRuleSet, SupplementKind } from "@/mockApi/agreements/agreementRuleSet";
import { hkHandelButik } from "@/mockApi/agreements/hkHandelButik";
import type { ShiftEstimateDto } from "@/mockApi/apiTypes";
import { calculateShift, type ShiftTimes } from "@/mockApi/shiftCalculation";

function shift(
  date: string,
  start: string,
  end: string,
  overrides?: Partial<ShiftTimes>,
): ShiftTimes {
  return { date, start, end, pauseMinutes: 0, isSick: false, ...overrides };
}

/** Tillægsminutter af en type. En manglende linje tæller som 0. */
function supplementMinutes(estimate: ShiftEstimateDto, kind: SupplementKind): number {
  return estimate.supplements
    .filter((line) => line.kind === kind)
    .reduce((sum, line) => sum + line.minutes, 0);
}

function supplementAmount(estimate: ShiftEstimateDto, kind: SupplementKind): number {
  return estimate.supplements
    .filter((line) => line.kind === kind)
    .reduce((sum, line) => sum + line.amountOere, 0);
}

function totalSupplementAmount(estimate: ShiftEstimateDto): number {
  return estimate.supplements.reduce((sum, line) => sum + line.amountOere, 0);
}

describe("calculateShift – seedens vagter", () => {
  it.each([
    ["tir. 6/10 16–20", "2026-10-06", "16:00", "20:00", 240, 43000],
    ["tor. 8/10 16–20", "2026-10-08", "16:00", "20:00", 240, 43000],
    ["lør. 10/10 9–15", "2026-10-10", "09:00", "15:00", 360, 55500],
    ["søn. 11/10 10–16", "2026-10-11", "10:00", "16:00", 360, 82500],
    ["ons. 14/10 15:30–21", "2026-10-14", "15:30", "21:00", 330, 59875],
  ])(
    "calculateShift_SeedShift%s_ReturnsSpecifiedPay",
    (_label, date, start, end, expectedMinutes, expectedPay) => {
      // Act
      const estimate = calculateShift(shift(date, start, end), hkHandelButik);

      // Assert
      expect(estimate.paidMinutes).toBe(expectedMinutes);
      expect(estimate.expectedPayOere).toBe(expectedPay);
    },
  );
});

describe("calculateShift – grundløn og pause", () => {
  it("calculateShift_AnyShift_ReturnsHourlyWage", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "10:00", "14:00"), hkHandelButik);

    // Assert
    expect(estimate.hourlyWageOere).toBe(9250);
  });

  it("calculateShift_DayShiftWithoutSupplements_PayIsHoursTimesWage", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "10:00", "14:00"), hkHandelButik);

    // Assert
    expect(estimate.paidMinutes).toBe(240);
    expect(estimate.basePayOere).toBe(37000);
    expect(totalSupplementAmount(estimate)).toBe(0);
    expect(estimate.expectedPayOere).toBe(37000);
  });

  it("calculateShift_PaidPause_PauseDoesNotReduceHours", () => {
    // Act
    const estimate = calculateShift(
      shift("2026-10-05", "10:00", "14:00", { pauseMinutes: 30 }),
      hkHandelButik,
    );

    // Assert
    expect(estimate.paidMinutes).toBe(240);
    expect(estimate.expectedPayOere).toBe(37000);
  });

  it("calculateShift_UnpaidPauseRuleSet_PauseIsSubtractedFromHours", () => {
    // Arrange
    const unpaidPauseRuleSet: AgreementRuleSet = { ...hkHandelButik, pauseIsPaid: false };

    // Act
    const estimate = calculateShift(
      shift("2026-10-05", "10:00", "14:00", { pauseMinutes: 30 }),
      unpaidPauseRuleSet,
    );

    // Assert
    expect(estimate.paidMinutes).toBe(210);
    expect(estimate.basePayOere).toBe(32375);
  });

  it("calculateShift_AnyShift_ExpectedPayIsBasePayPlusSupplements", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-14", "15:30", "21:00"), hkHandelButik);

    // Assert
    expect(estimate.expectedPayOere).toBe(estimate.basePayOere + totalSupplementAmount(estimate));
  });
});

describe("calculateShift – aftentillæg", () => {
  it.each([
    ["mandag", "2026-10-05"],
    ["tirsdag", "2026-10-06"],
    ["onsdag", "2026-10-07"],
    ["torsdag", "2026-10-08"],
    ["fredag", "2026-10-09"],
  ])("calculateShift_%sCrossing1800_EveningForMinutesAfter1800", (_weekday, date) => {
    // Act
    const estimate = calculateShift(shift(date, "17:00", "19:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(60);
    expect(supplementAmount(estimate, "evening")).toBe(3000);
    expect(estimate.expectedPayOere).toBe(18500 + 3000);
  });

  it("calculateShift_WeekdayEndingExactly1800_NoEveningSupplement", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "14:00", "18:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(0);
    expect(estimate.expectedPayOere).toBe(37000);
  });

  it("calculateShift_WeekdayStartingExactly1800_AllMinutesAreEvening", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "18:00", "22:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(240);
    expect(estimate.expectedPayOere).toBe(37000 + 12000);
  });

  it("calculateShift_WeekdayEndingOneMinuteAfter1800_OneEveningMinute", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "17:00", "18:01"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(1);
    expect(supplementAmount(estimate, "evening")).toBe(50);
  });

  it("calculateShift_WeekdayUntil2359_EveningUntilEndOfShift", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-05", "18:00", "23:59"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(359);
    expect(supplementAmount(estimate, "evening")).toBe(17950);
  });

  it("calculateShift_EveningLine_HasEveningRate", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-06", "16:00", "20:00"), hkHandelButik);

    // Assert
    const eveningLine = estimate.supplements.find((line) => line.kind === "evening");
    expect(eveningLine?.rateOerePerHour).toBe(3000);
    expect(eveningLine?.minutes).toBe(120);
    expect(eveningLine?.amountOere).toBe(6000);
  });
});

describe("calculateShift – lørdagstillæg", () => {
  it("calculateShift_SaturdayCrossing1500_SaturdayForMinutesAfter1500", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-10", "14:00", "20:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "saturday")).toBe(300);
    expect(supplementAmount(estimate, "saturday")).toBe(20000);
    expect(estimate.expectedPayOere).toBe(55500 + 20000);
  });

  it("calculateShift_SaturdayEvening_NoEveningSupplement", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-10", "18:00", "20:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(0);
    expect(supplementMinutes(estimate, "saturday")).toBe(120);
    expect(estimate.expectedPayOere).toBe(18500 + 8000);
  });

  it("calculateShift_SaturdayEndingExactly1500_NoSaturdaySupplement", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-10", "09:00", "15:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "saturday")).toBe(0);
    expect(estimate.expectedPayOere).toBe(55500);
  });

  it("calculateShift_SaturdayMorning_NoSupplements", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-10", "08:00", "12:00"), hkHandelButik);

    // Assert
    expect(totalSupplementAmount(estimate)).toBe(0);
  });
});

describe("calculateShift – søndagstillæg", () => {
  it("calculateShift_SundayDaytime_SundayForAllMinutes", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-11", "10:00", "16:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "sunday")).toBe(360);
    expect(supplementAmount(estimate, "sunday")).toBe(27000);
  });

  it("calculateShift_SundayFromMidnight_SundayFromFirstMinute", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-11", "00:00", "06:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "sunday")).toBe(360);
  });

  it("calculateShift_SundayEvening_SundayOnlyNoEvening", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-11", "18:00", "22:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "evening")).toBe(0);
    expect(supplementMinutes(estimate, "sunday")).toBe(240);
    expect(estimate.expectedPayOere).toBe(37000 + 18000);
  });

  it("calculateShift_MondayAfterSunday_NoSundaySupplement", () => {
    // Act
    const estimate = calculateShift(shift("2026-10-12", "10:00", "16:00"), hkHandelButik);

    // Assert
    expect(supplementMinutes(estimate, "sunday")).toBe(0);
    expect(estimate.expectedPayOere).toBe(55500);
  });
});

describe("calculateShift – syg vagt", () => {
  it("calculateShift_SickWeekdayEvening_HourlyWageWithoutSupplements", () => {
    // Act
    const estimate = calculateShift(
      shift("2026-10-06", "16:00", "20:00", { isSick: true }),
      hkHandelButik,
    );

    // Assert
    expect(estimate.paidMinutes).toBe(240);
    expect(totalSupplementAmount(estimate)).toBe(0);
    expect(estimate.expectedPayOere).toBe(37000);
  });

  it("calculateShift_SickSunday_HourlyWageWithoutSundaySupplement", () => {
    // Act
    const estimate = calculateShift(
      shift("2026-10-11", "10:00", "16:00", { isSick: true }),
      hkHandelButik,
    );

    // Assert
    expect(supplementMinutes(estimate, "sunday")).toBe(0);
    expect(estimate.expectedPayOere).toBe(55500);
  });

  it("calculateShift_SickRuleSetWithSupplements_KeepsSupplements", () => {
    // Arrange
    const ruleSet: AgreementRuleSet = { ...hkHandelButik, sickShiftIncludesSupplements: true };

    // Act
    const estimate = calculateShift(
      shift("2026-10-11", "10:00", "16:00", { isSick: true }),
      ruleSet,
    );

    // Assert
    expect(supplementMinutes(estimate, "sunday")).toBe(360);
    expect(estimate.expectedPayOere).toBe(82500);
  });
});

describe("calculateShift – afrunding til hele øre", () => {
  it("calculateShift_FiveMinutes_BasePayRoundedToNearestOere", () => {
    // Arrange: 5 × 9250 / 60 = 770,83 øre
    const times = shift("2026-10-05", "10:00", "10:05");

    // Act
    const estimate = calculateShift(times, hkHandelButik);

    // Assert
    expect(estimate.basePayOere).toBe(771);
    expect(estimate.expectedPayOere).toBe(771);
  });

  it("calculateShift_OneSaturdayMinute_SupplementRoundedToNearestOere", () => {
    // Arrange: 1 × 4000 / 60 = 66,67 øre i tillæg, 1 × 9250 / 60 = 154,17 øre i grundløn
    const times = shift("2026-10-10", "15:00", "15:01");

    // Act
    const estimate = calculateShift(times, hkHandelButik);

    // Assert
    expect(supplementAmount(estimate, "saturday")).toBe(67);
    expect(estimate.basePayOere).toBe(154);
    expect(estimate.expectedPayOere).toBe(221);
  });

  it.each([
    ["2026-10-05", "09:07", "17:13"],
    ["2026-10-09", "16:01", "23:58"],
    ["2026-10-10", "11:11", "19:29"],
    ["2026-10-11", "07:03", "13:17"],
  ])("calculateShift_Odd%s_%s_%s_AllAmountsAreWholeOere", (date, start, end) => {
    // Act
    const estimate = calculateShift(shift(date, start, end), hkHandelButik);

    // Assert
    expect(Number.isInteger(estimate.basePayOere)).toBe(true);
    expect(Number.isInteger(estimate.expectedPayOere)).toBe(true);
    for (const line of estimate.supplements) {
      expect(Number.isInteger(line.amountOere)).toBe(true);
    }
  });
});
