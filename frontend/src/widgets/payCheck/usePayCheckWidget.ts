import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { useClock } from "@/app/clock/useClock";
import type { PayCheckData, PossibleErrorData } from "@/shared/apiSchemas";
import { formatDate, formatHours, formatKr, formatMonth, weekdayShort } from "@/shared/format";
import { addMonths, monthOfDate } from "@/shared/month";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchJobs, fetchPayCheck } from "./payCheckApi";
import { categoryLineFor, followUpQuestionId } from "./payCheckCalculations";
import type { DeviationView, PayCheckResultView, PayCheckState } from "./payCheckTypes";

// ViewModel for løntjekket. Starter i demodatoens måned. Løntjekket regnes i API'et ud fra
// vagterne, så det opdateres, når vagter eller sygdom ændres (fælles query-nøgler).
// Ved skift af måned eller job vises indlæsning, til de nye data er hentet.

type CheckedPayCheck = Extract<PayCheckData, { status: "checked" }>;

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

function hoursText(minutes: number): string {
  return da.units.hoursValue(formatHours(minutes));
}

function toDeviation(payCheck: CheckedPayCheck, error: PossibleErrorData): DeviationView {
  const line = categoryLineFor(payCheck, error.category);
  // Timeafvigelsen viser måneden; tillæg viser vagternes datoer.
  const when =
    error.category === "hours" || error.dates.length === 0
      ? formatMonth(payCheck.month)
      : error.dates.map((date) => `${weekdayShort(date)} ${formatDate(date, false)}`).join(", ");
  return {
    key: error.category,
    title: da.pay.deviation.titles[error.category],
    when,
    amountOere: error.amountOere,
    details: [
      { label: da.pay.deviation.yourShifts, value: hoursText(line?.expectedMinutes ?? 0) },
      { label: da.pay.deviation.onPayslip, value: hoursText(line?.paidMinutes ?? 0) },
      {
        label: da.pay.deviation.missing,
        value: da.pay.deviation.calculation(
          hoursText(error.missingMinutes),
          formatKr(error.rateOerePerHour),
        ),
      },
      { label: da.pay.deviation.amount, value: formatKr(error.amountOere) },
    ],
    askAiQuestionId: followUpQuestionId(error.category),
  };
}

function toResultView(payCheck: PayCheckData): PayCheckResultView {
  const monthTitle = formatMonth(payCheck.month);
  if (payCheck.status === "noPayslip") {
    return { kind: "noPayslip", title: da.pay.noPayslip.title(monthTitle) };
  }
  return {
    kind: "checked",
    payslip: {
      title: da.pay.payslip.title(monthTitle),
      employerName: payCheck.payslip.employerName,
      cprMasked: payCheck.payslip.cprMasked,
      accountNumberMasked: payCheck.payslip.accountNumberMasked,
      grossPayText: formatKr(payCheck.payslip.grossPayOere),
    },
    summary: {
      monthTitle,
      expectedOere: payCheck.expectedPayOere,
      paidOere: payCheck.paidPayOere,
      differenceOere: payCheck.differenceOere,
      issueCount: payCheck.possibleErrors.length,
      issuesTotalOere: payCheck.possibleErrorsTotalOere,
    },
    deviations: payCheck.possibleErrors.map((error) => toDeviation(payCheck, error)),
  };
}

export function usePayCheckWidget(): PayCheckState {
  const apiClient = useApiClient();
  const todayIso = useClock().today();
  const [chosenJobId, setChosenJobId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState(monthOfDate(todayIso));

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async ({ signal }) => unwrap(await fetchJobs(apiClient, signal)),
  });
  const jobs = jobsQuery.data ?? [];
  const selectedJob = jobs.find((job) => job.id === chosenJobId) ?? jobs[0];
  const jobId = selectedJob?.id ?? "";

  const payCheckQuery = useQuery({
    queryKey: queryKeys.payCheck(jobId, month),
    queryFn: async ({ signal }) => unwrap(await fetchPayCheck(apiClient, jobId, month, signal)),
    enabled: selectedJob !== undefined,
    placeholderData: keepPreviousData,
  });

  const failedError = jobsQuery.error ?? payCheckQuery.error;
  if (failedError !== null) {
    return {
      status: "error",
      error: toWidgetError(failedError),
      retry: () => {
        void jobsQuery.refetch();
        // Løntjekket hentes kun igen, når der er et job (ellers er forespørgslen slået fra).
        if (selectedJob !== undefined) {
          void payCheckQuery.refetch();
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
  const payCheck = payCheckQuery.data;
  if (payCheck === undefined) {
    return { status: "loading" };
  }

  return {
    status: "ready",
    jobOptions: jobs.map((job) => ({ value: job.id, label: `${job.workplace} · ${job.position}` })),
    selectedJobId: selectedJob.id,
    monthTitle: formatMonth(month),
    // Pladsholderdata hører til den forrige måned eller det forrige job og vises ikke.
    result: payCheckQuery.isPlaceholderData ? { kind: "loading" } : toResultView(payCheck),
    selectJob: setChosenJobId,
    showPreviousMonth: () => {
      setMonth(addMonths(month, -1));
    },
    showNextMonth: () => {
      setMonth(addMonths(month, 1));
    },
  };
}
