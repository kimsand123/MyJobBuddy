// Beregningsfunktioner (…Calculations.ts) og små fælles hjælpere: grænser og tomme lister.
import { describe, expect, it } from "vitest";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { PayCheckData, ShiftData } from "@/shared/apiSchemas";
import { askAiNavigationState, readAskQuestionId } from "@/shared/askAiNavigation";
import { fieldErrorText, mapFieldErrors } from "@/shared/fieldErrorText";
import {
  addMonths,
  dayOfDate,
  monthOfDate,
  parseIsoMonth,
  toIsoDate,
  toIsoMonth,
} from "@/shared/month";
import { fail } from "@/shared/result";
import { ApiFailureError, failureToWidgetError, toWidgetError } from "@/shared/widgetError";
import { payCheckOutcome } from "@/widgets/home/homeCalculations";
import { categoryLineFor, followUpQuestionId } from "@/widgets/payCheck/payCheckCalculations";
import {
  newShiftDate,
  shiftDaysOf,
  shiftsOnDay,
} from "@/widgets/shiftCalendar/shiftCalendarCalculations";
import {
  isReadyForEstimate,
  toShiftRequestBody,
} from "@/widgets/shiftRegistration/shiftRegistrationCalculations";
import { remainingPercent } from "@/widgets/subscription/subscriptionCalculations";
import { expectSuccess } from "../testUtils/resultAssertions";

type CheckedPayCheck = Extract<PayCheckData, { status: "checked" }>;

async function seedPayCheck(): Promise<CheckedPayCheck> {
  const client = createMockApiClient({ delayMs: 0, store: createSeedStore() });
  const data = expectSuccess(
    await client.request({ method: "GET", path: "/jobs/job-1/pay-check?month=2026-10" }),
  ) as PayCheckData;
  if (data.status !== "checked") {
    throw new Error("Seed skal have en lønseddel for oktober.");
  }
  return data;
}

function shiftOn(date: string, id = `shift-${date}`): ShiftData {
  return {
    id,
    jobId: "job-1",
    date,
    start: "10:00",
    end: "14:00",
    pauseMinutes: 0,
    isSick: false,
    paidMinutes: 240,
    hourlyWageOere: 9250,
    basePayOere: 37000,
    supplements: [],
    expectedPayOere: 37000,
  };
}

describe("followUpQuestionId", () => {
  it("followUpQuestionId_Sunday_MissingSundayQuestion", () => {
    expect(followUpQuestionId("sunday")).toBe("question-missing-sunday");
  });

  it("followUpQuestionId_Hours_MissingHoursQuestion", () => {
    expect(followUpQuestionId("hours")).toBe("question-missing-hours");
  });

  it.each(["evening", "saturday"] as const)("followUpQuestionId_%s_Undefined", (category) => {
    expect(followUpQuestionId(category)).toBeUndefined();
  });
});

describe("categoryLineFor", () => {
  it("categoryLineFor_Sunday_ReturnsSundayLine", async () => {
    // Arrange
    const payCheck = await seedPayCheck();

    // Act
    const line = categoryLineFor(payCheck, "sunday");

    // Assert
    expect(line?.expectedMinutes).toBe(360);
    expect(line?.paidMinutes).toBe(0);
  });

  it("categoryLineFor_CategoryMissing_Undefined", async () => {
    // Arrange
    const payCheck = { ...(await seedPayCheck()), categories: [] };

    // Act
    const line = categoryLineFor(payCheck, "hours");

    // Assert
    expect(line).toBeUndefined();
  });
});

describe("payCheckOutcome", () => {
  it("payCheckOutcome_SeedOctober_TwoPossibleErrors", async () => {
    // Act
    const outcome = payCheckOutcome(await seedPayCheck());

    // Assert
    expect(outcome).toEqual({ kind: "possibleErrors", count: 2 });
  });

  it("payCheckOutcome_NoPossibleErrors_Ok", async () => {
    // Arrange
    const payCheck = { ...(await seedPayCheck()), possibleErrors: [], possibleErrorsTotalOere: 0 };

    // Act
    const outcome = payCheckOutcome(payCheck);

    // Assert
    expect(outcome).toEqual({ kind: "ok" });
  });

  it("payCheckOutcome_NoPayslip_NoPayslip", () => {
    // Act
    const outcome = payCheckOutcome({ status: "noPayslip", jobId: "job-1", month: "2026-11" });

    // Assert
    expect(outcome).toEqual({ kind: "noPayslip" });
  });
});

