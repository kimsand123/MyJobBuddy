import type { ReactElement } from "react";
import { WidgetErrorFallback } from "@/components/ErrorBoundary";

// Vises af routeren, hvis en rute fejler uden for en widget. Siden genindlæses ved "Prøv igen".

export function RouteErrorScreen(): ReactElement {
  const reload = (): void => {
    window.location.reload();
  };
  return (
    <main className="mx-auto w-full max-w-content p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <WidgetErrorFallback onRetry={reload} />
    </main>
  );
}
