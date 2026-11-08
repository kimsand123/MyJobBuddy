import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchConsents, grantSicknessConsent, markShiftSick, unmarkShiftSick } from "./sicknessApi";
import type { SicknessState } from "./sicknessTypes";

// ViewModel for sygdom på en vagt. Afviser API'et (forbidden, samtykke Fra), vises en forklaring
// med ConsentToggle. Ændringer invaliderer vagter og løntjek, så løntjekket opdateres live.

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

export function useSicknessWidget(shiftId: string): SicknessState {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [consentRequired, setConsentRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const consentsQuery = useQuery({
    queryKey: queryKeys.consents,
    queryFn: async ({ signal }) => unwrap(await fetchConsents(apiClient, signal)),
  });

  const refreshShiftData = (): void => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.allShifts });
    void queryClient.invalidateQueries({ queryKey: queryKeys.allPayChecks });
  };

  const markMutation = useMutation({ mutationFn: () => markShiftSick(apiClient, shiftId) });
  const unmarkMutation = useMutation({ mutationFn: () => unmarkShiftSick(apiClient, shiftId) });
  const consentMutation = useMutation({ mutationFn: () => grantSicknessConsent(apiClient) });
  const busy = markMutation.isPending || unmarkMutation.isPending || consentMutation.isPending;

  const markSick = (): void => {
    if (busy) {
      return;
    }
    setErrorText(undefined);
    markMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.success && result.errorType === "forbidden") {
          setConsentRequired(true);
          return;
        }
        if (!result.success) {
          setErrorText(da.errors.byType[result.errorType]);
          return;
        }
        setConsentRequired(false);
        setMessage(da.shiftDetails.markedSick);
        refreshShiftData();
      },
    });
  };

  const unmarkSick = (): void => {
    if (busy) {
      return;
    }
    setErrorText(undefined);
    unmarkMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.success) {
          setErrorText(da.errors.byType[result.errorType]);
          return;
        }
        setMessage(da.shiftDetails.unmarkedSick);
        refreshShiftData();
      },
    });
  };

  const grantConsent = (): void => {
    if (busy) {
      return;
    }
    setErrorText(undefined);
    consentMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.success) {
          setErrorText(da.errors.byType[result.errorType]);
          return;
        }
        setMessage(da.consent.enabled);
        void queryClient.invalidateQueries({ queryKey: queryKeys.consents });
      },
    });
  };

  return {
    consentRequired,
    consentGranted: consentsQuery.data?.sicknessConsent ?? false,
    busy,
    message,
    errorText,
    markSick,
    unmarkSick,
    grantConsent,
  };
}
