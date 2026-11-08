// ViewModels for Løn, Vagter, Tilføj vagt og Sygdom med renderHook. Tilstandene loading, error,
// empty og ready, og at mutationer opdaterer de andre widgets live (samme QueryClient).
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import { fail } from "@/shared/result";
import { da } from "@/texts/da";
import { usePayCheckWidget } from "@/widgets/payCheck/usePayCheckWidget";
import type { PayCheckState } from "@/widgets/payCheck/payCheckTypes";
import { useShiftCalendarWidget } from "@/widgets/shiftCalendar/useShiftCalendarWidget";
import type { ShiftCalendarState } from "@/widgets/shiftCalendar/shiftCalendarTypes";
import { useShiftRegistrationWidget } from "@/widgets/shiftRegistration/useShiftRegistrationWidget";
import { useSicknessWidget } from "@/widgets/sickness/useSicknessWidget";
import {
  createOverridableApiClient,
  createSeedApiClient,
  createTestQueryClient,
  createWrapper,
} from "../testUtils/widgetTestProviders";

afterEach(() => {
  cleanup();
});

const noBreakSpace = String.fromCharCode(0xa0);
function text(value: string): string {
  return value.replaceAll(noBreakSpace, " ");
}

type ReadyPayCheck = Extract<PayCheckState, { status: "ready" }>;
type ReadyCalendar = Extract<ShiftCalendarState, { status: "ready" }>;

function readyPay(state: PayCheckState): ReadyPayCheck {
  if (state.status !== "ready") {
    throw new Error(`Løntjekket er ikke klar: ${state.status}`);
  }
  return state;
}

function readyCalendar(state: ShiftCalendarState): ReadyCalendar {
  if (state.status !== "ready") {
    throw new Error(`Vagtkalenderen er ikke klar: ${state.status}`);
  }
  return state;
}

function checkedResult(
  state: PayCheckState,
): Extract<ReadyPayCheck["result"], { kind: "checked" }> {
  const result = readyPay(state).result;
  if (result.kind !== "checked") {
    throw new Error(`Løntjekket viser ${result.kind}`);
  }
  return result;
}

describe("usePayCheckWidget", () => {
  it("usePayCheckWidget_FirstRender_Loading", () => {
    // Act
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    expect(result.current.status).toBe("loading");
  });

  it("usePayCheckWidget_SeedOctober_ReadyWithTwoPossibleErrors", async () => {
    // Arrange
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Act
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });

    // Assert
    const ready = readyPay(result.current);
    expect(ready.selectedJobId).toBe("job-1");
    expect(ready.jobOptions.map((option) => option.value)).toEqual(["job-1"]);
    const checked = checkedResult(result.current);
    expect(checked.summary).toMatchObject({
      expectedOere: 283875,
      paidOere: 243000,
      differenceOere: 40875,
      issueCount: 2,
      issuesTotalOere: 40875,
    });
  });

  it("usePayCheckWidget_SeedOctober_DeviationsAskAiAboutSundayAndHours", async () => {
    // Arrange
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Act
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });

    // Assert
    const deviations = checkedResult(result.current).deviations;
    const sunday = deviations.find((deviation) => deviation.title === "Søndagstillæg mangler");
    const hours = deviations.find((deviation) => deviation.title === "Timer mangler");
    expect(sunday?.amountOere).toBe(27000);
    expect(sunday?.askAiQuestionId).toBe("question-missing-sunday");
    expect(hours?.amountOere).toBe(13875);
    expect(hours?.askAiQuestionId).toBe("question-missing-hours");
  });

  it("usePayCheckWidget_SeedOctober_PayslipIsMasked", async () => {
    // Arrange
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Act
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });

    // Assert
    const payslip = checkedResult(result.current).payslip;
    expect(payslip.cprMasked).not.toMatch(/\d{6}-?\d{4}/);
    expect(text(payslip.grossPayText)).toContain("2.430,00 kr.");
  });

  it("usePayCheckWidget_NextMonth_NoPayslipWithoutOldData", async () => {
    // Arrange: forsinkelse, så den nye måned er ved at blive hentet lige efter skiftet
    const apiClient = createMockApiClient({ delayMs: 40, store: createSeedStore() });
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient }),
    });
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("checked");
    });

    // Act
    act(() => {
      readyPay(result.current).showNextMonth();
    });
    const kindRightAfterSwitch = readyPay(result.current).result.kind;

    // Assert
    expect(kindRightAfterSwitch).toBe("loading");
    expect(readyPay(result.current).monthTitle).toContain("november");
    await waitFor(() => {
      expect(readyPay(result.current).result.kind).toBe("noPayslip");
    });
  });

  it("usePayCheckWidget_NoJobs_Empty", async () => {
    // Arrange
    const store = createSeedStore();
    store.jobs = [];

    // Act
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
  });

  it("usePayCheckWidget_JobsFail_ErrorWithTraceIdAndRetryRecovers", async () => {
    // Arrange
    let failing = true;
    const apiClient = createOverridableApiClient((request) =>
      failing && request.path === "/jobs"
        ? fail("serverError", "Fejl", { traceId: "trace-pay" })
        : undefined,
    );
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient }),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    const errorState = result.current;
    if (errorState.status !== "error") {
      throw new Error("Forventede fejl");
    }
    expect(errorState.error).toEqual({ errorType: "serverError", traceId: "trace-pay" });
    failing = false;

    // Act
    act(() => {
      errorState.retry();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
  });

  it("usePayCheckWidget_InvalidPayCheckData_ShowsInvalidResponseError", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path.includes("/pay-check")
        ? { success: true, data: { status: "checked" } }
        : undefined,
    );

    // Act
    const { result } = renderHook(() => usePayCheckWidget(), {
      wrapper: createWrapper({ apiClient }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    const state = result.current;
    expect(state.status === "error" ? state.error.errorType : undefined).toBe("invalidResponse");
  });
});

