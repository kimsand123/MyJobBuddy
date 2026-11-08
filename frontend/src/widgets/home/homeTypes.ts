import type { WidgetError } from "@/shared/widgetError";

// Tilstand for Hjem-widgetten (hilsen, fire felter og banner).

export type HomePayStatus = {
  tone: "success" | "warning";
  text: string;
};

export type HomeView = {
  firstName: string;
  position: string;
  workplace: string;
  agreementName: string;
  shiftsDescription: string;
  payDescription: string;
  payStatus: HomePayStatus | undefined;
};

export type HomeWidgetState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | { status: "empty"; firstName: string }
  | { status: "ready"; view: HomeView };
