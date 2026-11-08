import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/app/apiClient/useApiClient";
import type { PlanData, SubscriptionData } from "@/shared/apiSchemas";
import { formatKrPerMonth } from "@/shared/format";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { fetchSubscription } from "./subscriptionApi";
import { remainingPercent } from "./subscriptionCalculations";
import type { PlanView, SubscriptionState } from "./subscriptionTypes";

// ViewModel for abonnementet: PlanCards ud fra /subscription. Pris uden fast beløb (null) vises
// som "Du ser prisen, før du betaler".

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

function planFeatures(plan: PlanData): string[] {
  const features: string[] = [];
  if (plan.questionsPerMonth !== null) {
    features.push(da.subscription.questionsPerMonth(plan.questionsPerMonth));
  }
  if (plan.billingPeriod === "question") {
    features.push(da.subscription.noBinding, da.subscription.payWhenAsking);
    return features;
  }
  features.push(
    plan.payChecksPerMonth === null
      ? da.subscription.unlimitedPayChecks
      : da.subscription.payChecksPerMonth(plan.payChecksPerMonth),
  );
  return features;
}

function toPlanView(plan: PlanData, subscription: SubscriptionData): PlanView {
  const current = plan.code === subscription.currentPlanCode;
  return {
    code: plan.code,
    name: da.subscription.names[plan.code],
    price:
      plan.priceOere === null ? da.subscription.priceOnRequest : formatKrPerMonth(plan.priceOere),
    features: planFeatures(plan),
    current,
    usage: current
      ? {
          remaining: subscription.questionsRemaining,
          total: subscription.questionsTotal,
          remainingPercent: remainingPercent(
            subscription.questionsRemaining,
            subscription.questionsTotal,
          ),
          unit: da.subscription.usageUnit,
        }
      : undefined,
    ctaLabel: current ? undefined : da.subscription.select[plan.code],
  };
}

export function useSubscriptionWidget(): SubscriptionState {
  const apiClient = useApiClient();
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: async ({ signal }) => unwrap(await fetchSubscription(apiClient, signal)),
  });

  if (subscriptionQuery.error !== null) {
    return {
      status: "error",
      error: toWidgetError(subscriptionQuery.error),
      retry: () => {
        void subscriptionQuery.refetch();
      },
    };
  }
  const subscription = subscriptionQuery.data;
  if (subscription === undefined) {
    return { status: "loading" };
  }
  return {
    status: "ready",
    plans: subscription.plans.map((plan) => toPlanView(plan, subscription)),
  };
}
