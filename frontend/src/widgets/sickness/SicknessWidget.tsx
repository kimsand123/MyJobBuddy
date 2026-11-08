import { HeartPulse, Pencil, Trash2, Undo2 } from "lucide-react";
import type { ReactElement } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AppButton } from "@/components/AppButton";
import { ConsentToggle } from "@/components/ConsentToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { da } from "@/texts/da";
import type { ShiftDetailsView } from "./sicknessTypes";
import { useSicknessWidget } from "./useSicknessWidget";

// View: indholdet af vagtdetaljearket med "Jeg var syg" / "Ikke syg alligevel".
// Ret og slet vagt er ikke bygget og viser "Ikke implementeret".

export type SicknessWidgetProps = {
  shift: ShiftDetailsView;
};

export function SicknessWidget({ shift }: SicknessWidgetProps): ReactElement {
  const sickness = useSicknessWidget(shift.id);
  const showNotImplemented = useNotImplemented();

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md bg-background p-3">
        <dt className="text-muted-foreground">{da.shiftDetails.time}</dt>
        <dd className="text-right font-semibold tabular-nums">{shift.timeRangeText}</dd>
        <dt className="text-muted-foreground">{da.shiftDetails.hours}</dt>
        <dd className="text-right font-semibold tabular-nums">{shift.hoursText}</dd>
        <dt className="text-muted-foreground">{da.shiftDetails.pause}</dt>
        <dd className="text-right font-semibold">{shift.pauseText}</dd>
        <dt className="text-muted-foreground">{da.shiftDetails.supplements}</dt>
        <dd className="text-right font-semibold">{shift.supplementsText}</dd>
        <dt className="text-muted-foreground">{da.shiftDetails.expected}</dt>
        <dd className="text-right font-bold tabular-nums">{shift.expectedPayText}</dd>
        <dt className="text-muted-foreground">{da.shiftDetails.status}</dt>
        <dd className="flex justify-end">
          {shift.isSick ? (
            <StatusBadge tone="info" icon={HeartPulse}>
              {da.shiftDetails.sick}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">{da.shiftDetails.notSick}</StatusBadge>
          )}
        </dd>
      </dl>

      {sickness.consentRequired && (
        <section className="flex flex-col gap-1 rounded-lg border border-info bg-info-soft">
          <div className="px-4 pt-4">
            <h3 className="text-title-3">{da.shiftDetails.consentRequired.title}</h3>
            <p className="mt-1 text-body-sm">{da.shiftDetails.consentRequired.text}</p>
          </div>
          <ConsentToggle
            label={da.consent.sicknessLabel}
            description={da.consent.sicknessDescription}
            checked={sickness.consentGranted}
            disabled={sickness.busy || sickness.consentGranted}
            onChange={(checked) => {
              if (checked) {
                sickness.grantConsent();
              }
            }}
          />
        </section>
      )}

      {/* Regionen findes altid (skjult, når den er tom), så nye beskeder annonceres. */}
      <p role="status" className="text-body-sm text-success empty:sr-only">
        {sickness.message}
      </p>
      {sickness.errorText !== undefined && (
        <p role="alert" className="text-label text-danger">
          {sickness.errorText}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {shift.isSick ? (
          <AppButton
            variant="secondary"
            block
            icon={Undo2}
            loading={sickness.busy}
            onClick={sickness.unmarkSick}
          >
            {da.shiftDetails.unmarkSick}
          </AppButton>
        ) : (
          <AppButton block icon={HeartPulse} loading={sickness.busy} onClick={sickness.markSick}>
            {da.shiftDetails.markSick}
          </AppButton>
        )}
        <div className="grid grid-cols-2 gap-2">
          <AppButton variant="outline" icon={Pencil} onClick={showNotImplemented}>
            {da.shiftDetails.edit}
          </AppButton>
          <AppButton variant="outline" icon={Trash2} onClick={showNotImplemented}>
            {da.shiftDetails.delete}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
