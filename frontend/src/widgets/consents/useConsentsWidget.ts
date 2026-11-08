import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchConsents, setSicknessConsent } from "./consentsApi";
import type { ConsentsState } from "./consentsTypes";

// ViewModel for samtykket til sygdom. Til gemmes med det samme. Fra kræver en bekræftelse,
// fordi alle sygdomsmarkeringer slettes; bagefter vises, hvor mange der blev slettet.

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

export function useConsentsWidget(): ConsentsState {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const consentsQuery = useQuery({
    queryKey: queryKeys.consents,
    queryFn: async ({ signal }) => unwrap(await fetchConsents(apiClient, signal)),
  });
  const consentMutation = useMutation({
    mutationFn: (granted: boolean) => setSicknessConsent(apiClient, granted),
  });

  if (consentsQuery.error !== null) {
    return {
      status: "error",
      error: toWidgetError(consentsQuery.error),
      retry: () => {
        void consentsQuery.refetch();
      },
    };
  }
  const consents = consentsQuery.data;
  if (consents === undefined) {
    return { status: "loading" };
  }

  const saveConsent = (granted: boolean): void => {
    setErrorText(undefined);
    consentMutation.mutate(granted, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        if (!result.success) {
          setErrorText(da.errors.byType[result.errorType]);
          return;
        }
        setStatusMessage(
          result.data.sicknessConsent
            ? da.consent.enabled
            : da.consent.disabled(result.data.removedSickMarkings),
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.consents });
        void queryClient.invalidateQueries({ queryKey: queryKeys.allShifts });
        void queryClient.invalidateQueries({ queryKey: queryKeys.allPayChecks });
      },
    });
  };

  return {
    status: "ready",
    sicknessConsent: consents.sicknessConsent,
    busy: consentMutation.isPending,
    confirmOpen,
    statusMessage,
    errorText,
    requestChange: (checked) => {
      if (consentMutation.isPending) {
        return;
      }
      if (checked) {
        saveConsent(true);
        return;
      }
      setConfirmOpen(true);
    },
    confirmTurnOff: () => {
      if (consentMutation.isPending) {
        return;
      }
      saveConsent(false);
    },
    setConfirmOpen,
  };
}
