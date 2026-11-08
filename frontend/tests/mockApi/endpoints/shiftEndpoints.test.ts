// Vagter: månedsliste, estimat, oprettelse med validering og sygdomsmarkering.
// Seedens vagter for job-1 i oktober 2026: 6/10 16–20, 8/10 16–20, 10/10 9–15, 11/10 10–16 og
// 14/10 15:30–21. Mandag 19/10 og tirsdag 20/10 har ingen vagter i seed.
import { describe, expect, it } from "vitest";
import type { JobDto, ShiftDto, ShiftEstimateDto, ShiftMonthDto } from "@/mockApi/apiTypes";
import { createSeedStore } from "@/mockApi/seed";
import { createTestApi, expectTraceId, type TestApi } from "../../testUtils/mockApiTestClient";

type ShiftBody = {
  jobId: unknown;
  date: unknown;
  start: unknown;
  end: unknown;
  pauseMinutes: unknown;
};

const shiftFields = ["jobId", "date", "start", "end", "pauseMinutes"] as const;

function shiftBody(overrides?: Partial<ShiftBody>): ShiftBody {
  return {
    jobId: "job-1",
    date: "2026-10-19",
    start: "10:00",
    end: "14:00",
    pauseMinutes: 30,
    ...overrides,
  };
}

async function octoberShifts(api: TestApi): Promise<ShiftMonthDto> {
  return api.data<ShiftMonthDto>("GET", "/jobs/job-1/shifts?month=2026-10");
}

async function seedShiftOn(api: TestApi, date: string): Promise<ShiftDto> {
  const month = await octoberShifts(api);
  const shift = month.shifts.find((entry) => entry.date === date);
  if (shift === undefined) {
    throw new Error(`Seed har ingen vagt den ${date}.`);
  }
  return shift;
}

async function grantSicknessConsent(api: TestApi): Promise<void> {
  await api.data("PUT", "/consents/sickness", { granted: true });
}

describe("GET /jobs/:jobId/shifts", () => {
  it("getShiftsForMonth_SeedOctober_FiveShiftsTotal25AndAHalfHours", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const month = await octoberShifts(api);

    // Assert
    expect(month.jobId).toBe("job-1");
    expect(month.month).toBe("2026-10");
    expect(month.shifts).toHaveLength(5);
    expect(month.totalPaidMinutes).toBe(1530);
    expect(month.totalExpectedPayOere).toBe(283875);
  });

  it("getShiftsForMonth_SeedOctober_SortedByDateWithSpecifiedPay", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const month = await octoberShifts(api);

    // Assert
    expect(
      month.shifts.map((shift) => [shift.date, shift.start, shift.end, shift.expectedPayOere]),
    ).toEqual([
      ["2026-10-06", "16:00", "20:00", 43000],
      ["2026-10-08", "16:00", "20:00", 43000],
      ["2026-10-10", "09:00", "15:00", 55500],
      ["2026-10-11", "10:00", "16:00", 82500],
      ["2026-10-14", "15:30", "21:00", 59875],
    ]);
  });

  it("getShiftsForMonth_SeedOctober_NoShiftIsSick", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const month = await octoberShifts(api);

    // Assert
    expect(month.shifts.every((shift) => !shift.isSick && shift.jobId === "job-1")).toBe(true);
  });

  it("getShiftsForMonth_MonthWithoutShifts_EmptyListAndZeroTotals", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const month = await api.data<ShiftMonthDto>("GET", "/jobs/job-1/shifts?month=2026-09");

    // Assert
    expect(month).toEqual({
      jobId: "job-1",
      month: "2026-09",
      shifts: [],
      totalPaidMinutes: 0,
      totalExpectedPayOere: 0,
    });
  });

  it("getShiftsForMonth_UnknownJob_NotFound", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("GET", "/jobs/job-999/shifts?month=2026-10");

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });

  it("getShiftsForMonth_MonthMissing_ValidationFailedOnMonth", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("GET", "/jobs/job-1/shifts");

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.month).toBeDefined();
    expectTraceId(failure);
  });

  it.each(["2026-13", "2026-1", "2026-10-01", "oktober", ""])(
    "getShiftsForMonth_InvalidMonth'%s'_ValidationFailedOnMonth",
    async (month) => {
      // Arrange
      const api = createTestApi();

      // Act
      const failure = await api.failure("GET", `/jobs/job-1/shifts?month=${month}`);

      // Assert
      expect(failure.errorType).toBe("validationFailed");
      expect(failure.fieldErrors?.month).toBeDefined();
    },
  );
});

