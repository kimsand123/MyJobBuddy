import { Download, Eye, Trash2 } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AppButton } from "@/components/AppButton";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { SectionHeading } from "@/components/SectionHeading";
import { da } from "@/texts/da";
import { ConsentsWidget } from "@/widgets/consents/ConsentsWidget";
import { JobsWidget } from "@/widgets/jobs/JobsWidget";
import { ProfileWidget } from "@/widgets/profile/ProfileWidget";
import { SubscriptionWidget } from "@/widgets/subscription/SubscriptionWidget";

// Mig: profil, job og overenskomster, samtykke, abonnement og mine data.
// Hver sektion har sin egen Error Boundary.

type MeSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function MeSection({ id, title, children }: MeSectionProps): ReactElement {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <SectionHeading id={id}>{title}</SectionHeading>
      <WidgetErrorBoundary>{children}</WidgetErrorBoundary>
    </section>
  );
}

function MyDataSection(): ReactElement {
  const showNotImplemented = useNotImplemented();
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card">
      <p className="text-body-sm text-muted-foreground">{da.me.myData.text}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))] gap-2">
        <AppButton variant="outline" icon={Eye} onClick={showNotImplemented}>
          {da.me.myData.see}
        </AppButton>
        <AppButton variant="outline" icon={Download} onClick={showNotImplemented}>
          {da.me.myData.download}
        </AppButton>
      </div>
      <AppButton variant="destructive" block icon={Trash2} onClick={showNotImplemented}>
        {da.me.myData.deleteAll}
      </AppButton>
    </div>
  );
}

export function MeScreen(): ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <MeSection id="me-profile" title={da.me.profileTitle}>
        <ProfileWidget />
      </MeSection>
      <MeSection id="me-jobs" title={da.me.jobsTitle}>
        <JobsWidget />
      </MeSection>
      <MeSection id="me-consent" title={da.me.consentTitle}>
        <ConsentsWidget />
      </MeSection>
      <MeSection id="me-subscription" title={da.me.subscriptionTitle}>
        <SubscriptionWidget />
      </MeSection>
      <MeSection id="me-data" title={da.me.myData.title}>
        <MyDataSection />
      </MeSection>
    </div>
  );
}
