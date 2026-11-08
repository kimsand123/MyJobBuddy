// Testmiljø for installationskortet: user agent, berøringspunkter, "kører installeret" og et
// syntetisk beforeinstallprompt-event med en prompt(), testen selv styrer.
import { vi, type Mock } from "vitest";
import { createDeferred } from "./widgetTestProviders";

export const userAgents = {
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  desktopFirefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ipadSafari:
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ipodSafari:
    "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15",
  iphoneEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0.2849.80 Mobile/15E148 Safari/605.1.15",
  iphoneInAppWebView:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]",
} as const;

type Environment = {
  userAgent: string;
  maxTouchPoints?: number;
  displayModeStandalone?: boolean;
  navigatorStandalone?: boolean;
};

const ownNavigatorProperties = ["userAgent", "maxTouchPoints", "standalone"] as const;

function defineOwn(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
}

/** Sætter platformen. Nulstil med resetEnvironment() efter testen. */
export function setEnvironment(environment: Environment): void {
  defineOwn(window.navigator, "userAgent", environment.userAgent);
  defineOwn(window.navigator, "maxTouchPoints", environment.maxTouchPoints ?? 0);
  if (environment.navigatorStandalone !== undefined) {
    defineOwn(window.navigator, "standalone", environment.navigatorStandalone);
  }
  const standalone = environment.displayModeStandalone ?? false;
  defineOwn(window, "matchMedia", (query: string) => ({
    matches: standalone && query.includes("standalone"),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

export function resetEnvironment(): void {
  for (const key of ownNavigatorProperties) {
    Reflect.deleteProperty(window.navigator, key);
  }
  Reflect.deleteProperty(window, "matchMedia");
  window.localStorage.clear();
  vi.restoreAllMocks();
}

export type FakeInstallEvent = {
  event: Event;
  prompt: Mock<() => Promise<void>>;
  /** Brugerens valg i browserens dialog; testen afgør, hvornår det kommer. */
  choose: (outcome: "accepted" | "dismissed") => void;
};

export function createFakeInstallEvent(): FakeInstallEvent {
  const choice = createDeferred<{ outcome: string; platform: string }>();
  const prompt = vi.fn(() => Promise.resolve());
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.defineProperty(event, "prompt", { value: prompt });
  Object.defineProperty(event, "userChoice", { value: choice.promise });
  return {
    event,
    prompt,
    choose: (outcome) => {
      choice.resolve({ outcome, platform: "web" });
    },
  };
}

/** Browseren sender beforeinstallprompt. */
export function dispatchInstallEvent(): FakeInstallEvent {
  const fake = createFakeInstallEvent();
  window.dispatchEvent(fake.event);
  return fake;
}

export const dismissedStorageKey = "myJobbuddy.installPrompt.dismissed";
