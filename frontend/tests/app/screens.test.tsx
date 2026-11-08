// Skærme og widgets i RTL med providere: fokus efter "Ikke nu", fejlisolation mellem widgets og
// concurrency ved hurtige månedsskift (kun svaret for den seneste forespørgsel vises).
import { act, cleanup, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MeScreen } from "@/app/screens/MeScreen";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { ApiRequest } from "@/shared/apiClient";
import { fail, ok, type Result } from "@/shared/result";
import { da } from "@/texts/da";
import { AiChatWidget } from "@/widgets/aiChat/AiChatWidget";
import type { PayCheckState } from "@/widgets/payCheck/payCheckTypes";
import { usePayCheckWidget } from "@/widgets/payCheck/usePayCheckWidget";
import type { ShiftCalendarState } from "@/widgets/shiftCalendar/shiftCalendarTypes";
import { useShiftCalendarWidget } from "@/widgets/shiftCalendar/useShiftCalendarWidget";
import { expectSuccess } from "../testUtils/resultAssertions";
import {
  createDeferred,
  createOverridableApiClient,
  createSeedApiClient,
  createWrapper,
  type Deferred,
} from "../testUtils/widgetTestProviders";

beforeEach(() => {
  // En fejlende widget logger via React. Det er forventet i fejlisolationstestene.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AiChatWidget", () => {
  it("AiChatWidget_LaterOnEscalation_FocusMovesToAnswer", async () => {
    // Arrange
    const user = userEvent.setup();
    const store = createSeedStore();
    const serious = store.chatQuestions.find((question) => question.id === "question-3");
    if (serious === undefined) {
      throw new Error("Seed mangler question-3");
    }
    const Wrapper = createWrapper({
      apiClient: createSeedApiClient(store),
      initialEntries: ["/ai"],
    });
    render(
      <Wrapper>
        <AiChatWidget />
      </Wrapper>,
    );
    await user.click(await screen.findByRole("button", { name: serious.question }));
    const later = await screen.findByRole("button", { name: da.ai.escalation.later });

    // Act
    await user.click(later);

    // Assert
    expect(screen.queryByRole("button", { name: da.ai.escalation.later })).not.toBeInTheDocument();
    const focused = document.activeElement;
    expect(focused).not.toBe(document.body);
    expect(focused?.textContent ?? "").toContain(serious.answer.slice(0, 30));
  });

  it("AiChatWidget_QuestionChipClicked_QuestionAnswerSourceAndDisclaimerShown", async () => {
    // Arrange
    const user = userEvent.setup();
    const store = createSeedStore();
    const question = store.chatQuestions[0];
    if (question === undefined) {
      throw new Error("Seed mangler spørgsmål");
    }
    const Wrapper = createWrapper({
      apiClient: createSeedApiClient(store),
      initialEntries: ["/ai"],
    });
    render(
      <Wrapper>
        <AiChatWidget />
      </Wrapper>,
    );

    // Act
    await user.click(await screen.findByRole("button", { name: question.question }));

    // Assert
    expect(await screen.findByText(question.answer)).toBeInTheDocument();
    expect(document.body.textContent).toContain(question.source);
    expect(document.body.textContent).toContain(da.ai.disclaimer);
  });

  it("AiChatWidget_SendFreeText_OpensNotImplemented", async () => {
    // Arrange
    const user = userEvent.setup();
    const Wrapper = createWrapper({ apiClient: createSeedApiClient(), initialEntries: ["/ai"] });
    render(
      <Wrapper>
        <AiChatWidget />
      </Wrapper>,
    );
    await user.type(
      await screen.findByLabelText(da.ai.input.label),
      "Hvornår skal jeg have pause?",
    );

    // Act
    await user.click(screen.getByRole("button", { name: da.ai.input.send }));

    // Assert
    expect(screen.getByRole("dialog", { name: da.notImplemented.title })).toBeInTheDocument();
  });
});

describe("MeScreen – fejlisolation", () => {
  it("MeScreen_SubscriptionFails_OtherWidgetsStillShown", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/subscription"
        ? fail("serverError", "Intern fejl", { traceId: "trace-sub" })
        : undefined,
    );
    const Wrapper = createWrapper({ apiClient, initialEntries: ["/mig"] });

    // Act
    render(
      <Wrapper>
        <MeScreen />
      </Wrapper>,
    );

    // Assert
    expect(await screen.findByText(da.errors.loadTitle)).toBeInTheDocument();
    expect(await screen.findByText("Maja")).toBeInTheDocument();
    expect(await screen.findByText("Torvebutikken")).toBeInTheDocument();
    expect(
      await screen.findByRole("switch", { name: da.consent.sicknessLabel }),
    ).toBeInTheDocument();
    expect(document.body.textContent).toContain("trace-sub");
    expect(document.body.textContent).not.toContain("Intern fejl");
  });

  it("MeScreen_JobsReturnInvalidData_OtherWidgetsStillShown", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/jobs" ? ok([{ id: 42 }]) : undefined,
    );
    const Wrapper = createWrapper({ apiClient, initialEntries: ["/mig"] });

    // Act
    render(
      <Wrapper>
        <MeScreen />
      </Wrapper>,
    );

    // Assert
    expect(await screen.findByText(da.errors.loadTitle)).toBeInTheDocument();
    expect(await screen.findByText("Maja")).toBeInTheDocument();
    expect(await screen.findByText(da.subscription.names.plus)).toBeInTheDocument();
  });

  it("MeScreen_ErrorRetry_RecoversWidget", async () => {
    // Arrange
    const user = userEvent.setup();
    let failing = true;
    const apiClient = createOverridableApiClient((request) =>
      failing && request.path === "/profile"
        ? fail("serverError", "x", { traceId: "t" })
        : undefined,
    );
    const Wrapper = createWrapper({ apiClient, initialEntries: ["/mig"] });
    render(
      <Wrapper>
        <MeScreen />
      </Wrapper>,
    );
    const errorTitle = await screen.findByText(da.errors.loadTitle);
    const errorRegion = errorTitle.closest("section, div") ?? document.body;
    failing = false;

    // Act
    await user.click(
      within(errorRegion as HTMLElement).getByRole("button", { name: da.common.retry }),
    );

    // Assert
    expect(await screen.findByText("Maja")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(da.errors.loadTitle)).not.toBeInTheDocument();
    });
  });
});

