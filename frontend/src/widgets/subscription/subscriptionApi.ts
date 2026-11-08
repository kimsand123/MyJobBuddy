import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import { subscriptionSchema, type SubscriptionData } from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for abonnementet.

export function fetchSubscription(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<SubscriptionData>> {
  return requestData(
    apiClient,
    { method: "GET", path: "/subscription", signal },
    subscriptionSchema,
  );
}
