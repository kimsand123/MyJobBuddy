// Model (…Api.ts) for hver widget: rigtigt kald til ApiClient, gyldige svar gives videre, ugyldige
// API-data afvises af Zod som invalidResponse, og fejl (errorType, fieldErrors, traceId) sendes
// uændret videre.
import { describe, expect, it } from "vitest";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { ApiClient, ApiRequest, HttpMethod } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import { profileSchema } from "@/shared/apiSchemas";
import { fail, ok, type Result } from "@/shared/result";
import * as aiChatApi from "@/widgets/aiChat/aiChatApi";
import * as consentsApi from "@/widgets/consents/consentsApi";
import * as homeApi from "@/widgets/home/homeApi";
import * as jobsApi from "@/widgets/jobs/jobsApi";
import * as payCheckApi from "@/widgets/payCheck/payCheckApi";
import * as profileApi from "@/widgets/profile/profileApi";
import * as shiftCalendarApi from "@/widgets/shiftCalendar/shiftCalendarApi";
import * as shiftRegistrationApi from "@/widgets/shiftRegistration/shiftRegistrationApi";
import * as sicknessApi from "@/widgets/sickness/sicknessApi";
import * as subscriptionApi from "@/widgets/subscription/subscriptionApi";
import { expectFailure, expectSuccess } from "../testUtils/resultAssertions";

type Recorder = ApiClient & { requests: ApiRequest[] };

/** Svarer med det givne resultat og gemmer kaldet. */
function fakeClient(answer: (request: ApiRequest) => Promise<Result<unknown>>): Recorder {
  const requests: ApiRequest[] = [];
  return {
    requests,
    request: (request: ApiRequest) => {
      requests.push(request);
      return answer(request);
    },
  };
}

/** Sender videre til mock-API'et på en frisk seed-store, så svaret er gyldige API-data. */
function seedClient(): Recorder {
  const inner = createMockApiClient({ delayMs: 0, store: createSeedStore() });
  return fakeClient((request) => inner.request(request));
}

const shiftBody = {
  jobId: "job-1",
  date: "2026-10-19",
  start: "10:00",
  end: "14:00",
  pauseMinutes: 0,
};

type ModelCase = {
  name: string;
  call: (client: ApiClient, signal: AbortSignal) => Promise<Result<unknown>>;
  method: HttpMethod;
  path: string;
  body?: unknown;
  /** true = Model skal give AbortSignal videre (læsende kald). */
  passesSignal: boolean;
  /** Data, der ikke passer til skemaet. */
  invalid: unknown;
};

