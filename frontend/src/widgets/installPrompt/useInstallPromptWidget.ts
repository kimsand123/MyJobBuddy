import { useRef, useState, useSyncExternalStore } from "react";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosSafari,
  isRunningInstalled,
  subscribeToInstallPrompt,
} from "./installPromptPlatform";
import { readInstallPromptDismissed, saveInstallPromptDismissed } from "./installPromptStorage";
import type { DeferredInstallPrompt, InstallPromptWidgetState } from "./installPromptTypes";

// ViewModel for installationskortet. Afgør ud fra browseren, om kortet vises med knap (Android og
// computer), med vejledning (iPhone og iPad i Safari) eller slet ikke (installeret, afvist med
// "Ikke nu" eller en browser, der ikke kan installere).

type InstallEnvironment = {
  installed: boolean;
  iosSafari: boolean;
};

function readEnvironment(): InstallEnvironment {
  return { installed: isRunningInstalled(), iosSafari: isIosSafari() };
}

function noDeferredPrompt(): undefined {
  return undefined;
}

/** Viser browserens installationsdialog og venter på brugerens valg. */
async function showInstallDialog(deferredPrompt: DeferredInstallPrompt): Promise<void> {
  try {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
  } catch {
    // prompt() afvises, hvis eventet allerede er brugt. Så kan det heller ikke bruges igen.
  }
  // Eventet kan kun bruges én gang, så kortet skjules, uanset hvad brugeren valgte.
  clearDeferredInstallPrompt();
}

export function useInstallPromptWidget(): InstallPromptWidgetState {
  const deferredPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getDeferredInstallPrompt,
    noDeferredPrompt,
  );
  // Browser og installeret-tilstand ændrer sig ikke, mens siden er åben, så de læses én gang.
  const [environment] = useState(readEnvironment);
  const [dismissed, setDismissed] = useState(readInstallPromptDismissed);
  // Et event kan kun bruge prompt() én gang. Ref'en stopper et hurtigt dobbelttryk med det samme
  // (før React har tegnet knappen deaktiveret); state'en deaktiverer knappen, mens dialogen er åben.
  const promptInFlightRef = useRef<Promise<void> | undefined>(undefined);
  const [installing, setInstalling] = useState(false);

  const dismiss = (): void => {
    saveInstallPromptDismissed();
    setDismissed(true);
  };

  if (environment.installed || dismissed) {
    return { status: "hidden" };
  }

  if (deferredPrompt !== undefined) {
    const install = (): Promise<void> => {
      // Et tryk mere, mens dialogen er åben, får det samme løfte og kalder ikke prompt() igen.
      if (promptInFlightRef.current !== undefined) {
        return promptInFlightRef.current;
      }
      setInstalling(true);
      const promptInFlight = showInstallDialog(deferredPrompt).finally(() => {
        promptInFlightRef.current = undefined;
        setInstalling(false);
      });
      promptInFlightRef.current = promptInFlight;
      return promptInFlight;
    };
    return { status: "installButton", installing, install, dismiss };
  }

  if (environment.iosSafari) {
    return { status: "iosGuide", dismiss };
  }
  return { status: "hidden" };
}
