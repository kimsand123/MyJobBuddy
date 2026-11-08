import { CircleAlert, RefreshCw } from "lucide-react";
import { use, useEffect, type ReactElement } from "react";
import type { WidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";
import { WidgetErrorAnnouncerContext } from "./widgetErrorAnnouncerContext";

// Fejl ved hentning af data: dansk tekst ud fra errorType, fejl-id og "Prøv igen".
// API'ets engelske besked vises aldrig. Fejlen annonceres høfligt (polite) via den faste live
// region i WidgetErrorAnnouncer; uden announcer er kortet selv en status-region.

export type ErrorStateProps = {
  error: WidgetError;
  title?: string;
  retrying?: boolean;
  onRetry?: () => void;
};

export function ErrorState({
  error,
  title = da.errors.loadTitle,
  retrying = false,
  onRetry,
}: ErrorStateProps): ReactElement {
  const announce = use(WidgetErrorAnnouncerContext);
  const text = da.errors.byType[error.errorType];

  useEffect(() => {
    announce?.(`${title}. ${text}`);
  }, [announce, title, text]);

  return (
    <section
      role={announce === undefined ? "status" : undefined}
      className="flex flex-col items-center gap-3 rounded-lg bg-card px-5 py-8 text-center shadow-card"
    >
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <CircleAlert className="size-7" aria-hidden="true" />
      </span>
      <h2 className="text-title-3">{title}</h2>
      <p className="max-w-[32ch] text-body-sm text-muted-foreground">{text}</p>
      {error.traceId !== undefined && (
        <p className="text-body-sm text-muted-foreground">{da.errors.traceId(error.traceId)}</p>
      )}
      {onRetry !== undefined && (
        <AppButton variant="outline" icon={RefreshCw} loading={retrying} onClick={onRetry}>
          {da.common.retry}
        </AppButton>
      )}
    </section>
  );
}
