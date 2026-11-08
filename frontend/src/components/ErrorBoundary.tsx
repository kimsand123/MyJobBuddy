import { CircleAlert } from "lucide-react";
import { Component, type ContextType, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { da } from "@/texts/da";
import { WidgetErrorAnnouncerContext } from "./widgetErrorAnnouncerContext";

// Sikkerhedsnet omkring hver widget, så én fejlende widget ikke vælter resten af siden.
// React kræver en klassekomponent til Error Boundaries.
// Fejlen annonceres via WidgetErrorAnnouncer (i AppShell), hvis live region ligger uden for
// boundaryen og derfor altid findes i DOM'en før fejlen. Kun hvis der ikke er en announcer over
// boundaryen (fx når en widget renderes alene i en test), har boundaryen sin egen live region.

export type WidgetErrorBoundaryProps = {
  children: ReactNode;
  /** Eget indhold ved fejl. Standard: WidgetErrorFallback med "Prøv igen". */
  fallback?: ReactNode;
};

type WidgetErrorBoundaryState = {
  hasError: boolean;
};

export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  static override contextType = WidgetErrorAnnouncerContext;
  declare context: ContextType<typeof WidgetErrorAnnouncerContext>;

  override state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(): void {
    this.context?.();
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  private renderContent(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }
    return <WidgetErrorFallback onRetry={this.reset} />;
  }

  override render(): ReactNode {
    if (this.context !== undefined) {
      return this.renderContent();
    }
    return (
      <>
        <p role="status" className="sr-only">
          {this.state.hasError ? da.errors.widgetTitle : ""}
        </p>
        {this.renderContent()}
      </>
    );
  }
}

export type WidgetErrorFallbackProps = {
  onRetry?: () => void;
};

export function WidgetErrorFallback({ onRetry }: WidgetErrorFallbackProps): ReactElement {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg bg-card px-4 py-8 text-center shadow-card">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <CircleAlert size={24} aria-hidden="true" />
      </span>
      <h2 className="text-title-3">{da.errors.widgetTitle}</h2>
      <p className="text-body-sm text-muted-foreground">{da.errors.widgetText}</p>
      {onRetry !== undefined && (
        <Button variant="outline" className="h-tap-target" onClick={onRetry}>
          {da.common.retry}
        </Button>
      )}
    </section>
  );
}
