// Overenskomstkataloget og job. Kun overenskomster med et regelsæt kan vælges.
import { describe, expect, it } from "vitest";
import type { AgreementDto, JobDto, PayCheckDto, ShiftMonthDto } from "@/mockApi/apiTypes";
import { createTestApi, expectTraceId, type TestApi } from "../../testUtils/mockApiTestClient";

const validJob = {
  workplace: "Testkiosken",
  position: "Butiksassistent",
  agreementCode: "hk-handel-butik",
};

async function unavailableAgreementCode(api: TestApi): Promise<string> {
  const agreements = await api.data<AgreementDto[]>("GET", "/agreements");
  const unavailable = agreements.find((agreement) => !agreement.isAvailable);
  if (unavailable === undefined) {
    throw new Error("Kataloget har ingen overenskomst, der kommer snart.");
  }
  return unavailable.code;
}

describe("GET /agreements", () => {
  it("getAgreements_Seed_OnlyHkHandelButikIsAvailable", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const agreements = await api.data<AgreementDto[]>("GET", "/agreements");

    // Assert
    const available = agreements.filter((agreement) => agreement.isAvailable);
    expect(available.map((agreement) => agreement.code)).toEqual(["hk-handel-butik"]);
  });

  it("getAgreements_Seed_HasAgreementsComingSoon", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const agreements = await api.data<AgreementDto[]>("GET", "/agreements");

    // Assert
    expect(agreements.some((agreement) => !agreement.isAvailable)).toBe(true);
  });

  it("getAgreements_Seed_HkHandelButikHasName", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const agreements = await api.data<AgreementDto[]>("GET", "/agreements");

    // Assert
    const hk = agreements.find((agreement) => agreement.code === "hk-handel-butik");
    expect(hk?.name).toBe("HK Handel – Butik");
  });
});

describe("GET /jobs", () => {
  it("getJobs_Seed_ReturnsTorvebutikkenWithHkHandelButik", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const jobs = await api.data<JobDto[]>("GET", "/jobs");

    // Assert
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.id).toBe("job-1");
    expect(jobs[0]?.workplace).toBe("Torvebutikken");
    expect(jobs[0]?.agreementCode).toBe("hk-handel-butik");
    expect(jobs[0]?.agreementName).toBe("HK Handel – Butik");
    expect(jobs[0]?.position.length).toBeGreaterThan(0);
  });
});

describe("POST /jobs", () => {
  it("createJob_ValidInput_ReturnsJobWithIdAndAgreementName", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const job = await api.data<JobDto>("POST", "/jobs", validJob);

    // Assert
    expect(job.id.length).toBeGreaterThan(0);
    expect(job.id).not.toBe("job-1");
    expect(job.workplace).toBe("Testkiosken");
    expect(job.position).toBe("Butiksassistent");
    expect(job.agreementCode).toBe("hk-handel-butik");
    expect(job.agreementName).toBe("HK Handel – Butik");
  });

  it("createJob_ValidInput_JobIsListed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const job = await api.data<JobDto>("POST", "/jobs", validJob);

    // Assert
    const jobs = await api.data<JobDto[]>("GET", "/jobs");
    expect(jobs.map((entry) => entry.id)).toEqual(expect.arrayContaining(["job-1", job.id]));
    expect(jobs).toHaveLength(2);
  });

  it("createJob_TwoJobs_GetDifferentIds", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const first = await api.data<JobDto>("POST", "/jobs", validJob);
    const second = await api.data<JobDto>("POST", "/jobs", {
      ...validJob,
      workplace: "Anden butik",
    });

    // Assert
    expect(first.id).not.toBe(second.id);
  });

  it("createJob_NewJob_HasNoShiftsAndNoPayslip", async () => {
    // Arrange
    const api = createTestApi();
    const job = await api.data<JobDto>("POST", "/jobs", validJob);

    // Act
    const month = await api.data<ShiftMonthDto>("GET", `/jobs/${job.id}/shifts?month=2026-10`);
    const payCheck = await api.data<PayCheckDto>("GET", `/jobs/${job.id}/pay-check?month=2026-10`);

    // Assert
    expect(month.shifts).toEqual([]);
    expect(month.totalPaidMinutes).toBe(0);
    expect(month.totalExpectedPayOere).toBe(0);
    expect(payCheck).toEqual({ status: "noPayslip", jobId: job.id, month: "2026-10" });
  });

  it.each(["workplace", "position", "agreementCode"])(
    "createJob_Missing%s_ValidationFailedRequired",
    async (field) => {
      // Arrange
      const api = createTestApi();
      const body: Record<string, unknown> = { ...validJob };
      delete body[field];

      // Act
      const failure = await api.failure("POST", "/jobs", body);

      // Assert
      expect(failure.errorType).toBe("validationFailed");
      expect(failure.fieldErrors?.[field]).toBe("required");
      expectTraceId(failure);
    },
  );

  it.each([
    ["workplace", ""],
    ["workplace", "   "],
    ["position", ""],
    ["position", "  "],
    ["agreementCode", ""],
  ])("createJob_%sBlank'%s'_ValidationFailedRequired", async (field, value) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs", { ...validJob, [field]: value });

    // Assert
    expect(failure.fieldErrors?.[field]).toBe("required");
  });

  it("createJob_EmptyBody_AllThreeFieldsRequired", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs", {});

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors).toEqual({
      workplace: "required",
      position: "required",
      agreementCode: "required",
    });
  });

  it("createJob_NoBody_ValidationFailed", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs");

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expectTraceId(failure);
  });

  it.each(["workplace", "position"])("createJob_%sNotText_InvalidFormat", async (field) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs", { ...validJob, [field]: 42 });

    // Assert
    expect(failure.fieldErrors?.[field]).toBe("invalidFormat");
  });

  it.each(["workplace", "position"])("createJob_%s101Characters_TooLong", async (field) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs", { ...validJob, [field]: "a".repeat(101) });

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.[field]).toBe("tooLong");
  });

  it.each(["workplace", "position"])("createJob_%s100Characters_IsAccepted", async (field) => {
    // Arrange
    const api = createTestApi();

    // Act
    const job = await api.data<JobDto>("POST", "/jobs", { ...validJob, [field]: "a".repeat(100) });

    // Assert
    expect(job.id.length).toBeGreaterThan(0);
  });

  it("createJob_UnknownAgreement_UnknownAgreementOnAgreementCode", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("POST", "/jobs", {
      ...validJob,
      agreementCode: "findes-ikke",
    });

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.agreementCode).toBe("unknownAgreement");
  });

  it("createJob_AgreementComingSoon_AgreementNotAvailable", async () => {
    // Arrange
    const api = createTestApi();
    const agreementCode = await unavailableAgreementCode(api);

    // Act
    const failure = await api.failure("POST", "/jobs", { ...validJob, agreementCode });

    // Assert
    expect(failure.errorType).toBe("validationFailed");
    expect(failure.fieldErrors?.agreementCode).toBe("agreementNotAvailable");
  });

  it("createJob_ValidationFailed_NoJobIsCreated", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    await api.failure("POST", "/jobs", { ...validJob, workplace: "" });

    // Assert
    const jobs = await api.data<JobDto[]>("GET", "/jobs");
    expect(jobs).toHaveLength(1);
  });
});
