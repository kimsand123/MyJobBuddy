// "appinstalled" skjuler kortet. I sin egen fil, fordi eventet kan ændre tilstand, der gælder
// resten af sessionen (Vitest giver hver fil sine egne moduler).
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearDeferredInstallPrompt,
  startInstallPromptCapture,
} from "@/widgets/installPrompt/installPromptPlatform";
import { useInstallPromptWidget } from "@/widgets/installPrompt/useInstallPromptWidget";
import {
  dispatchInstallEvent,
  resetEnvironment,
  setEnvironment,
  userAgents,
} from "../../testUtils/installPromptEnvironment";

beforeAll(() => {
  startInstallPromptCapture();
});

afterEach(() => {
  cleanup();
  clearDeferredInstallPrompt();
  resetEnvironment();
});

describe("appinstalled", () => {
  it("useInstallPromptWidget_AppInstalledWhileShown_Hidden", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());
    expect(result.current.status).toBe("installButton");

    // Act
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    // Assert
    expect(result.current.status).toBe("hidden");
  });
});
