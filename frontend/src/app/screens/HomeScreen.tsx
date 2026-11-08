import { useRef, type ReactElement } from "react";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { da } from "@/texts/da";
import { HomeWidget } from "@/widgets/home/HomeWidget";
import { InstallPromptWidget } from "@/widgets/installPrompt/InstallPromptWidget";

// Hjem. AppHeader viser logoet, så sidens h1 står her (skjult, men læses op).
// Installationskortet står øverst, når browseren kan installere appen.

export function HomeScreen(): ReactElement {
  // Når installationskortet lukkes, får hilsenen fokus, så seende tastaturbrugere kan se, hvor
  // fokus er. Vises hilsenen ikke (fx mens Hjem henter), lander fokus på den skjulte h1.
  const greetingHeadingRef = useRef<HTMLHeadingElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);

  const focusAfterInstallPrompt = (): void => {
    const target = greetingHeadingRef.current ?? pageHeadingRef.current;
    target?.focus();
  };

  return (
    <>
      <h1 ref={pageHeadingRef} tabIndex={-1} className="sr-only">
        {da.pages.home.title}
      </h1>
      <div className="flex flex-col gap-4">
        <WidgetErrorBoundary>
          <InstallPromptWidget onClosed={focusAfterInstallPrompt} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary>
          <HomeWidget greetingHeadingRef={greetingHeadingRef} />
        </WidgetErrorBoundary>
      </div>
    </>
  );
}
