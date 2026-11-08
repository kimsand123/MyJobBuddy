import type { DeferredInstallPrompt } from "./installPromptTypes";

// Platform og browser for installationskortet. Bruges kun af ViewModel (useInstallPromptWidget).
// beforeinstallprompt kommer tit, før Hjem er vist, så eventet fanges fra opstart
// (startInstallPromptCapture i main.tsx) og gemmes her, til kortet skal bruge det.

let deferredPrompt: DeferredInstallPrompt | undefined;
let captureStarted = false;
const listeners = new Set<() => void>();

function setDeferredPrompt(next: DeferredInstallPrompt | undefined): void {
  deferredPrompt = next;
  listeners.forEach((listener) => {
    listener();
  });
}

function isDeferredInstallPrompt(event: Event): event is Event & DeferredInstallPrompt {
  return (
    "prompt" in event &&
    typeof event.prompt === "function" &&
    "userChoice" in event &&
    event.userChoice instanceof Promise
  );
}

/** Starter lytningen på beforeinstallprompt og appinstalled. Kaldes én gang ved opstart. */
export function startInstallPromptCapture(): void {
  if (captureStarted) {
    return;
  }
  captureStarted = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!isDeferredInstallPrompt(event)) {
      return;
    }
    // Browserens egen besked udskydes; kortet på Hjem tilbyder installationen i stedet.
    event.preventDefault();
    setDeferredPrompt(event);
  });
  window.addEventListener("appinstalled", () => {
    setDeferredPrompt(undefined);
  });
}

export function subscribeToInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDeferredInstallPrompt(): DeferredInstallPrompt | undefined {
  return deferredPrompt;
}

/** Eventet kan kun bruges én gang; bagefter glemmes det. */
export function clearDeferredInstallPrompt(): void {
  setDeferredPrompt(undefined);
}

/** Kører appen allerede installeret (startet fra startskærmen)? */
export function isRunningInstalled(): boolean {
  if ("matchMedia" in window && window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  // Ældre iOS sætter kun navigator.standalone.
  return "standalone" in navigator && navigator.standalone === true;
}

// Chrome, Firefox og Edge på iOS har egne navne i user agent og viser ikke Safaris vejledning.
const otherIosBrowsers = /CriOS|FxiOS|EdgiOS/;

/** iPhone eller iPad i Safari, hvor appen kun kan føjes til hjemmeskærmen via Del-menuen. */
export function isIosSafari(): boolean {
  const userAgent = navigator.userAgent;
  const isIphoneOrIpad = /iPhone|iPad|iPod/.test(userAgent);
  // iPadOS udgiver sig for at være en Mac, men har touchskærm.
  const isIpadAsMac = /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1;
  if (!isIphoneOrIpad && !isIpadAsMac) {
    return false;
  }
  // Apps med indbygget browser (fx sociale medier) har ikke "Safari/" og kan ikke installere.
  return /Safari\//.test(userAgent) && !otherIosBrowsers.test(userAgent);
}
