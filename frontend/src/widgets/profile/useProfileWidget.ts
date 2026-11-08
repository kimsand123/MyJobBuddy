import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/app/apiClient/useApiClient";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchProfile } from "./profileApi";
import type { ProfileState } from "./profileTypes";

// ViewModel for profilen.

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

export function useProfileWidget(): ProfileState {
  const apiClient = useApiClient();
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async ({ signal }) => unwrap(await fetchProfile(apiClient, signal)),
  });

  if (profileQuery.error !== null) {
    return {
      status: "error",
      error: toWidgetError(profileQuery.error),
      retry: () => {
        void profileQuery.refetch();
      },
    };
  }
  const profile = profileQuery.data;
  if (profile === undefined) {
    return { status: "loading" };
  }
  return { status: "ready", firstName: profile.firstName, ageText: da.me.age(profile.age) };
}
