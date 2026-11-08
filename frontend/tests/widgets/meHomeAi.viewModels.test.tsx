// ViewModels for Mig (profil, job, samtykke, abonnement), Hjem og AI-chat med renderHook.
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createSeedStore } from "@/mockApi/seed";
import { askAiNavigationState } from "@/shared/askAiNavigation";
import { fail } from "@/shared/result";
import { da } from "@/texts/da";
import type { AiChatState } from "@/widgets/aiChat/aiChatTypes";
import { useAiChatWidget } from "@/widgets/aiChat/useAiChatWidget";
import type { ConsentsState } from "@/widgets/consents/consentsTypes";
import { useConsentsWidget } from "@/widgets/consents/useConsentsWidget";
import { useHomeWidget } from "@/widgets/home/useHomeWidget";
import type { JobsState } from "@/widgets/jobs/jobsTypes";
import { useJobsWidget } from "@/widgets/jobs/useJobsWidget";
import { useProfileWidget } from "@/widgets/profile/useProfileWidget";
import { useSubscriptionWidget } from "@/widgets/subscription/useSubscriptionWidget";
import {
  createOverridableApiClient,
  createSeedApiClient,
  createWrapper,
} from "../testUtils/widgetTestProviders";

afterEach(() => {
  cleanup();
});

function ready<T extends { status: string }>(state: T): Extract<T, { status: "ready" }> {
  if (state.status !== "ready") {
    throw new Error(`Widgeten er ikke klar: ${state.status}`);
  }
  return state as Extract<T, { status: "ready" }>;
}

