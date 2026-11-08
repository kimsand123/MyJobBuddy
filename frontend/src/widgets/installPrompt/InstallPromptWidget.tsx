import { Download, Share, Smartphone } from "lucide-react";
import { useId, type ReactElement } from "react";
import { AppButton } from "@/components/AppButton";
import { da } from "@/texts/da";
import { useInstallPromptWidget } from "./useInstallPromptWidget";

// View for installationskortet øverst på Hjem: "Installér" på Android og computer, vejledning på
// iPhone og iPad i Safari. Vises ikke, når appen er installeret, eller browseren ikke kan installere.

export type InstallPromptWidgetProps = {
  /** Kaldes, når kortet lukkes af brugeren, så fokus kan flyttes til et fast sted på siden. */
  onClosed: () => void;
};

function IosGuide(): ReactElement {
  return (
    <ol aria-label={da.installPrompt.iosGuideLabel} className="list-decimal pl-6 text-body-sm">
      <li>
        {da.installPrompt.iosShare}{" "}
        <Share className="inline size-4 align-text-bottom" aria-hidden="true" />{" "}
        {da.installPrompt.iosShareAlternative}
      </li>
      <li className="mt-1">{da.installPrompt.iosAdd}</li>
    </ol>
  );
}

export function InstallPromptWidget({ onClosed }: InstallPromptWidgetProps): ReactElement | null {
  const installPrompt = useInstallPromptWidget();
  const titleId = useId();

  if (installPrompt.status === "hidden") {
    return null;
  }

  const later = (): void => {
    // Fokus flyttes, før kortet (og knappen) forsvinder.
    onClosed();
    installPrompt.dismiss();
  };

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-tap-target flex-none items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Smartphone className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 break-words">
          <h2 id={titleId} className="text-title-3">
            {da.installPrompt.title}
          </h2>
          <p className="mt-0.5 text-body-sm text-muted-foreground">{da.installPrompt.text}</p>
        </div>
      </div>
      {installPrompt.status === "iosGuide" && <IosGuide />}
      <div className="flex flex-wrap gap-2">
        {installPrompt.status === "installButton" && (
          <AppButton
            icon={Download}
            className="flex-[1_1_10rem]"
            loading={installPrompt.installing}
            onClick={() => {
              // Kortet skjules, når browserens dialog er lukket; så får siden fokus igen.
              // Et ekstra tryk venter på samme dialog, så fokus flyttes først, når den er lukket.
              void installPrompt.install().then(onClosed);
            }}
          >
            {da.installPrompt.install}
          </AppButton>
        )}
        <AppButton variant="ghost" onClick={later}>
          {da.installPrompt.later}
        </AppButton>
      </div>
    </section>
  );
}
