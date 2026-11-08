import type { ReactElement } from "react";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { AiChatWidget } from "@/widgets/aiChat/AiChatWidget";

// AI: forslag til spørgsmål med færdigskrevne svar.

export function AiScreen(): ReactElement {
  return (
    <WidgetErrorBoundary>
      <AiChatWidget />
    </WidgetErrorBoundary>
  );
}