describe("useProfileWidget", () => {
  it("useProfileWidget_FirstRender_Loading", () => {
    const { result } = renderHook(() => useProfileWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    expect(result.current.status).toBe("loading");
  });

  it("useProfileWidget_Seed_ReadyWithMaja17", async () => {
    // Act
    const { result } = renderHook(() => useProfileWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(ready(result.current)).toMatchObject({ firstName: "Maja", ageText: da.me.age(17) });
  });

  it("useProfileWidget_ApiFails_ErrorWithTraceId", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/profile" ? fail("notFound", "x", { traceId: "trace-profile" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useProfileWidget(), {
      wrapper: createWrapper({ apiClient }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    const state = result.current;
    expect(state.status === "error" ? state.error : undefined).toEqual({
      errorType: "notFound",
      traceId: "trace-profile",
    });
  });
});

describe("useSubscriptionWidget", () => {
  it("useSubscriptionWidget_Seed_FreeIsCurrentWith3Of5", async () => {
    // Act
    const { result } = renderHook(() => useSubscriptionWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    const plans = ready(result.current).plans;
    expect(plans.map((plan) => plan.code)).toEqual(["free", "plus", "payPerQuestion"]);
    const free = plans.find((plan) => plan.code === "free");
    expect(free?.current).toBe(true);
    expect(free?.ctaLabel).toBeUndefined();
    expect(free?.usage).toMatchObject({ remaining: 3, total: 5, remainingPercent: 60 });
    const plus = plans.find((plan) => plan.code === "plus");
    expect(plus?.current).toBe(false);
    expect(plus?.price).toContain("29");
    expect(plus?.ctaLabel).toBe(da.subscription.select.plus);
  });

  it("useSubscriptionWidget_ApiFails_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/subscription" ? fail("serverError", "x", { traceId: "t" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useSubscriptionWidget(), {
      wrapper: createWrapper({ apiClient }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });
});

describe("useJobsWidget", () => {
  type ReadyJobs = Extract<JobsState, { status: "ready" }>;

  it("useJobsWidget_FirstRender_Loading", () => {
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    expect(result.current.status).toBe("loading");
  });

  it("useJobsWidget_Seed_ReadyWithOneJob", async () => {
    // Act
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    const jobs = ready(result.current).jobs;
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.workplace).toBe("Torvebutikken");
    expect(jobs[0]?.description).toContain("HK Handel – Butik");
  });

  it("useJobsWidget_NoJobs_ReadyWithEmptyList", async () => {
    // Arrange
    const store = createSeedStore();
    store.jobs = [];

    // Act
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(ready(result.current).jobs).toEqual([]);
  });

  it("useJobsWidget_OpenForm_FormOpenWithAgreementCatalog", async () => {
    // Arrange
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    // Act
    act(() => {
      ready(result.current).openForm();
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).form.agreements.length).toBeGreaterThan(1);
    });
    const form = ready(result.current).form;
    expect(form.open).toBe(true);
    const available = form.agreements.filter((agreement) => agreement.isAvailable);
    expect(available.map((agreement) => agreement.code)).toEqual(["hk-handel-butik"]);
  });

  it("useJobsWidget_SubmitValidJob_JobListedAndStatusMessage", async () => {
    // Arrange
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).openForm();
    });
    act(() => {
      ready(result.current).changeForm({
        workplace: "Testkiosken",
        position: "Butiksassistent",
        agreementCode: "hk-handel-butik",
      });
    });

    // Act
    act(() => {
      ready(result.current).submitForm();
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).jobs).toHaveLength(2);
    });
    const state: ReadyJobs = ready(result.current);
    expect(state.jobs.map((job) => job.workplace)).toContain("Testkiosken");
    expect(state.statusMessage).toBe(da.jobForm.saved);
    expect(state.form.open).toBe(false);
  });

  it("useJobsWidget_SubmitEmptyForm_ErrorsAndFocusOnWorkplace", async () => {
    // Arrange
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).openForm();
    });

    // Act
    act(() => {
      ready(result.current).submitForm();
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).form.focusRequest).toBeDefined();
    });
    const form = ready(result.current).form;
    expect(form.errors.workplace).toBe(da.fieldErrors.required);
    expect(form.errors.position).toBe(da.fieldErrors.required);
    expect(form.focusRequest?.field).toBe("workplace");
    expect(form.open).toBe(true);
    expect(ready(result.current).jobs).toHaveLength(1);
  });

  it("useJobsWidget_SubmitWithOnlyPositionMissing_FocusOnPosition", async () => {
    // Arrange
    const { result } = renderHook(() => useJobsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).openForm();
    });
    act(() => {
      ready(result.current).changeForm({
        workplace: "Testkiosken",
        position: "",
        agreementCode: "hk-handel-butik",
      });
    });

    // Act
    act(() => {
      ready(result.current).submitForm();
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).form.focusRequest?.field).toBe("position");
    });
    expect(ready(result.current).form.errors.workplace).toBeUndefined();
  });

  it("useJobsWidget_ApiFails_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/jobs" ? fail("serverError", "x", { traceId: "trace-jobs" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useJobsWidget(), { wrapper: createWrapper({ apiClient }) });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });
});

