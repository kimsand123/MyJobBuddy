import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { useClock } from "@/app/clock/useClock";
import { formatMonthName } from "@/shared/format";
import { monthOfDate } from "@/shared/month";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchJobs, fetchPayCheck, fetchProfile, fetchShiftMonth } from "./homeApi";
import { payCheckOutcome } from "./homeCalculations";
import type { HomePayStatus, HomeWidgetState } from "./homeTypes";

// ViewModel for Hjem. Felterne viser data for det første job i den aktuelle måned (demodatoen).

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

export function useHomeWidget(): HomeWidgetState {
  const apiClient = useApiClient();
  const month = monthOfDate(useClock().today());

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async ({ signal }) => unwrap(await fetchProfile(apiClient, signal)),
  });
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async ({ signal }) => unwrap(await fetchJobs(apiClient, signal)),
  });
  const firstJob = jobsQuery.data?.[0];
  const jobId = firstJob?.id ?? "";
  const shiftsQuery = useQuery({
    queryKey: queryKeys.shifts(jobId, month),
    queryFn: async ({ signal }) => unwrap(await fetchShiftMonth(apiClient, jobId, month, signal)),
    enabled: firstJob !== undefined,
  });
  const payCheckQuery = useQuery({
    queryKey: queryKeys.payCheck(jobId, month),
    queryFn: async ({ signal }) => unwrap(await fetchPayCheck(apiClient, jobId, month, signal)),
    enabled: firstJob !== undefined,
  });

  const failedError =
    profileQuery.error ?? jobsQuery.error ?? shiftsQuery.error ?? payCheckQuery.error;
  if (failedError !== null) {
    return {
      status: "error",
      error: toWidgetError(failedError),
      retry: () => {
        void profileQuery.refetch();
        void jobsQuery.refetch();
        // Vagter og løntjek hentes kun igen, når der er et job (ellers er de slået fra).
        if (firstJob !== undefined) {
          void shiftsQuery.refetch();
          void payCheckQuery.refetch();
        }
      },
    };
  }

  const profile = profileQuery.data;
  const jobs = jobsQuery.data;
  if (profile === undefined || jobs === undefined) {
    return { status: "loading" };
  }
  if (firstJob === undefined) {
    return { status: "empty", firstName: profile.firstName };
  }

  const shiftMonth = shiftsQuery.data;
  const payCheck = payCheckQuery.data;
  if (shiftMonth === undefined || payCheck === undefined) {
    return { status: "loading" };
  }

  const monthName = formatMonthName(month);
  const outcome = payCheckOutcome(payCheck);
  let payStatus: HomePayStatus | undefined;
  if (outcome.kind === "ok") {
    payStatus = { tone: "success", text: da.status.ok };
  }
  if (outcome.kind === "possibleErrors") {
    payStatus = { tone: "warning", text: da.status.possibleErrors(outcome.count) };
  }

  return {
    status: "ready",
    view: {
      firstName: profile.firstName,
      position: firstJob.position,
      workplace: firstJob.workplace,
      agreementName: firstJob.agreementName,
      shiftsDescription: da.home.tiles.shifts.description(shiftMonth.shifts.length, monthName),
      payDescription: da.home.tiles.pay.description(monthName),
      payStatus,
    },
  };
}
