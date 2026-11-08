// Tilstand for installationskortet på Hjem. Kortet vises kun i en browser, der kan installere
// appen, og aldrig når appen allerede kører installeret.

/**
 * Det, Chrome, Edge og Samsung Internet sender med beforeinstallprompt. Typen findes ikke i
 * TypeScripts DOM-typer, så den står her og kontrolleres med en type guard.
 */
export type DeferredInstallPrompt = {
  prompt: () => Promise<unknown>;
  userChoice: Promise<unknown>;
};

export type InstallPromptWidgetState =
  | { status: "hidden" }
  /**
   * Android og computer: knappen åbner browserens egen installationsdialog. installing er sand,
   * mens dialogen er åben; så er knappen deaktiveret.
   */
  | {
      status: "installButton";
      installing: boolean;
      install: () => Promise<void>;
      dismiss: () => void;
    }
  /** iPhone og iPad i Safari: vejledning, fordi Safari ikke kan åbne dialogen selv. */
  | { status: "iosGuide"; dismiss: () => void };