describe("useConsentsWidget", () => {
  type ReadyConsents = Extract<ConsentsState, { status: "ready" }>;

  it("useConsentsWidget_Seed_ConsentOff", async () => {
    // Act
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    expect(result.current.status).toBe("loading");
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(ready(result.current).sicknessConsent).toBe(false);
  });

  it("useConsentsWidget_RequestOn_TurnsOnWithoutConfirmation", async () => {
    // Arrange
    const store = createSeedStore();
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    // Act
    act(() => {
      ready(result.current).requestChange(true);
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).sicknessConsent).toBe(true);
    });
    expect(ready(result.current).confirmOpen).toBe(false);
    expect(ready(result.current).statusMessage).toBe(da.consent.enabled);
    expect(store.consents.sickness).toBe(true);
  });

  it("useConsentsWidget_RequestOff_OpensConfirmationAndKeepsConsent", async () => {
    // Arrange
    const store = createSeedStore();
    store.consents.sickness = true;
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    // Act
    act(() => {
      ready(result.current).requestChange(false);
    });

    // Assert
    const state: ReadyConsents = ready(result.current);
    expect(state.confirmOpen).toBe(true);
    expect(state.sicknessConsent).toBe(true);
    expect(store.consents.sickness).toBe(true);
  });

  it("useConsentsWidget_ConfirmOff_RemovesMarkingsAndMessageWithCount", async () => {
    // Arrange
    const store = createSeedStore();
    store.consents.sickness = true;
    for (const shift of store.shifts.slice(0, 2)) {
      shift.isSick = true;
    }
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).requestChange(false);
    });

    // Act
    act(() => {
      ready(result.current).confirmTurnOff();
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).sicknessConsent).toBe(false);
    });
    expect(ready(result.current).statusMessage).toBe(da.consent.disabled(2));
    expect(ready(result.current).confirmOpen).toBe(false);
    expect(store.shifts.filter((shift) => shift.isSick)).toEqual([]);
  });

  it("useConsentsWidget_CancelConfirmation_ConsentStaysOn", async () => {
    // Arrange
    const store = createSeedStore();
    store.consents.sickness = true;
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).requestChange(false);
    });

    // Act
    act(() => {
      ready(result.current).setConfirmOpen(false);
    });

    // Assert
    expect(ready(result.current).confirmOpen).toBe(false);
    expect(ready(result.current).sicknessConsent).toBe(true);
    expect(store.consents.sickness).toBe(true);
  });

  it("useConsentsWidget_ApiFails_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/consents" ? fail("serverError", "x", { traceId: "t" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useConsentsWidget(), {
      wrapper: createWrapper({ apiClient }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });
});

describe("useHomeWidget", () => {
  it("useHomeWidget_FirstRender_Loading", () => {
    const { result } = renderHook(() => useHomeWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    expect(result.current.status).toBe("loading");
  });

  it("useHomeWidget_Seed_ReadyWithJobAndWarning", async () => {
    // Act
    const { result } = renderHook(() => useHomeWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    const view = ready(result.current).view;
    expect(view.firstName).toBe("Maja");
    expect(view.workplace).toBe("Torvebutikken");
    expect(view.agreementName).toBe("HK Handel – Butik");
    await waitFor(() => {
      expect(ready(result.current).view.payStatus).toEqual({
        tone: "warning",
        text: da.status.possibleErrors(2),
      });
    });
  });

  it("useHomeWidget_NoJobs_EmptyWithFirstName", async () => {
    // Arrange
    const store = createSeedStore();
    store.jobs = [];

    // Act
    const { result } = renderHook(() => useHomeWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
    const state = result.current;
    expect(state.status === "empty" ? state.firstName : undefined).toBe("Maja");
  });

  it("useHomeWidget_ProfileFails_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/profile" ? fail("serverError", "x", { traceId: "t" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useHomeWidget(), { wrapper: createWrapper({ apiClient }) });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });
});

describe("useAiChatWidget", () => {
  type ReadyChat = Extract<AiChatState, { status: "ready" }>;

  it("useAiChatWidget_FirstRender_Loading", () => {
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });
    expect(result.current.status).toBe("loading");
  });

  it("useAiChatWidget_Seed_ThreeQuestionsAndQuota3Of5", async () => {
    // Act
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    const state: ReadyChat = ready(result.current);
    expect(state.questions).toHaveLength(3);
    expect(state.conversation).toEqual([]);
    await waitFor(() => {
      expect(ready(result.current).remaining).toBe(3);
    });
    expect(ready(result.current).total).toBe(5);
  });

  it("useAiChatWidget_AskQuestion_AnswerWithSourceAndQuotaNotCounted", async () => {
    // Arrange
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });
    await waitFor(() => {
      expect(ready(result.current).remaining).toBe(3);
    });
    const question = ready(result.current).questions.find((entry) => entry.id !== "question-3");

    // Act
    act(() => {
      ready(result.current).ask(question?.id ?? "");
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).conversation[0]?.answer.status).toBe("ready");
    });
    const entry = ready(result.current).conversation[0];
    expect(entry?.question).toBe(question?.text);
    const answer = entry?.answer;
    expect(answer?.status === "ready" ? answer.source.length : 0).toBeGreaterThan(0);
    expect(entry?.showEscalation).toBe(false);
    expect(ready(result.current).remaining).toBe(3);
  });

  it("useAiChatWidget_SeriousQuestion_EscalationUntilDismissed", async () => {
    // Arrange
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).ask("question-3");
    });
    await waitFor(() => {
      expect(ready(result.current).conversation[0]?.showEscalation).toBe(true);
    });
    const entryKey = ready(result.current).conversation[0]?.key ?? "";

    // Act
    act(() => {
      ready(result.current).dismissEscalation(entryKey);
    });

    // Assert
    expect(ready(result.current).conversation[0]?.showEscalation).toBe(false);
  });

  it("useAiChatWidget_OpenConsentSheet_ShowsRecipientAndWhatIsShared", async () => {
    // Arrange
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).ask("question-3");
    });
    await waitFor(() => {
      expect(ready(result.current).conversation[0]?.showEscalation).toBe(true);
    });

    // Act
    act(() => {
      ready(result.current).openConsentSheet(ready(result.current).conversation[0]?.key ?? "");
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).consentSheet.open).toBe(true);
    });
    const sheet = ready(result.current).consentSheet;
    expect(sheet.recipient).toBe(da.ai.recipient);
    expect([...sheet.notShared]).toEqual([...da.ai.consentSheet.notShared]);
    expect(sheet.shared.map((item) => item.value).join(" ")).toContain("Maja");
    expect(sheet.shared.map((item) => item.value).join(" ")).not.toMatch(/\d{6}-?\d{4}/);
  });

  it("useAiChatWidget_CloseConsentSheet_Closed", async () => {
    // Arrange
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    act(() => {
      ready(result.current).ask("question-3");
    });
    await waitFor(() => {
      expect(ready(result.current).conversation[0]?.showEscalation).toBe(true);
    });
    act(() => {
      ready(result.current).openConsentSheet(ready(result.current).conversation[0]?.key ?? "");
    });

    // Act
    act(() => {
      ready(result.current).closeConsentSheet();
    });

    // Assert
    expect(ready(result.current).consentSheet.open).toBe(false);
  });

  it.each([
    ["question-missing-sunday", "Hvorfor mangler mit søndagstillæg?"],
    ["question-missing-hours", "Hvorfor mangler der timer på min lønseddel?"],
  ])(
    "useAiChatWidget_AskQuestionIdInHistoryState%s_AsksAutomatically",
    async (questionId, questionText) => {
      // Act
      const { result } = renderHook(() => useAiChatWidget(), {
        wrapper: createWrapper({
          apiClient: createSeedApiClient(),
          initialEntries: [{ pathname: "/ai", state: askAiNavigationState(questionId) }],
        }),
      });

      // Assert
      await waitFor(() => {
        expect(ready(result.current).conversation[0]?.answer.status).toBe("ready");
      });
      expect(ready(result.current).conversation).toHaveLength(1);
      expect(ready(result.current).conversation[0]?.question).toBe(questionText);
    },
  );

  it("useAiChatWidget_UnknownQuestionIdInHistoryState_NoAutomaticQuestionAndNoCrash", async () => {
    // Act
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({
        apiClient: createSeedApiClient(),
        initialEntries: [{ pathname: "/ai", state: askAiNavigationState("question-findes-ikke") }],
      }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    const conversation = ready(result.current).conversation;
    const answerStatuses = conversation.map((entry) => entry.answer.status);
    expect(answerStatuses.every((status) => status !== "ready")).toBe(true);
  });

  it("useAiChatWidget_AnswerFails_EntryShowsDanishError", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path.endsWith("/answer")
        ? fail("serverError", "Internal", { traceId: "t" })
        : undefined,
    );
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient, initialEntries: ["/ai"] }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    // Act
    act(() => {
      ready(result.current).ask(ready(result.current).questions[0]?.id ?? "");
    });

    // Assert
    await waitFor(() => {
      expect(ready(result.current).conversation[0]?.answer.status).toBe("error");
    });
    const answer = ready(result.current).conversation[0]?.answer;
    expect(answer?.status === "error" ? answer.text : "").not.toContain("Internal");
  });

  it("useAiChatWidget_QuestionsFail_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/chat/questions" ? fail("serverError", "x", { traceId: "t" }) : undefined,
    );

    // Act
    const { result } = renderHook(() => useAiChatWidget(), {
      wrapper: createWrapper({ apiClient, initialEntries: ["/ai"] }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });
});