describe("useShiftCalendarWidget", () => {
  it("useShiftCalendarWidget_FirstRender_Loading", () => {
    // Act
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Assert
    expect(result.current.status).toBe("loading");
  });

  it("useShiftCalendarWidget_SeedOctober_ReadyWithCalendarAndTotals", async () => {
    // Arrange
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });

    // Act
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });

    // Assert
    const ready = readyCalendar(result.current);
    expect(ready.calendar).toMatchObject({ year: 2026, month: 10, today: 31 });
    expect([...ready.calendar.shiftDays]).toEqual([6, 8, 10, 11, 14]);
    expect(ready.selectedJobId).toBe("job-1");
    expect(ready.hasShiftsInMonth).toBe(true);
    expect(ready.isDayFiltered).toBe(false);
    expect(ready.totalHoursText).toContain("25,5");
    expect(text(ready.totalPayText)).toBe("2.838,75 kr.");
  });

  it("useShiftCalendarWidget_SundayShift_DetailsAndSupplementLabel", async () => {
    // Arrange
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });
    const sunday = readyCalendar(result.current).shifts.find((s) => s.date === "2026-10-11");

    // Act
    act(() => {
      readyCalendar(result.current).openShiftDetails(sunday?.id ?? "");
    });

    // Assert
    const ready = readyCalendar(result.current);
    expect(ready.shiftDetailsOpen).toBe(true);
    expect(ready.openShift?.id).toBe(sunday?.id);
    expect(ready.openShift?.title).toContain("11. okt.");
    expect(ready.openShift?.isSick).toBe(false);
    expect(text(ready.openShift?.expectedPayText ?? "")).toBe("825,00 kr.");
    expect(ready.openShift?.supplementLabels).toHaveLength(1);
  });

  it("useShiftCalendarWidget_SelectDay_FiltersShiftsAndNewShiftDate", async () => {
    // Arrange
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });

    // Act
    act(() => {
      readyCalendar(result.current).selectDay(11);
    });

    // Assert
    const ready = readyCalendar(result.current);
    expect(ready.isDayFiltered).toBe(true);
    expect(ready.shifts.map((shift) => shift.date)).toEqual(["2026-10-11"]);
    expect(ready.calendar.selectedDay).toBe(11);
    expect(ready.newShiftDate).toBe("2026-10-11");
  });

  it("useShiftCalendarWidget_SelectDayWithoutShifts_EmptyDayList", async () => {
    // Arrange
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });

    // Act
    act(() => {
      readyCalendar(result.current).selectDay(12);
    });

    // Assert
    expect(readyCalendar(result.current).shifts).toEqual([]);
    expect(readyCalendar(result.current).hasShiftsInMonth).toBe(true);
  });

  it("useShiftCalendarWidget_NextMonth_DoesNotShowOctoberShifts", async () => {
    // Arrange
    const apiClient = createMockApiClient({ delayMs: 40, store: createSeedStore() });
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient }),
    });
    await waitFor(() => {
      expect(readyCalendar(result.current).shifts).toHaveLength(5);
    });

    // Act
    act(() => {
      readyCalendar(result.current).showNextMonth();
    });

    // Assert
    const rightAfter = readyCalendar(result.current);
    expect(rightAfter.calendar.month).toBe(11);
    expect(rightAfter.isLoadingMonth || rightAfter.shifts.length === 0).toBe(true);
    expect(rightAfter.shifts.some((shift) => shift.date.startsWith("2026-10"))).toBe(false);
    await waitFor(() => {
      expect(readyCalendar(result.current).isLoadingMonth).toBe(false);
    });
    expect(readyCalendar(result.current).hasShiftsInMonth).toBe(false);
    expect(readyCalendar(result.current).calendar.today).toBeUndefined();
    expect(readyCalendar(result.current).newShiftDate).toBe("2026-11-01");
  });

  it("useShiftCalendarWidget_NoJobs_Empty", async () => {
    // Arrange
    const store = createSeedStore();
    store.jobs = [];

    // Act
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
  });

  it("useShiftCalendarWidget_JobsFail_Error", async () => {
    // Arrange
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/jobs"
        ? fail("serviceUnavailable", "Nede", { traceId: "trace-cal" })
        : undefined,
    );

    // Act
    const { result } = renderHook(() => useShiftCalendarWidget(), {
      wrapper: createWrapper({ apiClient }),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    const state = result.current;
    expect(state.status === "error" ? state.error.traceId : undefined).toBe("trace-cal");
  });
});