const modelCases: ModelCase[] = [
  {
    name: "profileApi.fetchProfile",
    call: (client, signal) => profileApi.fetchProfile(client, signal),
    method: "GET",
    path: "/profile",
    passesSignal: true,
    invalid: { firstName: 42, age: "17" },
  },
  {
    name: "homeApi.fetchProfile",
    call: (client, signal) => homeApi.fetchProfile(client, signal),
    method: "GET",
    path: "/profile",
    passesSignal: true,
    invalid: { firstName: "Maja" },
  },
  {
    name: "aiChatApi.fetchProfile",
    call: (client, signal) => aiChatApi.fetchProfile(client, signal),
    method: "GET",
    path: "/profile",
    passesSignal: true,
    invalid: null,
  },
  {
    name: "subscriptionApi.fetchSubscription",
    call: (client, signal) => subscriptionApi.fetchSubscription(client, signal),
    method: "GET",
    path: "/subscription",
    passesSignal: true,
    invalid: { currentPlanCode: "gold", questionsRemaining: 3, questionsTotal: 5, plans: [] },
  },
  {
    name: "aiChatApi.fetchSubscription",
    call: (client, signal) => aiChatApi.fetchSubscription(client, signal),
    method: "GET",
    path: "/subscription",
    passesSignal: true,
    invalid: { currentPlanCode: "free" },
  },
  {
    name: "consentsApi.fetchConsents",
    call: (client, signal) => consentsApi.fetchConsents(client, signal),
    method: "GET",
    path: "/consents",
    passesSignal: true,
    invalid: { sicknessConsent: "false" },
  },
  {
    name: "sicknessApi.fetchConsents",
    call: (client, signal) => sicknessApi.fetchConsents(client, signal),
    method: "GET",
    path: "/consents",
    passesSignal: true,
    invalid: {},
  },
  {
    name: "consentsApi.setSicknessConsent",
    call: (client) => consentsApi.setSicknessConsent(client, true),
    method: "PUT",
    path: "/consents/sickness",
    body: { granted: true },
    passesSignal: false,
    invalid: { sicknessConsent: true },
  },
  {
    name: "sicknessApi.grantSicknessConsent",
    call: (client) => sicknessApi.grantSicknessConsent(client),
    method: "PUT",
    path: "/consents/sickness",
    body: { granted: true },
    passesSignal: false,
    invalid: { removedSickMarkings: "0" },
  },
  {
    name: "jobsApi.fetchJobs",
    call: (client, signal) => jobsApi.fetchJobs(client, signal),
    method: "GET",
    path: "/jobs",
    passesSignal: true,
    invalid: [{ id: "job-1", workplace: "Torvebutikken" }],
  },
  {
    name: "payCheckApi.fetchJobs",
    call: (client, signal) => payCheckApi.fetchJobs(client, signal),
    method: "GET",
    path: "/jobs",
    passesSignal: true,
    invalid: { id: "job-1" },
  },
  {
    name: "shiftCalendarApi.fetchJobs",
    call: (client, signal) => shiftCalendarApi.fetchJobs(client, signal),
    method: "GET",
    path: "/jobs",
    passesSignal: true,
    invalid: "job-1",
  },
  {
    name: "homeApi.fetchJobs",
    call: (client, signal) => homeApi.fetchJobs(client, signal),
    method: "GET",
    path: "/jobs",
    passesSignal: true,
    invalid: [null],
  },
  {
    name: "aiChatApi.fetchJobs",
    call: (client, signal) => aiChatApi.fetchJobs(client, signal),
    method: "GET",
    path: "/jobs",
    passesSignal: true,
    invalid: [{}],
  },
  {
    name: "jobsApi.fetchAgreements",
    call: (client, signal) => jobsApi.fetchAgreements(client, signal),
    method: "GET",
    path: "/agreements",
    passesSignal: true,
    invalid: [{ code: "hk-handel-butik", name: "HK Handel – Butik", isAvailable: "ja" }],
  },
  {
    name: "jobsApi.createJob",
    call: (client) =>
      jobsApi.createJob(client, {
        workplace: "Testkiosken",
        position: "Butiksassistent",
        agreementCode: "hk-handel-butik",
      }),
    method: "POST",
    path: "/jobs",
    body: {
      workplace: "Testkiosken",
      position: "Butiksassistent",
      agreementCode: "hk-handel-butik",
    },
    passesSignal: false,
    invalid: { id: 7 },
  },
  {
    name: "shiftCalendarApi.fetchShiftMonth",
    call: (client, signal) => shiftCalendarApi.fetchShiftMonth(client, "job-1", "2026-10", signal),
    method: "GET",
    path: "/jobs/job-1/shifts?month=2026-10",
    passesSignal: true,
    invalid: { jobId: "job-1", month: "2026-10", shifts: "ingen" },
  },
  {
    name: "homeApi.fetchShiftMonth",
    call: (client, signal) => homeApi.fetchShiftMonth(client, "job-1", "2026-10", signal),
    method: "GET",
    path: "/jobs/job-1/shifts?month=2026-10",
    passesSignal: true,
    invalid: { totalPaidMinutes: 1530 },
  },
  {
    name: "payCheckApi.fetchPayCheck",
    call: (client, signal) => payCheckApi.fetchPayCheck(client, "job-1", "2026-10", signal),
    method: "GET",
    path: "/jobs/job-1/pay-check?month=2026-10",
    passesSignal: true,
    invalid: { status: "ukendt", jobId: "job-1", month: "2026-10" },
  },
  {
    name: "homeApi.fetchPayCheck",
    call: (client, signal) => homeApi.fetchPayCheck(client, "job-1", "2026-10", signal),
    method: "GET",
    path: "/jobs/job-1/pay-check?month=2026-10",
    passesSignal: true,
    invalid: { status: "checked", jobId: "job-1", month: "2026-10" },
  },
  {
    name: "shiftRegistrationApi.estimateShift",
    call: (client, signal) => shiftRegistrationApi.estimateShift(client, shiftBody, signal),
    method: "POST",
    path: "/shifts/estimate",
    body: shiftBody,
    passesSignal: true,
    invalid: { paidMinutes: "240" },
  },
  {
    name: "shiftRegistrationApi.createShift",
    call: (client) => shiftRegistrationApi.createShift(client, shiftBody),
    method: "POST",
    path: "/shifts",
    body: shiftBody,
    passesSignal: false,
    invalid: { id: "shift-x" },
  },
  {
    name: "aiChatApi.fetchChatQuestions",
    call: (client, signal) => aiChatApi.fetchChatQuestions(client, signal),
    method: "GET",
    path: "/chat/questions",
    passesSignal: true,
    invalid: [{ id: 1, text: "Spørgsmål" }],
  },
  {
    name: "aiChatApi.fetchChatQuestion",
    call: (client, signal) => aiChatApi.fetchChatQuestion(client, "question-3", signal),
    method: "GET",
    path: "/chat/questions/question-3",
    passesSignal: true,
    invalid: { id: "question-3" },
  },
  {
    name: "aiChatApi.fetchChatAnswer",
    call: (client, signal) => aiChatApi.fetchChatAnswer(client, "question-3", signal),
    method: "GET",
    path: "/chat/questions/question-3/answer",
    passesSignal: true,
    invalid: { questionId: "question-3", answer: "Svar", source: "Kilde", referToUnion: "ja" },
  },
];

