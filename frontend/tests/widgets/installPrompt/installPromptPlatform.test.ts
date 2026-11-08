// Platform og hukommelse for installationskortet: iPhone/iPad i Safari, "kører installeret",
// fangst af beforeinstallprompt og localStorage (også når den kaster fejl).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosSafari,
  isRunningInstalled,
  startInstallPromptCapture,
  subscribeToInstallPrompt,
} from "@/widgets/installPrompt/installPromptPlatform";
import {
  readInstallPromptDismissed,
  saveInstallPromptDismissed,
} from "@/widgets/installPrompt/installPromptStorage";
import {
  dismissedStorageKey,
  dispatchInstallEvent,
  resetEnvironment,
  setEnvironment,
  userAgents,
} from "../../testUtils/installPromptEnvironment";

beforeAll(() => {
  startInstallPromptCapture();
});

afterEach(() => {
  clearDeferredInstallPrompt();
  resetEnvironment();
});

describe("isIosSafari", () => {
  it.each([
    ["iPhone Safari", userAgents.iphoneSafari, 5],
    ["iPad Safari", userAgents.ipadSafari, 5],
    ["iPod Safari", userAgents.ipodSafari, 5],
    ["iPad med desktop-UA (Macintosh og berøring)", userAgents.macSafari, 5],
  ])("isIosSafari_%s_True", (_label, userAgent, maxTouchPoints) => {
    // Arrange
    setEnvironment({ userAgent, maxTouchPoints });

    // Act
    const result = isIosSafari();

    // Assert
    expect(result).toBe(true);
  });

  it.each([
    ["Mac Safari uden berøring", userAgents.macSafari, 0],
    ["Mac Safari med ét berøringspunkt", userAgents.macSafari, 1],
    ["Chrome på iPhone (CriOS)", userAgents.iphoneChrome, 5],
    ["Firefox på iPhone (FxiOS)", userAgents.iphoneFirefox, 5],
    ["Edge på iPhone (EdgiOS)", userAgents.iphoneEdge, 5],
    ["app-webview på iPhone uden Safari/", userAgents.iphoneInAppWebView, 5],
    ["Chrome på Android", userAgents.androidChrome, 5],
    ["Firefox på computer", userAgents.desktopFirefox, 0],
  ])("isIosSafari_%s_False", (_label, userAgent, maxTouchPoints) => {
    // Arrange
    setEnvironment({ userAgent, maxTouchPoints });

    // Act
    const result = isIosSafari();

    // Assert
    expect(result).toBe(false);
  });
});

describe("isRunningInstalled", () => {
  it("isRunningInstalled_DisplayModeStandalone_True", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome, displayModeStandalone: true });

    // Act & Assert
    expect(isRunningInstalled()).toBe(true);
  });

  it("isRunningInstalled_NavigatorStandaloneTrue_True", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, navigatorStandalone: true });

    // Act & Assert
    expect(isRunningInstalled()).toBe(true);
  });

  it("isRunningInstalled_InBrowserTab_False", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, navigatorStandalone: false });

    // Act & Assert
    expect(isRunningInstalled()).toBe(false);
  });
});

describe("fangst af beforeinstallprompt", () => {
  it("getDeferredInstallPrompt_BeforeEvent_Undefined", () => {
    expect(getDeferredInstallPrompt()).toBeUndefined();
  });

  it("getDeferredInstallPrompt_EventDispatched_ReturnsEventWithPrompt", () => {
    // Act
    const fake = dispatchInstallEvent();

    // Assert
    expect(getDeferredInstallPrompt()).toBe(fake.event);
  });

  it("clearDeferredInstallPrompt_AfterEvent_ForgetsEvent", () => {
    // Arrange
    dispatchInstallEvent();

    // Act
    clearDeferredInstallPrompt();

    // Assert
    expect(getDeferredInstallPrompt()).toBeUndefined();
  });

  it("subscribeToInstallPrompt_EventDispatched_ListenerCalled", () => {
    // Arrange
    const listener = vi.fn();
    const unsubscribe = subscribeToInstallPrompt(listener);

    // Act
    dispatchInstallEvent();

    // Assert
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("subscribeToInstallPrompt_Unsubscribed_ListenerNotCalled", () => {
    // Arrange
    const listener = vi.fn();
    const unsubscribe = subscribeToInstallPrompt(listener);
    unsubscribe();

    // Act
    dispatchInstallEvent();

    // Assert
    expect(listener).not.toHaveBeenCalled();
  });

  it("startInstallPromptCapture_CalledAgain_EventStillCapturedOnce", () => {
    // Arrange
    startInstallPromptCapture();
    const listener = vi.fn();
    const unsubscribe = subscribeToInstallPrompt(listener);

    // Act
    const fake = dispatchInstallEvent();

    // Assert
    expect(getDeferredInstallPrompt()).toBe(fake.event);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("beforeinstallprompt_WithoutPromptFunction_NotCaptured", () => {
    // Act
    window.dispatchEvent(new Event("beforeinstallprompt"));

    // Assert
    expect(getDeferredInstallPrompt()).toBeUndefined();
  });
});

describe("installPromptStorage", () => {
  it("readInstallPromptDismissed_NothingSaved_False", () => {
    expect(readInstallPromptDismissed()).toBe(false);
  });

  it("saveInstallPromptDismissed_Called_StoresTrueUnderKey", () => {
    // Act
    saveInstallPromptDismissed();

    // Assert
    expect(window.localStorage.getItem(dismissedStorageKey)).toBe("true");
    expect(readInstallPromptDismissed()).toBe(true);
  });

  it.each(["false", "ja", ""])("readInstallPromptDismissed_Value'%s'_False", (value) => {
    // Arrange
    window.localStorage.setItem(dismissedStorageKey, value);

    // Act & Assert
    expect(readInstallPromptDismissed()).toBe(false);
  });

  it("readInstallPromptDismissed_StorageThrows_FalseWithoutError", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // Act & Assert
    expect(() => readInstallPromptDismissed()).not.toThrow();
    expect(readInstallPromptDismissed()).toBe(false);
  });

  it("saveInstallPromptDismissed_StorageThrows_NoError", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    // Act & Assert
    expect(() => {
      saveInstallPromptDismissed();
    }).not.toThrow();
  });
});
