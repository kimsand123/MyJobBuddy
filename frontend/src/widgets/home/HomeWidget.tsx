import { CalendarDays, FileText, Scale, UserRound, Wallet } from "lucide-react";
import type { ReactElement, Ref } from "react";
import { useNavigate } from "react-router";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FeatureTile } from "@/components/FeatureTile";
import { GreetingCard } from "@/components/GreetingCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PromoBanner } from "@/components/PromoBanner";
import { routePaths } from "@/shared/routePaths";
import { da } from "@/texts/da";
import { useHomeWidget } from "./useHomeWidget";

// View for Hjem: hilsen, fire felter (Kontrakt, Vagter, Løn, Rettigheder) og AI-banneret.

export type HomeWidgetProps = {
  /** Hilsenens overskrift, så skærmen kan flytte fokus dertil (fx når installationskortet lukkes). */
  greetingHeadingRef?: Ref<HTMLHeadingElement>;
};

export function HomeWidget({ greetingHeadingRef }: HomeWidgetProps): ReactElement {
  const home = useHomeWidget();
  const showNotImplemented = useNotImplemented();
  const navigate = useNavigate();

  if (home.status === "loading") {
    return <LoadingSkeleton variant="card" rows={2} label={da.home.loadingLabel} />;
  }
  if (home.status === "error") {
    return <ErrorState error={home.error} onRetry={home.retry} />;
  }
  if (home.status === "empty") {
    return (
      <EmptyState
        icon={UserRound}
        title={da.home.noJob.title}
        text={da.home.noJob.text}
        actionLabel={da.home.noJob.action}
        onAction={() => {
          void navigate(routePaths.me);
        }}
      />
    );
  }

  const { view } = home;
  return (
    <div className="flex flex-col gap-4">
      <GreetingCard
        firstName={view.firstName}
        job={view.position}
        workplace={view.workplace}
        agreement={view.agreementName}
        headingRef={greetingHeadingRef}
      />
      <nav aria-label={da.home.tiles.label}>
        {/* Kolonnerne må aldrig blive bredere end deres andel (min-w-0 og min(…, 100%)), så en
            flise med badge ikke skubber naboen ved forstørret tekst. */}
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(8.75rem,100%),1fr))] gap-3">
          <li className="grid min-w-0">
            <FeatureTile
              icon={FileText}
              title={da.home.tiles.contract.title}
              description={da.home.tiles.contract.description}
              onClick={showNotImplemented}
            />
          </li>
          <li className="grid min-w-0">
            <FeatureTile
              icon={CalendarDays}
              title={da.home.tiles.shifts.title}
              description={view.shiftsDescription}
              to={routePaths.shifts}
            />
          </li>
          <li className="grid min-w-0">
            <FeatureTile
              icon={Wallet}
              title={da.home.tiles.pay.title}
              description={view.payDescription}
              status={view.payStatus}
              to={routePaths.pay}
            />
          </li>
          <li className="grid min-w-0">
            <FeatureTile
              icon={Scale}
              title={da.home.tiles.rights.title}
              description={da.home.tiles.rights.description}
              to={routePaths.ai}
            />
          </li>
        </ul>
      </nav>
      <PromoBanner
        title={da.home.promo.title}
        text={da.home.promo.text}
        actionLabel={da.home.promo.action}
        to={routePaths.ai}
      />
    </div>
  );
}