describe("POST /shifts", () => {
  it("createShift_ValidInput_ReturnsShiftWithCalculatedPay", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const shift = await api.data<ShiftDto>("POST", "/shifts", shiftBody());

    // Assert
    expect(shift.id.length).toBeGreaterThan(0);
    expect(shift).toMatchObject({
      jobId: "job-1",
      date: "2026-10-19",
      start: "10:00",
      end: "14:00",
      pauseMinutes: 30,
      isSick: false,
      paidMinutes: 240,
      hourlyWageOere: 9250,
      basePayOere: 37000,
      expectedPayOere: 37000,
    });
  });

  it("createShift_ValidInput_ShiftIsInMonthListAndTotalsGrow", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const shift = await api.data<ShiftDto>("POST", "/shifts", shiftBody());

    // Assert
    const month = await octoberShifts(api);
    expect(month.shifts.map((entry) => entry.id)).toContain(shift.id);
    expect(month.totalPaidMinutes).toBe(1530 + 240);
    expect(month.totalExpectedPayOere).toBe(283875 + 37000);
  });

  it("createShift_EarlierDate_MonthListStaysSortedByDateAndStart", async () => {
    // Arrange
    const api = createTestApi();
    await api.data(
      "POST",
      "/shifts",
      shiftBody({ date: "2026-10-06", start: "08:00", end: "12:00" }),
    );
    await api.data("POST", "/shifts", shiftBody({ date: "2026-10-01" }));

    // Act
    const month = await octoberShifts(api);

    // Assert
    const keys = month.shifts.map((shift) => `${shift.date} ${shift.start}`);
    expect(keys).toEqual([...keys].sort());
    expect(keys.slice(0, 3)).toEqual(["2026-10-01 10:00", "2026-10-06 08:00", "2026-10-06 16:00"]);
  });

  it("createShift_TwoShifts_GetDifferentIds", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const first = await api.data<ShiftDto>("POST", "/shifts", shiftBody());
    const second = await api.data<ShiftDto>("POST", "/shifts", shiftBody({ date: "2026-10-20" }));

    // Assert
    expect(first.id).not.toBe(second.id);
  });

  it("createShift_TouchesExistingShiftAtEnd_IsAllowed", async () => {
    // Arrange: seedens vagt 6/10 slutter 20:00
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      "/shifts",
      shiftBody({ date: "2026-10-06", start: "20:00", end: "22:00", pauseMinutes: 0 }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it("createShift_TouchesExistingShiftAtStart_IsAllowed", async () => {
    // Arrange: seedens vagt 6/10 starter 16:00
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      "/shifts",
      shiftBody({ date: "2026-10-06", start: "12:00", end: "16:00", pauseMinutes: 0 }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ["overlapper slutningen", "19:00", "21:00"],
    ["overlapper starten", "15:00", "17:00"],
    ["ligger indeni", "17:00", "18:00"],
    ["omslutter", "15:00", "21:00"],
    ["samme tider", "16:00", "20:00"],
  ])("createShift_%s_OverlapsExistingShiftOnStart", async (_label, start, end) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure(
      "POST",
      "/shifts",
      shiftBody({ date: "2026-10-06", start, end, pauseMinutes: 0 }),
    );

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.start).toBe("overlapsExistingShift");
    expectTraceId(failure);
  });

  it("createShift_OverlapsNewlyCreatedShift_OverlapsExistingShift", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("POST", "/shifts", shiftBody());

    // Act
    const failure = await api.failure(
      "POST",
      "/shifts",
      shiftBody({ start: "13:00", end: "15:00" }),
    );

    // Assert
    expect(failure.fieldErrors?.start).toBe("overlapsExistingShift");
  });

  it("createShift_SameTimeOnOtherJob_IsAllowed", async () => {
    // Arrange
    const api = createTestApi();
    const otherJob = await api.data<JobDto>("POST", "/jobs", {
      workplace: "Testkiosken",
      position: "Butiksassistent",
      agreementCode: "hk-handel-butik",
    });

    // Act
    const result = await api.send(
      "POST",
      "/shifts",
      shiftBody({ jobId: otherJob.id, date: "2026-10-06", start: "16:00", end: "20:00" }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it("createShift_SameTimeOtherDate_IsAllowed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      "/shifts",
      shiftBody({ date: "2026-10-07", start: "16:00", end: "20:00" }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it("createShift_ValidationFailed_NoShiftIsCreated", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    await api.failure("POST", "/shifts", shiftBody({ end: "09:00" }));

    // Assert
    const month = await octoberShifts(api);
    expect(month.shifts).toHaveLength(5);
  });
});

// Samme feltvalidering gælder estimat og oprettelse.
describe.each(["/shifts", "/shifts/estimate"])("POST %s – feltvalidering", (path) => {
  it.each(shiftFields)("validate_Missing%s_Required", async (field) => {
    // Arrange
    const api = createTestApi();
    const body: Record<string, unknown> = { ...shiftBody() };
    delete body[field];

    // Act
    const failure = await api.failure("POST", path, body);

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.[field]).toBe("required");
    expectTraceId(failure);
  });

  it.each([
    ["jobId", ""],
    ["date", ""],
    ["start", ""],
    ["end", "  "],
  ])("validate_%sBlank_Required", async (field, value) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, shiftBody({ [field]: value }));

    // Assert
    expect(failure.fieldErrors?.[field]).toBe("required");
  });

  it("validate_EmptyBody_AllFieldsRequired", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, {});

    // Assert
    expect(failure.fieldErrors).toEqual({
      jobId: "required",
      date: "required",
      start: "required",
      end: "required",
      pauseMinutes: "required",
    });
  });

  it("validate_NoBody_ValidationFailed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path);

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expectTraceId(failure);
  });

  it.each([
    ["date", "2026-02-30"],
    ["date", "2026-13-01"],
    ["date", "19-10-2026"],
    ["date", "2026-10-1"],
    ["start", "25:00"],
    ["start", "10:60"],
    ["start", "ti"],
    ["end", "24:00"],
    ["end", "abc"],
    ["pauseMinutes", "abc"],
    ["pauseMinutes", 12.5],
  ])("validate_%sInvalid'%s'_InvalidFormat", async (field, value) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, shiftBody({ [field]: value }));

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.[field]).toBe("invalidFormat");
  });

  it("validate_UnknownJob_UnknownJobOnJobId", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, shiftBody({ jobId: "job-999" }));

    // Assert
    expect(failure.fieldErrors?.jobId).toBe("unknownJob");
  });

  it.each([
    ["slut lig start", "10:00", "10:00"],
    ["slut før start", "20:00", "16:00"],
    ["hen over midnat", "22:00", "02:00"],
    ["slut ved midnat", "22:00", "00:00"],
  ])("validate_%s_EndNotAfterStartOnEnd", async (_label, start, end) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, shiftBody({ start, end, pauseMinutes: 0 }));

    // Assert
    expect(failure.fieldErrors?.end).toBe("endNotAfterStart");
  });

  it.each([-1, 121, 500])("validate_Pause%s_PauseOutOfRange", async (pauseMinutes) => {
    // Arrange: vagten er 10:00–20:00, så pausen er kortere end vagten
    const api = createTestApi();

    // Act
    const failure = await api.failure(
      "POST",
      path,
      shiftBody({ start: "10:00", end: "20:00", pauseMinutes }),
    );

    // Assert
    expect(failure.fieldErrors?.pauseMinutes).toBe("pauseOutOfRange");
  });

  it.each([0, 1, 119, 120])("validate_Pause%s_IsAccepted", async (pauseMinutes) => {
    // Arrange
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      path,
      shiftBody({ start: "10:00", end: "20:00", pauseMinutes }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ["pause lig vagten", "10:00", "11:00", 60],
    ["pause længere end vagten", "10:00", "10:30", 45],
    ["kort vagt med pause lig vagten", "10:00", "10:01", 1],
  ])("validate_%s_PauseNotShorterThanShift", async (_label, start, end, pauseMinutes) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", path, shiftBody({ start, end, pauseMinutes }));

    // Assert
    expect(failure.fieldErrors?.pauseMinutes).toBe("pauseNotShorterThanShift");
  });

  it("validate_PauseOneMinuteShorterThanShift_IsAccepted", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      path,
      shiftBody({ start: "10:00", end: "11:00", pauseMinutes: 59 }),
    );

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("POST /shifts/estimate", () => {
  it("estimateShift_WeekdayEvening_ReturnsPayWithEveningSupplement", async () => {
    // Arrange: ons. 14/10 15:30–21 som i seed
    const api = createTestApi();

    // Act
    const estimate = await api.data<ShiftEstimateDto>(
      "POST",
      "/shifts/estimate",
      shiftBody({ date: "2026-10-21", start: "15:30", end: "21:00", pauseMinutes: 0 }),
    );

    // Assert
    expect(estimate.paidMinutes).toBe(330);
    expect(estimate.hourlyWageOere).toBe(9250);
    expect(estimate.basePayOere).toBe(50875);
    expect(estimate.expectedPayOere).toBe(59875);
    const evening = estimate.supplements.find((line) => line.kind === "evening");
    expect(evening).toEqual({
      kind: "evening",
      minutes: 180,
      rateOerePerHour: 3000,
      amountOere: 9000,
    });
  });

  it("estimateShift_OverlapsExistingShift_IsAllowed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const result = await api.send(
      "POST",
      "/shifts/estimate",
      shiftBody({ date: "2026-10-06", start: "16:00", end: "20:00", pauseMinutes: 0 }),
    );

    // Assert
    expect(result.success).toBe(true);
  });

  it("estimateShift_ValidInput_DoesNotSaveShift", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    await api.data("POST", "/shifts/estimate", shiftBody());

    // Assert
    const month = await octoberShifts(api);
    expect(month.shifts).toHaveLength(5);
    expect(month.totalExpectedPayOere).toBe(283875);
  });
});