describe("useShiftRegistrationWidget", () => {
  const options = {
    jobOptions: [{ value: "job-1", label: "Torvebutikken" }],
    defaultJobId: "job-1",
    defaultDate: "2026-10-19",
  };

  it("useShiftRegistrationWidget_Start_DefaultsAndPendingSummary", () => {
    // Act
    const { result } = renderHook(
      () => useShiftRegistrationWidget({ ...options, onSaved: vi.fn() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient() }) },
    );

    // Assert
    expect(result.current.values.jobId).toBe("job-1");
    expect(result.current.values.date).toBe("2026-10-19");
    expect(result.current.summary.status).toBe("pending");
    expect(result.current.errors).toEqual({});
  });

  it("useShiftRegistrationWidget_CompleteValues_SummaryShowsExpectedPay", async () => {
    // Arrange
    const { result } = renderHook(
      () => useShiftRegistrationWidget({ ...options, onSaved: vi.fn() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient() }) },
    );

    // Act
    act(() => {
      result.current.change({
        jobId: "job-1",
        date: "2026-10-19",
        start: "10:00",
        end: "14:00",
        pause: "30",
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.summary.status).toBe("ready");
    });
    expect(text(result.current.summary.text)).toContain("370,00 kr.");
  });

  it("useShiftRegistrationWidget_InvalidTimes_SummaryInvalid", async () => {
    // Arrange
    const { result } = renderHook(
      () => useShiftRegistrationWidget({ ...options, onSaved: vi.fn() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient() }) },
    );

    // Act
    act(() => {
      result.current.change({
        jobId: "job-1",
        date: "2026-10-19",
        start: "14:00",
        end: "10:00",
        pause: "0",
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.summary.status).toBe("invalid");
    });
  });

  it("useShiftRegistrationWidget_SubmitValid_CallsOnSavedWithDate", async () => {
    // Arrange
    const onSaved = vi.fn();
    const { result } = renderHook(() => useShiftRegistrationWidget({ ...options, onSaved }), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    act(() => {
      result.current.change({
        jobId: "job-1",
        date: "2026-10-19",
        start: "10:00",
        end: "14:00",
        pause: "0",
      });
    });

    // Act
    act(() => {
      result.current.submit();
    });

    // Assert
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("2026-10-19");
    });
  });

  it("useShiftRegistrationWidget_SubmitEndBeforeStart_ErrorOnEndAndFocusRequest", async () => {
    // Arrange
    const onSaved = vi.fn();
    const { result } = renderHook(() => useShiftRegistrationWidget({ ...options, onSaved }), {
      wrapper: createWrapper({ apiClient: createSeedApiClient() }),
    });
    act(() => {
      result.current.change({
        jobId: "job-1",
        date: "2026-10-19",
        start: "14:00",
        end: "10:00",
        pause: "0",
      });
    });

    // Act
    act(() => {
      result.current.submit();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.errors.end).toBe(da.fieldErrors.endNotAfterStart);
    });
    expect(result.current.focusRequest?.field).toBe("end");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("useShiftRegistrationWidget_SubmitOverlapAndBadPause_FocusOnFirstFieldInFormOrder", async () => {
    // Arrange: seedens vagt 6/10 16–20 overlapper, og pausen er for lang
    const { result } = renderHook(
      () => useShiftRegistrationWidget({ ...options, onSaved: vi.fn() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient() }) },
    );
    act(() => {
      result.current.change({
        jobId: "job-1",
        date: "2026-10-06",
        start: "17:00",
        end: "19:00",
        pause: "130",
      });
    });

    // Act
    act(() => {
      result.current.submit();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.focusRequest).toBeDefined();
    });
    expect(result.current.errors.pause).toBe(da.fieldErrors.pauseOutOfRange);
    expect(result.current.focusRequest?.field).toBe("pause");
  });

  it("useShiftRegistrationWidget_SubmitTwiceWithError_NewFocusToken", async () => {
    // Arrange
    const { result } = renderHook(
      () => useShiftRegistrationWidget({ ...options, onSaved: vi.fn() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient() }) },
    );
    act(() => {
      result.current.change({ jobId: "job-1", date: "2026-10-19", start: "", end: "", pause: "" });
    });
    act(() => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.focusRequest).toBeDefined();
    });
    const firstToken = result.current.focusRequest?.token;

    // Act
    act(() => {
      result.current.submit();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.focusRequest?.token).not.toBe(firstToken);
    });
    expect(result.current.focusRequest?.field).toBe("start");
  });
});

