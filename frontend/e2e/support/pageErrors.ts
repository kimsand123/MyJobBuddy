// Opsamler uventede exceptions og konsolfejl på en side, så en test kan fejle på dem.
import type { Page } from "@playwright/test";

export type PageErrorLog = {
  /** Alle fejl indtil nu: "pageerror: …" eller "console.error: …". */
  messages: () => string[];
};

export function collectPageErrors(page: Page): PageErrorLog {
  const messages: string[] = [];
  page.on("pageerror", (error) => {
    messages.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(`console.error: ${message.text()}`);
    }
  });
  return { messages: () => [...messages] };
}