describe("concurrency – hurtige månedsskift", () => {
  type MonthDeferreds = Record<string, Deferred<Result<unknown>>>;

  function delayedMonths(
    months: readonly string[],
    pathPart: string,
  ): {
    deferreds: MonthDeferreds;
    requests: ApiRequest[];
    client: ReturnType<typeof createOverridableApiClient>;
  } {
    const deferreds: MonthDeferreds = {};
    for (const month of months) {
      deferreds[month] = createDeferred<Result<unknown>>();
    }
    const client = createOverridableApiClient((request) => {
      const month = months.find((candidate) =>
        request.path.includes(`${pathPart}?month=${candidate}`),
      );
      return month === undefined ? undefined : deferreds[month]?.promise;
    });
    return { deferreds, requests: client.requests, client };
  }

  async function octoberPayload(path: string): Promise<unknown> {
    const reference = createMockApiClient({ delayMs: 0, store: createSeedStore() });
    return expectSuccess(await reference.request({ method: "GET", path }));
  }

  function readyPay(state: PayCheckState): Extract<PayCheckState, { status: "ready" }> {
    if (state.status !== "ready") {
      throw new Error(state.status);
    }
    return state;
  }

  function readyCalendar(
    state: ShiftCalendarState,
  ): Extract<ShiftCalendarState, { status: "ready" }> {
    if (state.status !== "ready") {
      throw new Error(state.status);
    }
    return state;
  }

  it("payCheck_OlderMonthAnswersLast_NewestMonthStillShown", async () => {
    // Arrange
    const { deferreds, client } = delayedMonths(["2026-11", "2026-12"], "/pay-check");
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: client }),
    });
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });
    act(() => {
      readyPay(result.current).showNextMonth();
    });
    act(() => {
      readyPay(result.current).showNextMonth();
    });
    const checkedPayload = {
      ...((await octoberPayload("/jobs/job-1/pay-check?month=2026-10")) as Record<string, unknown>),
      month: "2026-11",
    };

    // Act
    await act(async () => {
      deferreds["2026-12"]?.resolve(ok({ status: "noPayslip", jobId: "job-1", month: "2026-12" }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("noPayslip");
    });
    await act(async () => {
      deferreds["2026-11"]?.resolve(ok(checkedPayload));
      await Promise.resolve();
    });

    // Assert
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(readyPay(result.current).monthTitle).toContain("december");
    expect(readyPay(result.current).result.kind).toBe("noPayslip");
  });

  it("payCheck_MonthSkippedWhileLoading_OlderRequestIsAborted", async () => {
    // Arrange
    const { client } = delayedMonths(["2026-11", "2026-12"], "/pay-check");
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: client }),
    });
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });

    // Act
    act(() => {
      readyPay(result.current).showNextMonth();
    });
    act(() => {
      readyPay(result.current).showNextMonth();
    });

    // Assert
    const novemberRequest = client.requests.find((request) =>
      request.path.includes("month=2026-11"),
    );
    await waitFor(() => {
      expect(novemberRequest?.signal?.aborted).toBe(true);
    });
  });

  it("shiftCalendar_OlderMonthAnswersLast_NewestMonthStillShown", async () => {
    // Arrange
    const { deferreds, client } = delayedMonths(["2026-11", "2026-12"], "/shifts");
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: client }),
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });
    act(() => {
      readyCalendar(result.current).showNextMonth();
    });
    act(() => {
      readyCalendar(result.current).showNextMonth();
    });
    const octoberMonth = (await octoberPayload("/jobs/job-1/shifts?month=2026-10")) as Record<
      string,
      unknown
    >;

    // Act
    await act(async () => {
      deferreds["2026-12"]?.resolve(
        ok({
          jobId: "job-1",
          month: "2026-12",
          shifts: [],
          totalPaidMinutes: 0,
          totalExpectedPayOere: 0,
        }),
      );
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).isLoadingMonth).toBe(false);
    });
    await act(async () => {
      deferreds["2026-11"]?.resolve(ok({ ...octoberMonth, month: "2026-11" }));
      await Promise.resolve();
    });

    // Assert
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(readyCalendar(result.current).calendar.month).toBe(12);
    expect(readyCalendar(result.current).shifts).toEqual([]);
  });
});