describe("shiftDaysOf", () => {
  it("shiftDaysOf_EmptyList_Empty", () => {
    expect(shiftDaysOf([])).toEqual([]);
  });

  it("shiftDaysOf_UnsortedWithTwoShiftsSameDay_SortedUniqueDays", () => {
    // Arrange
    const shifts = [
      shiftOn("2026-10-14"),
      shiftOn("2026-10-06", "a"),
      shiftOn("2026-10-06", "b"),
      shiftOn("2026-10-31"),
      shiftOn("2026-10-01"),
    ];

    // Act
    const days = shiftDaysOf(shifts);

    // Assert
    expect(days).toEqual([1, 6, 14, 31]);
  });
});

describe("shiftsOnDay", () => {
  const shifts = [shiftOn("2026-10-06", "a"), shiftOn("2026-10-06", "b"), shiftOn("2026-10-11")];

  it("shiftsOnDay_NoDay_AllShifts", () => {
    expect(shiftsOnDay(shifts, undefined)).toHaveLength(3);
  });

  it("shiftsOnDay_DayWithTwoShifts_BothShifts", () => {
    expect(shiftsOnDay(shifts, 6).map((shift) => shift.id)).toEqual(["a", "b"]);
  });

  it("shiftsOnDay_DayWithoutShifts_Empty", () => {
    expect(shiftsOnDay(shifts, 7)).toEqual([]);
  });

  it("shiftsOnDay_EmptyList_Empty", () => {
    expect(shiftsOnDay([], 6)).toEqual([]);
  });
});

describe("newShiftDate", () => {
  it("newShiftDate_SelectedDay_UsesSelectedDay", () => {
    expect(newShiftDate(2026, 10, 11, "2026-10-31")).toBe("2026-10-11");
  });

  it("newShiftDate_NoSelectedDayTodayInMonth_UsesToday", () => {
    expect(newShiftDate(2026, 10, undefined, "2026-10-31")).toBe("2026-10-31");
  });

  it("newShiftDate_NoSelectedDayTodayInOtherMonth_UsesFirstOfMonth", () => {
    expect(newShiftDate(2026, 11, undefined, "2026-10-31")).toBe("2026-11-01");
  });

  it("newShiftDate_TodaySameMonthOtherYear_UsesFirstOfMonth", () => {
    expect(newShiftDate(2027, 10, undefined, "2026-10-31")).toBe("2027-10-01");
  });

  it("newShiftDate_SelectedDayInOtherMonth_PadsDay", () => {
    expect(newShiftDate(2026, 1, 5, "2026-10-31")).toBe("2026-01-05");
  });
});

describe("toShiftRequestBody", () => {
  it("toShiftRequestBody_NumericPause_PauseAsNumber", () => {
    // Act
    const body = toShiftRequestBody({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pause: "30",
    });

    // Assert
    expect(body).toEqual({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pauseMinutes: 30,
    });
  });

  it("toShiftRequestBody_PauseZero_PauseIsZero", () => {
    // Act
    const body = toShiftRequestBody({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pause: "0",
    });

    // Assert
    expect(body.pauseMinutes).toBe(0);
  });

  it("toShiftRequestBody_PauseNotNumber_PauseSentAsText", () => {
    // Act
    const body = toShiftRequestBody({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pause: "tre",
    });

    // Assert
    expect(body.pauseMinutes).toBe("tre");
  });

  it("toShiftRequestBody_PauseEmpty_PauseMissing", () => {
    // Act
    const body = toShiftRequestBody({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pause: "",
    });

    // Assert
    expect(body.pauseMinutes).toBeUndefined();
  });
});

describe("isReadyForEstimate", () => {
  const complete = { jobId: "job-1", date: "2026-10-19", start: "10:00", end: "14:00", pause: "0" };

  it("isReadyForEstimate_AllFields_True", () => {
    expect(isReadyForEstimate(complete)).toBe(true);
  });

  it.each(["jobId", "date", "start", "end", "pause"] as const)(
    "isReadyForEstimate_%sEmpty_False",
    (field) => {
      expect(isReadyForEstimate({ ...complete, [field]: "" })).toBe(false);
    },
  );
});

