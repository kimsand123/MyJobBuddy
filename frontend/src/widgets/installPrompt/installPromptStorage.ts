// Husker "Ikke nu" på installationskortet. Gemmer kun et flag, ingen persondata.
// localStorage kan være slået fra eller fuld; så huskes valget kun, til siden lukkes.

const dismissedKey = "myJobbuddy.installPrompt.dismissed";

export function readInstallPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(dismissedKey) === "true";
  } catch {
    return false;
  }
}

export function saveInstallPromptDismissed(): void {
  try {
    window.localStorage.setItem(dismissedKey, "true");
  } catch {
    // Uden storage skjules kortet kun, til siden lukkes.
  }
}