describe.each(modelCases)("$name", (modelCase) => {
  it("model_Called_SendsExpectedRequest", async () => {
    // Arrange
    const client = seedClient();
    const controller = new AbortController();

    // Act
    await modelCase.call(client, controller.signal);

    // Assert
    expect(client.requests).toHaveLength(1);
    const request = client.requests[0];
    expect(request?.method).toBe(modelCase.method);
    expect(request?.path).toBe(modelCase.path);
    if (modelCase.body !== undefined) {
      expect(request?.body).toEqual(modelCase.body);
    }
    if (modelCase.passesSignal) {
      expect(request?.signal).toBe(controller.signal);
    }
  });

  it("model_ValidApiData_ReturnsSameData", async () => {
    // Arrange
    const reference = createMockApiClient({ delayMs: 0, store: createSeedStore() });
    const expected = expectSuccess(
      await reference.request({
        method: modelCase.method,
        path: modelCase.path,
        body: modelCase.body,
      }),
    );

    // Act
    const result = await modelCase.call(seedClient(), new AbortController().signal);

    // Assert
    expect(expectSuccess(result)).toEqual(expected);
  });

  it("model_InvalidApiData_InvalidResponse", async () => {
    // Arrange
    const client = fakeClient(() => Promise.resolve(ok(modelCase.invalid)));

    // Act
    const result = await modelCase.call(client, new AbortController().signal);

    // Assert
    expect(expectFailure(result).errorType).toBe("invalidResponse");
  });

  it("model_ApiFailure_PassesErrorTypeFieldErrorsAndTraceIdOn", async () => {
    // Arrange
    const failure = fail("validationFailed", "Ugyldige felter", {
      traceId: "trace-model-test",
      fieldErrors: { workplace: "required" },
    });
    const client = fakeClient(() => Promise.resolve(failure));

    // Act
    const result = await modelCase.call(client, new AbortController().signal);

    // Assert
    const received = expectFailure(result);
    expect(received.errorType).toBe("validationFailed");
    expect(received.traceId).toBe("trace-model-test");
    expect(received.fieldErrors).toEqual({ workplace: "required" });
  });

  it.each(["forbidden", "notFound", "serverError", "networkError", "aborted"] as const)(
    "model_ApiFailure%s_PassesErrorTypeOn",
    async (errorType) => {
      // Arrange
      const client = fakeClient(() =>
        Promise.resolve(fail(errorType, "Fejl", { traceId: "trace-1" })),
      );

      // Act
      const result = await modelCase.call(client, new AbortController().signal);

      // Assert
      const received = expectFailure(result);
      expect(received.errorType).toBe(errorType);
      expect(received.traceId).toBe("trace-1");
    },
  );
});

describe("requestData", () => {
  it("requestData_ValidData_StripsUnknownFields", async () => {
    // Arrange
    const client = fakeClient(() =>
      Promise.resolve(ok({ firstName: "Maja", age: 17, cpr: "010101-0101" })),
    );

    // Act
    const result = await requestData(client, { method: "GET", path: "/profile" }, profileSchema);

    // Assert
    expect(expectSuccess(result)).toEqual({ firstName: "Maja", age: 17 });
  });

  it("requestData_InvalidData_InvalidResponseWithoutData", async () => {
    // Arrange
    const client = fakeClient(() => Promise.resolve(ok("ikke et objekt")));

    // Act
    const result = await requestData(client, { method: "GET", path: "/profile" }, profileSchema);

    // Assert
    const failure = expectFailure(result);
    expect(failure.errorType).toBe("invalidResponse");
    expect("data" in failure).toBe(false);
  });
});