describe("live: ny vagt og sygdom", () => {
  it("createShift_NewOctoberShift_CalendarAndPayCheckUpdate", async () => {
    // Arrange
    const wrapper = createWrapper({
      apiClient: createSeedApiClient(),
      queryClient: createTestQueryClient(),
    });
    const onSaved = vi.fn();
    const { result } = renderHook(
      () => ({
        calendar: useShiftCalendarWidget(),
        pay: usePayCheckWidget(),
        registration: useShiftRegistrationWidget({
          jobOptions: [{ value: "job-1", label: "Torvebutikken" }],
          defaultJobId: "job-1",
          defaultDate: "2026-10-19",
          onSaved,
        }),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.expectedOere).toBe(283875);
      expect(readyCalendar(result.current.calendar).shifts).toHaveLength(5);
    });
    act(() => {
      result.current.registration.change({
        jobId: "job-1",
        date: "2026-10-19",
        start: "10:00",
        end: "14:00",
        pause: "0",
      });
    });

    // Act
    act(() => {
      result.current.registration.submit();
    });

    // Assert
    await waitFor(() => {
      expect(readyCalendar(result.current.calendar).shifts).toHaveLength(6);
    });
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.expectedOere).toBe(283875 + 37000);
    });
    expect(text(readyCalendar(result.current.calendar).totalPayText)).toBe("3.208,75 kr.");
  });

  it("markSick_ConsentOff_ConsentRequiredAndNothingMarked", async () => {
    // Arrange
    const store = createSeedStore();
    const sunday = store.shifts.find((shift) => shift.date === "2026-10-11");
    const { result } = renderHook(() => useSicknessWidget(sunday?.id ?? ""), {
      wrapper: createWrapper({ apiClient: createSeedApiClient(store) }),
    });
    await waitFor(() => {
      expect(result.current.busy).toBe(false);
    });

    // Act
    act(() => {
      result.current.markSick();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.consentRequired).toBe(true);
    });
    expect(result.current.consentGranted).toBe(false);
    expect(store.shifts.find((shift) => shift.id === sunday?.id)?.isSick).toBe(false);
  });

  it("markSick_AfterGrantConsent_PayCheckShowsOneErrorOf13875", async () => {
    // Arrange
    const store = createSeedStore();
    const sundayId = store.shifts.find((shift) => shift.date === "2026-10-11")?.id ?? "";
    const { result } = renderHook(
      () => ({ sickness: useSicknessWidget(sundayId), pay: usePayCheckWidget() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient(store) }) },
    );
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.issueCount).toBe(2);
    });
    act(() => {
      result.current.sickness.markSick();
    });
    await waitFor(() => {
      expect(result.current.sickness.consentRequired).toBe(true);
    });
    act(() => {
      result.current.sickness.grantConsent();
    });
    await waitFor(() => {
      expect(result.current.sickness.consentGranted).toBe(true);
    });

    // Act
    act(() => {
      result.current.sickness.markSick();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.sickness.message).toBe(da.shiftDetails.markedSick);
    });
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.issuesTotalOere).toBe(13875);
    });
    expect(checkedResult(result.current.pay).summary.issueCount).toBe(1);
    expect(checkedResult(result.current.pay).summary.expectedOere).toBe(256875);
  });

  it("unmarkSick_SickShift_MessageAndPayCheckBack", async () => {
    // Arrange
    const store = createSeedStore();
    store.consents.sickness = true;
    const sunday = store.shifts.find((shift) => shift.date === "2026-10-11");
    if (sunday === undefined) {
      throw new Error("Seed har ingen søndagsvagt");
    }
    sunday.isSick = true;
    const { result } = renderHook(
      () => ({ sickness: useSicknessWidget(sunday.id), pay: usePayCheckWidget() }),
      { wrapper: createWrapper({ apiClient: createSeedApiClient(store) }) },
    );
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.issuesTotalOere).toBe(13875);
    });

    // Act
    act(() => {
      result.current.sickness.unmarkSick();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.sickness.message).toBe(da.shiftDetails.unmarkedSick);
    });
    await waitFor(() => {
      expect(checkedResult(result.current.pay).summary.issuesTotalOere).toBe(40875);
    });
  });
});