describe("PUT /shifts/:shiftId/sick", () => {
  it("markShiftSick_ConsentOff_Forbidden", async () => {
    // Arrange
    const api = createTestApi();
    const sunday = await seedShiftOn(api, "2026-10-11");

    // Act
    const failure = await api.failure("PUT", `/shifts/${sunday.id}/sick`);

    // Assert
    expect(failure.errorType).toBe("forbidden");
    expectTraceId(failure);
  });

  it("markShiftSick_ConsentOff_ShiftIsNotMarked", async () => {
    // Arrange
    const api = createTestApi();
    const sunday = await seedShiftOn(api, "2026-10-11");

    // Act
    await api.failure("PUT", `/shifts/${sunday.id}/sick`);

    // Assert
    expect((await seedShiftOn(api, "2026-10-11")).isSick).toBe(false);
  });

  it("markShiftSick_ConsentOn_ShiftIsSickWithoutSupplements", async () => {
    // Arrange
    const api = createTestApi();
    await grantSicknessConsent(api);
    const sunday = await seedShiftOn(api, "2026-10-11");

    // Act
    const shift = await api.data<ShiftDto>("PUT", `/shifts/${sunday.id}/sick`);

    // Assert
    expect(shift.id).toBe(sunday.id);
    expect(shift.isSick).toBe(true);
    expect(shift.paidMinutes).toBe(360);
    expect(shift.expectedPayOere).toBe(55500);
    expect(shift.supplements.reduce((sum, line) => sum + line.amountOere, 0)).toBe(0);
  });

  it("markShiftSick_ConsentOn_MonthTotalsUseSickPay", async () => {
    // Arrange
    const api = createTestApi();
    await grantSicknessConsent(api);
    const sunday = await seedShiftOn(api, "2026-10-11");

    // Act
    await api.data("PUT", `/shifts/${sunday.id}/sick`);

    // Assert
    const month = await octoberShifts(api);
    expect(month.totalPaidMinutes).toBe(1530);
    expect(month.totalExpectedPayOere).toBe(256875);
  });

  it("markShiftSick_UnknownShift_NotFound", async () => {
    // Arrange
    const api = createTestApi();
    await grantSicknessConsent(api);

    // Act
    const failure = await api.failure("PUT", "/shifts/shift-999/sick");

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });
});

