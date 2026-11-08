import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { useClock } from "@/app/clock/useClock";
import type { ShiftData } from "@/shared/apiSchemas";
import {
  formatDate,
  formatHours,
  formatKr,
  formatMonthName,
  formatTimeRange,
  weekdayShort,
} from "@/shared/format";
import { addMonths, dayOfDate, monthOfDate, parseIsoMonth, toIsoDate } from "@/shared/month";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { supplementLabel } from "@/shared/supplementText";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchJobs, fetchShiftMonth } from "./shiftCalendarApi";
import { newShiftDate, shiftDaysOf, shiftsOnDay } from "./shiftCalendarCalculations";
import type { ShiftCalendarState, ShiftItemView } from "./shiftCalendarTypes";

// ViewModel for vagtkalenderen. Kalenderen starter i demodatoens måned. Ved skift af måned eller
// job beholdes de forrige data som pladsholder, så kalenderen ikke forsvinder; de vises dog ikke
// (ingen gamle vagtdage eller beløb), og listen viser indlæsning, til den nye måned er hentet.

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

function toShiftItem(shift: ShiftData): ShiftItemView {
  const supplementTexts = shift.supplements.map((line) => ({
    label: supplementLabel(line.kind, line.minutes),
    amountText: formatKr(line.amountOere),
  }));
  return {
    id: shift.id,
    title: `${weekdayShort(shift.date)} ${formatDate(shift.date)}`,
    date: shift.date,
    start: shift.start,
    end: shift.end,
    pauseMinutes: shift.pauseMinutes,
    paidMinutes: shift.paidMinutes,
    expectedPayOere: shift.expectedPayOere,
    isSick: shift.isSick,
    supplementLabels: supplementTexts.map((line) => line.label),
    timeRangeText: formatTimeRange(shift.start, shift.end),
    hoursText: da.units.hoursValue(formatHours(shift.paidMinutes)),
    pauseText:
      shift.pauseMinutes > 0 ? da.shifts.item.pause(shift.pauseMinutes) : da.shiftDetails.noPause,
    expectedPayText: formatKr(shift.expectedPayOere),
    supplementsText:
      supplementTexts.length === 0
        ? da.shiftDetails.noSupplements
        : supplementTexts.map((line) => `${line.label} (${line.amountText})`).join(", "),
  };
}

export function useShiftCalendarWidget(): ShiftCalendarState {
  const apiClient = useApiClient();
  const todayIso = useClock().today();
  const [chosenJobId, setChosenJobId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState(monthOfDate(todayIso));
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  // Den sidst åbnede vagt beholdes, mens arket lukker, så indholdet ikke forsvinder i animationen.
  const [openShiftId, setOpenShiftId] = useState<string | undefined>(undefined);
  const [shiftDetailsOpen, setShiftDetailsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [addShiftOpen, setAddShiftOpen] = useState(false);
  // Ny key ved hver åbning, så formularen i arket starter forfra.
  const [addShiftKey, setAddShiftKey] = useState(0);

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async ({ signal }) => unwrap(await fetchJobs(apiClient, signal)),
  });
  const jobs = jobsQuery.data ?? [];
  const selectedJob = jobs.find((job) => job.id === chosenJobId) ?? jobs[0];
  const jobId = selectedJob?.id ?? "";

  const shiftsQuery = useQuery({
    queryKey: queryKeys.shifts(jobId, month),
    queryFn: async ({ signal }) => unwrap(await fetchShiftMonth(apiClient, jobId, month, signal)),
    enabled: selectedJob !== undefined,
    placeholderData: keepPreviousData,
  });

  const failedError = jobsQuery.error ?? shiftsQuery.error;
  if (failedError !== null) {
    return {
      status: "error",
      error: toWidgetError(failedError),
      retry: () => {
        void jobsQuery.refetch();
        // Vagterne hentes kun igen, når der er et job (ellers er forespørgslen slået fra).
        if (selectedJob !== undefined) {
          void shiftsQuery.refetch();
        }
      },
    };
  }
  if (jobsQuery.data === undefined) {
    return { status: "loading" };
  }
  if (selectedJob === undefined) {
    return { status: "empty" };
  }
  const yearMonth = parseIsoMonth(month);
  if (shiftsQuery.data === undefined || yearMonth === undefined) {
    return { status: "loading" };
  }

  // Pladsholderdata hører til den forrige måned eller det forrige job og vises ikke.
  const isLoadingMonth = shiftsQuery.isPlaceholderData;
  const shiftMonth = isLoadingMonth ? undefined : shiftsQuery.data;
  const allShifts = (shiftMonth?.shifts ?? []).map(toShiftItem);
  const visibleShifts = shiftsOnDay(allShifts, selectedDay);
  const monthName = formatMonthName(month);
  const listTitle =
    selectedDay === undefined
      ? da.shifts.listTitle(monthName)
      : da.shifts.dayListTitle(
          formatDate(toIsoDate(yearMonth.year, yearMonth.month, selectedDay), false),
        );

  const changeMonth = (delta: number): void => {
    setMonth(addMonths(month, delta));
    setSelectedDay(undefined);
  };

  return {
    status: "ready",
    jobOptions: jobs.map((job) => ({ value: job.id, label: `${job.workplace} · ${job.position}` })),
    selectedJobId: selectedJob.id,
    calendar: {
      year: yearMonth.year,
      month: yearMonth.month,
      shiftDays: shiftDaysOf(shiftMonth?.shifts ?? []),
      selectedDay,
      today: monthOfDate(todayIso) === month ? dayOfDate(todayIso) : undefined,
    },
    monthName,
    listTitle,
    isLoadingMonth,
    shifts: visibleShifts,
    isDayFiltered: selectedDay !== undefined,
    hasShiftsInMonth: allShifts.length > 0,
    totalHoursText: da.units.hoursValue(formatHours(shiftMonth?.totalPaidMinutes ?? 0)),
    totalPayText: formatKr(shiftMonth?.totalExpectedPayOere ?? 0),
    newShiftDate: newShiftDate(yearMonth.year, yearMonth.month, selectedDay, todayIso),
    openShift: allShifts.find((shift) => shift.id === openShiftId),
    statusMessage,
    addShiftOpen,
    addShiftKey,
    openAddShift: () => {
      setAddShiftKey(addShiftKey + 1);
      setAddShiftOpen(true);
    },
    setAddShiftOpen,
    selectJob: (nextJobId) => {
      setChosenJobId(nextJobId);
      setSelectedDay(undefined);
    },
    selectDay: setSelectedDay,
    showPreviousMonth: () => {
      changeMonth(-1);
    },
    showNextMonth: () => {
      changeMonth(1);
    },
    shiftDetailsOpen,
    openShiftDetails: (shiftId) => {
      setOpenShiftId(shiftId);
      setShiftDetailsOpen(true);
    },
    closeShiftDetails: () => {
      setShiftDetailsOpen(false);
    },
    shiftSaved: (savedDate) => {
      setAddShiftOpen(false);
      setMonth(monthOfDate(savedDate));
      setSelectedDay(undefined);
      setStatusMessage(da.shiftForm.saved);
    },
  };
}
