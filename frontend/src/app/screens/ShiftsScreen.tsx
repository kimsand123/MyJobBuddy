import type { ReactElement } from "react";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { ShiftCalendarWidget } from "@/widgets/shiftCalendar/ShiftCalendarWidget";

// Vagter: kalender, vagtliste, registrering og sygdom.

export function ShiftsScreen(): ReactElement {
  return (
    <WidgetErrorBoundary>
      <ShiftCalendarWidget />
    </WidgetErrorBoundary>
  );
}