describe("DELETE /shifts/:shiftId/sick", () => {
  it("unmarkShiftSick_SickShift_ShiftIsNoLongerSick", async () => {
    // Arrange
    const api = createTestApi();
    await grantSicknessConsent(api);
    const sunday = await seedShiftOn(api, "2026-10-11");
    await api.data("PUT", `/shifts/${sunday.id}/sick`);

    // Act
    const shift = await api.data<ShiftDto>("DELETE", `/shifts/${sunday.id}/sick`);

    // Assert
    expect(shift.isSick).toBe(false);
    expect(shift.expectedPayOere).toBe(82500);
  });

  it("unmarkShiftSick_ConsentOff_DoesNotRequireConsent", async () => {
    // Arrange: en syg vagt, mens samtykket er Fra (sat direkte i en egen store)
    const store = createSeedStore();
    const sickShift = store.shifts.find((shift) => shift.date === "2026-10-11");
    if (sickShift === undefined) {
      throw new Error("Seed har ingen søndagsvagt.");
    }
    sickShift.isSick = true;
    store.consents.sickness = false;
    const api = createTestApi(store);

    // Act
    const shift = await api.data<ShiftDto>("DELETE", `/shifts/${sickShift.id}/sick`);

    // Assert
    expect(shift.isSick).toBe(false);
  });

  it("unmarkShiftSick_UnknownShift_NotFound", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("DELETE", "/shifts/shift-999/sick");

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });
});
