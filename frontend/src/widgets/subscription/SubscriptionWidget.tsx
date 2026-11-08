import type { ReactElement } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PlanCard } from "@/components/PlanCard";
import { da } from "@/texts/da";
import { useSubscriptionWidget } from "./useSubscriptionWidget";

// View: abonnementerne. At skifte abonnement er ikke bygget.

export function SubscriptionWidget(): ReactElement {
  const subscription = useSubscriptionWidget();
  const showNotImplemented = useNotImplemented();

  if (subscription.status === "loading") {
    return <LoadingSkeleton variant="card" rows={3} label={da.me.loadingSubscription} />;
  }
  if (subscription.status === "error") {
    return <ErrorState error={subscription.error} onRetry={subscription.retry} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {subscription.plans.map((plan) => (
        <li key={plan.code}>
          <PlanCard
            name={plan.name}
            price={plan.price}
            features={plan.features}
            current={plan.current}
            usage={plan.usage}
            ctaLabel={plan.ctaLabel}
            onSelect={showNotImplemented}
          />
        </li>
      ))}
    </ul>
  );
}
