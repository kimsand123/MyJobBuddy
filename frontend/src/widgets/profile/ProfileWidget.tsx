import { Pencil, UserRound } from "lucide-react";
import type { ReactElement } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AppButton } from "@/components/AppButton";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { da } from "@/texts/da";
import { useProfileWidget } from "./useProfileWidget";

// View: profilen (fornavn og alder). Rediger profil er ikke bygget.

export function ProfileWidget(): ReactElement {
  const profile = useProfileWidget();
  const showNotImplemented = useNotImplemented();

  if (profile.status === "loading") {
    return <LoadingSkeleton variant="card" label={da.me.loadingProfile} />;
  }
  if (profile.status === "error") {
    return <ErrorState error={profile.error} onRetry={profile.retry} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-4 shadow-card">
      <span className="inline-flex size-14 flex-none items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <UserRound className="size-7" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-title-2">{profile.firstName}</p>
        <p className="text-body-sm text-muted-foreground">{profile.ageText}</p>
      </div>
      <AppButton variant="outline" size="sm" icon={Pencil} onClick={showNotImplemented}>
        {da.me.editProfile}
      </AppButton>
    </div>
  );
}
