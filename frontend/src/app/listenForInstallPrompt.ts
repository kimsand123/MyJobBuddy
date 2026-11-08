import { startInstallPromptCapture } from "@/widgets/installPrompt/installPromptPlatform";

// Lytter efter browserens tilbud om at installere appen (Android og computer) fra opstart, fordi
// det kan komme, før Hjem er vist. Installationskortet på Hjem bruger det, når det vises.

export function listenForInstallPrompt(): void {
  startInstallPromptCapture();
}
