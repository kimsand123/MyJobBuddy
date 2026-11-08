import type { ReactElement } from "react";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { PayCheckWidget } from "@/widgets/payCheck/PayCheckWidget";

// Løn: løntjek pr. job og måned.

export function PayScreen(): ReactElement {
  return (
    <WidgetErrorBoundary>
      <PayCheckWidget />
    </WidgetErrorBoundary>
  );
}