describe("remainingPercent", () => {
  it.each([
    [3, 5, 60],
    [5, 5, 100],
    [0, 5, 0],
    [0, 0, 0],
    [3, 0, 0],
  ])("remainingPercent_%sOf%s_%s", (remaining, total, expected) => {
    expect(remainingPercent(remaining, total)).toBe(expected);
  });

  it("remainingPercent_AnyInput_Between0And100", () => {
    expect(remainingPercent(7, 5)).toBeLessThanOrEqual(100);
    expect(remainingPercent(-1, 5)).toBeGreaterThanOrEqual(0);
  });
});

describe("month", () => {
  it.each([
    ["2026-10", 1, "2026-11"],
    ["2026-12", 1, "2027-01"],
    ["2026-01", -1, "2025-12"],
    ["2026-10", 0, "2026-10"],
    ["2026-10", -12, "2025-10"],
  ])("addMonths_%sPlus%s_%s", (month, delta, expected) => {
    expect(addMonths(month, delta)).toBe(expected);
  });

  it("addMonths_InvalidMonth_Unchanged", () => {
    expect(addMonths("2026-13", 1)).toBe("2026-13");
  });

  it("parseIsoMonth_Valid_YearAndMonth", () => {
    expect(parseIsoMonth("2026-10")).toEqual({ year: 2026, month: 10 });
  });

  it.each(["2026-00", "2026-13", "oktober", ""])("parseIsoMonth_Invalid'%s'_Undefined", (month) => {
    expect(parseIsoMonth(month)).toBeUndefined();
  });

  it("toIsoMonthAndDate_SingleDigits_ArePadded", () => {
    expect(toIsoMonth(2026, 1)).toBe("2026-01");
    expect(toIsoDate(2026, 1, 5)).toBe("2026-01-05");
  });

  it("monthOfDateAndDayOfDate_IsoDate_Parts", () => {
    expect(monthOfDate("2026-10-31")).toBe("2026-10");
    expect(dayOfDate("2026-10-31")).toBe(31);
  });
});

describe("askAiNavigation", () => {
  it("readAskQuestionId_StateFromAskAiNavigationState_ReturnsId", () => {
    expect(readAskQuestionId(askAiNavigationState("question-missing-sunday"))).toBe(
      "question-missing-sunday",
    );
  });

  it.each([undefined, null, "question-3", {}, { askQuestionId: 3 }, { askQuestionId: "" }])(
    "readAskQuestionId_InvalidState%s_Undefined",
    (state) => {
      expect(readAskQuestionId(state)).toBeUndefined();
    },
  );
});

describe("fieldErrorText og mapFieldErrors", () => {
  it("fieldErrorText_KnownCode_DanishText", () => {
    expect(fieldErrorText("required")?.length ?? 0).toBeGreaterThan(0);
  });

  it("fieldErrorText_Undefined_Undefined", () => {
    expect(fieldErrorText(undefined)).toBeUndefined();
  });

  it("mapFieldErrors_ApiFieldNames_MappedToFormFieldsWithText", () => {
    // Act
    const errors = mapFieldErrors(
      { pauseMinutes: "pauseOutOfRange", start: "overlapsExistingShift", unknownField: "required" },
      { pauseMinutes: "pause", start: "start" },
    );

    // Assert
    expect(errors.pause).toBe(fieldErrorText("pauseOutOfRange"));
    expect(errors.start).toBe(fieldErrorText("overlapsExistingShift"));
    expect(Object.keys(errors).sort()).toEqual(["pause", "start"]);
  });

  it("mapFieldErrors_NoFieldErrors_Empty", () => {
    expect(mapFieldErrors(undefined, { start: "start" })).toEqual({});
  });
});

describe("widgetError", () => {
  it("failureToWidgetError_Failure_TypeAndTraceId", () => {
    expect(failureToWidgetError(fail("serverError", "x", { traceId: "trace-9" }))).toEqual({
      errorType: "serverError",
      traceId: "trace-9",
    });
  });

  it("toWidgetError_ApiFailureError_UsesFailure", () => {
    // Arrange
    const error = new ApiFailureError(fail("notFound", "x", { traceId: "trace-8" }));

    // Act
    const widgetError = toWidgetError(error);

    // Assert
    expect(widgetError).toEqual({ errorType: "notFound", traceId: "trace-8" });
  });

  it("toWidgetError_UnknownError_HasErrorTypeWithoutTraceId", () => {
    // Act
    const widgetError = toWidgetError(new Error("Uventet"));

    // Assert
    expect(widgetError.errorType.length).toBeGreaterThan(0);
    expect(widgetError.traceId).toBeUndefined();
  });
});
