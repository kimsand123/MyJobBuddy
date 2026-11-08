import type { WidgetError } from "@/shared/widgetError";

// Tilstand for profilen under Mig.

export type ProfileState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | { status: "ready"; firstName: string; ageText: string };
