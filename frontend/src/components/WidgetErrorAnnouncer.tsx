import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { da } from "@/texts/da";
import { WidgetErrorAnnouncerContext } from "./widgetErrorAnnouncerContext";

// Én fælles live region for widget-fejl (Error Boundary og ErrorState). Den ligger uden for de Error Boundaries, der skifter
// key ved navigation, så den altid findes i DOM'en, før en fejl opstår. Ellers annoncerer
// skærmlæsere ikke en fejl, der sker ved første rendering.
// Teksten ryddes og sættes igen, så en ny fejl også annonceres, når teksten er den samme.

const reannounceDelayMs = 100;

export type WidgetErrorAnnouncerProps = {
  children: ReactNode;
};

export function WidgetErrorAnnouncer({ children }: WidgetErrorAnnouncerProps): ReactElement {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback((text: string = da.errors.widgetTitle): void => {
    clearTimeout(timerRef.current);
    setMessage("");
    timerRef.current = setTimeout(() => {
      setMessage(text);
    }, reannounceDelayMs);
  }, []);

  useEffect(() => {
    return (): void => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <WidgetErrorAnnouncerContext value={announce}>
      <p role="status" className="sr-only">
        {message}
      </p>
      {children}
    </WidgetErrorAnnouncerContext>
  );
}
