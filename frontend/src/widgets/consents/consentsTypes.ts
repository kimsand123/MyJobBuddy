import type { WidgetError } from "@/shared/widgetError";

// Tilstand for samtykket til sygdom under Mig.

export type ConsentsState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | {
      status: "ready";
      sicknessConsent: boolean;
      busy: boolean;
      /** Bekræftelsesdialogen, før samtykket slås fra. */
      confirmOpen: boolean;
      statusMessage: string;
      errorText: string | undefined;
      /** Til slås til med det samme; Fra åbner bekræftelsen. */
      requestChange: (checked: boolean) => void;
      confirmTurnOff: () => void;
      setConfirmOpen: (open: boolean) => void;
    };
