// Valideringsfunktionerne kaldt direkte med en frisk seed-store. Alle regler er også dækket
// gennem API'et i endpoints-testene; her testes funktionernes egne kontrakter.
import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/mockApi/seed";
import { validateJob } from "@/mockApi/validation/jobValidation";
import { validateNoOverlap, validateShiftFields } from "@/mockApi/validation/shiftValidation";
import { expectFailure, expectSuccess } from "../../testUtils/resultAssertions";

const validShift = {
  jobId: "job-1",
  date: "2026-10-06",
  start: "20:00",
  end: "22:00",
  pauseMinutes: 0,
};

describe("validateShiftFields", () => {
  it("validateShiftFields_ValidBody_ReturnsInputWithJob", () => {
    // Arrange
    const store = createSeedStore();

    // Act
    const input = expectSuccess(validateShiftFields(store, validShift));

    // Assert
    expect(input.job.id).toBe("job-1");
    expect(input).toMatchObject({
      date: "2026-10-06",
      start: "20:00",
      end: "22:00",
      pauseMinutes: 0,
    });
  });

  it("validateShiftFields_OverlappingTimes_IsNotCheckedHere", () => {
    // Arrange
    const store = createSeedStore();

    // Act
    const result = validateShiftFields(store, { ...validShift, start: "16:00", end: "20:00" });

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([null, undefined, "tekst", 42, []])(
    "validateShiftFields_BodyNotObject%s_ValidationFailed",
    (body) => {
      // Arrange
      const store = createSeedStore();

      // Act
      const failure = expectFailure(validateShiftFields(store, body));

      // Assert
      expect(failure.errorType).toBe("validationFailed");
    },
  );
});

describe("validateNoOverlap", () => {
  it("validateNoOverlap_TouchingExistingShift_Success", () => {
    // Arrange
    const store = createSeedStore();
    const input = expectSuccess(validateShiftFields(store, validShift));

    // Act
    const result = validateNoOverlap(store, input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("validateNoOverlap_OverlappingExistingShift_OverlapsExistingShiftOnStart", () => {
    // Arrange
    const store = createSeedStore();
    const input = expectSuccess(
      validateShiftFields(store, { ...validShift, start: "19:59", end: "22:00" }),
    );

    // Act
    const failure = expectFailure(validateNoOverlap(store, input));

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.start).toBe("overlapsExistingShift");
  });
});

describe("validateJob", () => {
  const validJob = {
    workplace: "Testkiosken",
    position: "Butiksassistent",
    agreementCode: "hk-handel-butik",
  };

  it("validateJob_ValidBody_ReturnsInput", () => {
    // Arrange
    const store = createSeedStore();

    // Act
    const input = expectSuccess(validateJob(store, validJob));

    // Assert
    expect(input).toEqual(validJob);
  });

  it.each([null, undefined, "tekst", 42])(
    "validateJob_BodyNotObject%s_ValidationFailed",
    (body) => {
      // Arrange
      const store = createSeedStore();

      // Act
      const failure = expectFailure(validateJob(store, body));

      // Assert
      expect(failure.errorType).toBe("validationFailed");
    },
  );

  it("validateJob_UnknownAgreement_UnknownAgreement", () => {
    // Arrange
    const store = createSeedStore();

    // Act
    const failure = expectFailure(
      validateJob(store, { ...validJob, agreementCode: "findes-ikke" }),
    );

    // Assert
    expect(failure.fieldErrors?.agreementCode).toBe("unknownAgreement");
  });
});
