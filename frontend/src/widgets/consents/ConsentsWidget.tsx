import { useRef, type ReactElement } from "react";
import { AppButton } from "@/components/AppButton";
import { ConsentToggle } from "@/components/ConsentToggle";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { da } from "@/texts/da";
import { useConsentsWidget } from "./useConsentsWidget";

// View: samtykke til sygdom med ConsentToggle. Fra bekræftes i en Dialog, og fokus vender
// tilbage til switchen, når dialogen lukker.

export function ConsentsWidget(): ReactElement {
  const consents = useConsentsWidget();
  const switchRef = useRef<HTMLButtonElement>(null);

  if (consents.status === "loading") {
    return <LoadingSkeleton variant="card" label={da.me.loadingConsents} />;
  }
  if (consents.status === "error") {
    return <ErrorState error={consents.error} onRetry={consents.retry} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg bg-card shadow-card">
        <ConsentToggle
          label={da.consent.sicknessLabel}
          description={da.consent.sicknessDescription}
          checked={consents.sicknessConsent}
          disabled={consents.busy}
          onChange={consents.requestChange}
          switchRef={switchRef}
        />
      </div>
      <p role="status" className="text-body-sm text-success empty:sr-only">
        {consents.statusMessage}
      </p>
      {consents.errorText !== undefined && (
        <p role="alert" className="text-label text-danger">
          {consents.errorText}
        </p>
      )}

      <Dialog open={consents.confirmOpen} onOpenChange={consents.setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(calc(100%-2rem),24rem)] rounded-xl bg-card"
          onCloseAutoFocus={(event) => {
            const switchElement = switchRef.current;
            if (switchElement === null) {
              return;
            }
            event.preventDefault();
            switchElement.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-title-2">{da.consent.confirm.title}</DialogTitle>
            <DialogDescription className="text-body text-muted-foreground">
              {da.consent.confirm.text}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <AppButton
              variant="destructive"
              block
              loading={consents.busy}
              onClick={consents.confirmTurnOff}
            >
              {da.consent.confirm.action}
            </AppButton>
            <AppButton
              variant="ghost"
              block
              disabled={consents.busy}
              onClick={() => {
                consents.setConfirmOpen(false);
              }}
            >
              {da.common.cancel}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
