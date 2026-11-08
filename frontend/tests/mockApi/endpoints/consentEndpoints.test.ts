// Samtykke til sygdom: Fra fra start. Trækkes det tilbage, slettes alle sygdomsmarkeringer.
import { describe, expect, it } from "vitest";
import type { ConsentsDto, ShiftMonthDto, SicknessConsentChangedDto } from "@/mockApi/apiTypes";
import { createTestApi, expectTraceId, type TestApi } from "../../testUtils/mockApiTestClient";

async function octoberShifts(api: TestApi): Promise<ShiftMonthDto> {
  return api.data<ShiftMonthDto>("GET", "/jobs/job-1/shifts?month=2026-10");
}

describe("PUT /consents/sickness", () => {
  it("setSicknessConsent_GrantedTrue_ConsentIsOnAndNothingRemoved", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const changed = await api.data<SicknessConsentChangedDto>("PUT", "/consents/sickness", {
      granted: true,
    });

    // Assert
    expect(changed).toEqual({ sicknessConsent: true, removedSickMarkings: 0 });
    expect(await api.data<ConsentsDto>("GET", "/consents")).toEqual({ sicknessConsent: true });
  });

  it("setSicknessConsent_RevokedAfterTwoSickMarkings_RemovesBothMarkings", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("PUT", "/consents/sickness", { granted: true });
    const month = await octoberShifts(api);
    const [first, second] = month.shifts;
    await api.data("PUT", `/shifts/${first?.id ?? ""}/sick`);
    await api.data("PUT", `/shifts/${second?.id ?? ""}/sick`);

    // Act
    const changed = await api.data<SicknessConsentChangedDto>("PUT", "/consents/sickness", {
      granted: false,
    });

    // Assert
    expect(changed).toEqual({ sicknessConsent: false, removedSickMarkings: 2 });
    const after = await octoberShifts(api);
    expect(after.shifts.every((shift) => !shift.isSick)).toBe(true);
    expect(after.totalExpectedPayOere).toBe(283875);
  });

  it("setSicknessConsent_RevokedWithoutSickMarkings_RemovesNothing", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("PUT", "/consents/sickness", { granted: true });

    // Act
    const changed = await api.data<SicknessConsentChangedDto>("PUT", "/consents/sickness", {
      granted: false,
    });

    // Assert
    expect(changed).toEqual({ sicknessConsent: false, removedSickMarkings: 0 });
  });

  it("setSicknessConsent_GrantedAgainWhileOn_KeepsSickMarkings", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("PUT", "/consents/sickness", { granted: true });
    const month = await octoberShifts(api);
    await api.data("PUT", `/shifts/${month.shifts[0]?.id ?? ""}/sick`);

    // Act
    const changed = await api.data<SicknessConsentChangedDto>("PUT", "/consents/sickness", {
      granted: true,
    });

    // Assert
    expect(changed.removedSickMarkings).toBe(0);
    const after = await octoberShifts(api);
    expect(after.shifts.filter((shift) => shift.isSick)).toHaveLength(1);
  });

  it("setSicknessConsent_GrantedMissing_ValidationFailedRequired", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("PUT", "/consents/sickness", {});

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.granted).toBe("required");
    expectTraceId(failure);
  });

  it.each([["ja"], [1], [null]])(
    "setSicknessConsent_GrantedNotBoolean%s_ValidationFailedOnGranted",
    async (granted) => {
      // Arrange
      const api = createTestApi();

      // Act
      const failure = await api.failure("PUT", "/consents/sickness", { granted });

      // Assert
      expect(failure.errorType).toBe("validationFailed");
      expect(failure.fieldErrors?.granted).toBeDefined();
      expectTraceId(failure);
    },
  );

  it("setSicknessConsent_GrantedString_InvalidFormat", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("PUT", "/consents/sickness", { granted: "true" });

    // Assert
    expect(failure.fieldErrors?.granted).toBe("invalidFormat");
  });

  it("setSicknessConsent_NoBody_ValidationFailed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("PUT", "/consents/sickness");

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expectTraceId(failure);
  });

  it("setSicknessConsent_ValidationFailed_ConsentUnchanged", async () => {
    // Arrange
    const api = createTestApi();
    await api.data("PUT", "/consents/sickness", { granted: true });

    // Act
    await api.failure("PUT", "/consents/sickness", { granted: "nej" });

    // Assert
    expect(await api.data<ConsentsDto>("GET", "/consents")).toEqual({ sicknessConsent: true });
  });
});
