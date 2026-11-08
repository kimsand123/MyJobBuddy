// Løntjekket gennem API'et. Det regner live ud fra vagterne, så nye vagter og sygdom ændrer det.
import { describe, expect, it } from "vitest";
import type {
  PayCheckCategory,
  PayCheckCheckedDto,
  PayCheckDto,
  ShiftMonthDto,
} from "@/mockApi/apiTypes";
import { createTestApi, expectTraceId, type TestApi } from "../../testUtils/mockApiTestClient";

async function octoberPayCheck(api: TestApi): Promise<PayCheckCheckedDto> {
  const payCheck = await api.data<PayCheckDto>("GET", "/jobs/job-1/pay-check?month=2026-10");
  if (payCheck.status !== "checked") {
    throw new Error("Forventede et løntjek med lønseddel for oktober 2026.");
  }
  return payCheck;
}

function errorAmount(payCheck: PayCheckCheckedDto, category: PayCheckCategory): number | undefined {
  return payCheck.possibleErrors.find((entry) => entry.category === category)?.amountOere;
}

async function markSundayShiftSick(api: TestApi): Promise<void> {
  await api.data("PUT", "/consents/sickness", { granted: true });
  const month = await api.data<ShiftMonthDto>("GET", "/jobs/job-1/shifts?month=2026-10");
  const sunday = month.shifts.find((shift) => shift.date === "2026-10-11");
  await api.data("PUT", `/shifts/${sunday?.id ?? ""}/sick`);
}

describe("GET /jobs/:jobId/pay-check – seed", () => {
  it("getPayCheck_SeedOctober_CheckedWithSpecifiedTotals", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.jobId).toBe("job-1");
    expect(payCheck.month).toBe("2026-10");
    expect(payCheck.expectedPayOere).toBe(283875);
    expect(payCheck.paidPayOere).toBe(243000);
    expect(payCheck.differenceOere).toBe(40875);
  });

  it("getPayCheck_SeedOctober_TwoPossibleErrors13875And27000", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.possibleErrors).toHaveLength(2);
    expect(errorAmount(payCheck, "hours")).toBe(13875);
    expect(errorAmount(payCheck, "sunday")).toBe(27000);
    expect(payCheck.possibleErrorsTotalOere).toBe(40875);
  });

  it("getPayCheck_SeedOctober_SundayErrorShowsSundayDateAndHoursErrorNoDates", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    const hours = payCheck.possibleErrors.find((entry) => entry.category === "hours");
    const sunday = payCheck.possibleErrors.find((entry) => entry.category === "sunday");
    expect(hours?.missingMinutes).toBe(90);
    expect(hours?.dates).toEqual([]);
    expect(sunday?.missingMinutes).toBe(360);
    expect(sunday?.dates).toEqual(["2026-10-11"]);
  });

  it("getPayCheck_SeedOctober_PayslipMatchesSpec", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.payslip.month).toBe("2026-10");
    expect(payCheck.payslip.paidMinutes).toBe(1440);
    expect(payCheck.payslip.supplementMinutes).toEqual({ evening: 420, saturday: 0, sunday: 0 });
    expect(payCheck.payslip.grossPayOere).toBe(243000);
  });

  it("getPayCheck_SeedOctober_CprAndAccountNumberAreMasked", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert: et maskeret felt indeholder ikke et fuldt CPR- eller kontonummer
    expect(payCheck.payslip.cprMasked).not.toMatch(/\d{6}-?\d{4}/);
    expect(payCheck.payslip.cprMasked.length).toBeGreaterThan(0);
    expect(payCheck.payslip.accountNumberMasked).not.toMatch(/\d{8,}/);
    expect(payCheck.payslip.accountNumberMasked.length).toBeGreaterThan(0);
  });

  it("getPayCheck_SeedOctober_HasAllFourCategories", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    const categories = payCheck.categories.map((entry) => entry.category).sort();
    expect(categories).toEqual(["evening", "hours", "saturday", "sunday"]);
    expect(payCheck.categories.find((entry) => entry.category === "hours")?.dates).toEqual([]);
  });
});

describe("GET /jobs/:jobId/pay-check – live", () => {
  it("getPayCheck_SundayShiftSick_OnePossibleErrorAndExpected256875", async () => {
    // Arrange
    const api = createTestApi();
    await markSundayShiftSick(api);

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.possibleErrors).toHaveLength(1);
    expect(errorAmount(payCheck, "hours")).toBe(13875);
    expect(payCheck.possibleErrorsTotalOere).toBe(13875);
    expect(payCheck.expectedPayOere).toBe(256875);
  });

  it("getPayCheck_SickMarkingRemoved_BackToSeedResult", async () => {
    // Arrange
    const api = createTestApi();
    await markSundayShiftSick(api);
    await api.data("PUT", "/consents/sickness", { granted: false });

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.expectedPayOere).toBe(283875);
    expect(payCheck.possibleErrorsTotalOere).toBe(40875);
  });

  it("getPayCheck_NewShiftInOctober_ExpectedAndMissingHoursIncrease", async () => {
    // Arrange: man. 19/10 10–14 = 4 t × 92,50 kr.
    const api = createTestApi();
    await api.data("POST", "/shifts", {
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pauseMinutes: 0,
    });

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.expectedPayOere).toBe(283875 + 37000);
    expect(payCheck.differenceOere).toBe(283875 + 37000 - 243000);
    expect(errorAmount(payCheck, "hours")).toBe(13875 + 37000);
    expect(payCheck.possibleErrorsTotalOere).toBe(40875 + 37000);
  });

  it("getPayCheck_NewShiftInOtherMonth_OctoberUnchanged", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("POST", "/shifts", {
      jobId: "job-1",
      date: "2026-11-02",
      start: "10:00",
      end: "14:00",
      pauseMinutes: 0,
    });

    // Act
    const payCheck = await octoberPayCheck(api);

    // Assert
    expect(payCheck.expectedPayOere).toBe(283875);
    expect(payCheck.possibleErrorsTotalOere).toBe(40875);
  });
});

describe("GET /jobs/:jobId/pay-check – uden lønseddel og fejl", () => {
  it.each(["2026-09", "2026-11"])("getPayCheck_MonthWithoutPayslip%s_NoPayslip", async (month) => {
    // Arrange
    const api = createTestApi();

    // Act
    const payCheck = await api.data<PayCheckDto>("GET", `/jobs/job-1/pay-check?month=${month}`);

    // Assert
    expect(payCheck).toEqual({ status: "noPayslip", jobId: "job-1", month });
  });

  it("getPayCheck_UnknownJob_NotFound", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("GET", "/jobs/job-999/pay-check?month=2026-10");

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });

  it("getPayCheck_MonthMissing_ValidationFailedOnMonth", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("GET", "/jobs/job-1/pay-check");

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.month).toBeDefined();
    expectTraceId(failure);
  });

  it.each(["2026-13", "2026-00", "2026/10"])(
    "getPayCheck_InvalidMonth%s_ValidationFailedOnMonth",
    async (month) => {
      // Arrange
      const api = createTestApi();

      // Act
      const failure = await api.failure("GET", `/jobs/job-1/pay-check?month=${month}`);

      // Assert
      expect(failure.errorType).toBe("validationFailed");
      expect(failure.fieldErrors?.month).toBeDefined();
    },
  );
});
