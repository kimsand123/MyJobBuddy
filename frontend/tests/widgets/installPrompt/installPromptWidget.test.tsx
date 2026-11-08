// Installationskortet: ViewModel (hidden, installButton, iosGuide) og View. Installér kalder
// prompt() én gang, venter på brugerens valg og skjuler kortet uanset valg. "Ikke nu" skjuler og
// huskes. Aldrig kort, når appen kører installeret, eller i andre browsere.
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { da } from "@/texts/da";
import { InstallPromptWidget } from "@/widgets/installPrompt/InstallPromptWidget";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  startInstallPromptCapture,
} from "@/widgets/installPrompt/installPromptPlatform";
import type { InstallPromptWidgetState } from "@/widgets/installPrompt/installPromptTypes";
import { useInstallPromptWidget } from "@/widgets/installPrompt/useInstallPromptWidget";
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
  cleanup();
  clearDeferredInstallPrompt();
  resetEnvironment();
});

function installButtonState(
  state: InstallPromptWidgetState,
): Extract<InstallPromptWidgetState, { status: "installButton" }> {
  if (state.status !== "installButton") {
    throw new Error(`Forventede installButton, fik ${state.status}`);
  }
  return state;
}

function iosGuideState(
  state: InstallPromptWidgetState,
): Extract<InstallPromptWidgetState, { status: "iosGuide" }> {
  if (state.status !== "iosGuide") {
    throw new Error(`Forventede iosGuide, fik ${state.status}`);
  }
  return state;
}

describe("useInstallPromptWidget – Android og computer", () => {
  it("useInstallPromptWidget_NoEvent_Hidden", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_EventBeforeRender_InstallButton", () => {
    // Arrange: eventet kom ved opstart, før Hjem blev vist
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("installButton");
  });

  it("useInstallPromptWidget_EventAfterRender_InstallButton", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    act(() => {
      dispatchInstallEvent();
    });

    // Assert
    expect(result.current.status).toBe("installButton");
  });

  it("useInstallPromptWidget_Install_PromptCalledOnceAndHiddenAfterChoice", async () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    let installing: Promise<void> = Promise.resolve();
    act(() => {
      installing = installButtonState(result.current).install();
    });
    await act(async () => {
      await Promise.resolve();
    });
    const statusBeforeChoice = result.current.status;
    await act(async () => {
      fake.choose("accepted");
      await installing;
    });

    // Assert
    expect(fake.prompt).toHaveBeenCalledTimes(1);
    expect(statusBeforeChoice).toBe("installButton");
    expect(result.current.status).toBe("hidden");
    expect(getDeferredInstallPrompt()).toBeUndefined();
  });

  it("useInstallPromptWidget_InstallDialogDismissed_HiddenAnyway", async () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    await act(async () => {
      const installing = installButtonState(result.current).install();
      fake.choose("dismissed");
      await installing;
    });

    // Assert
    expect(fake.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_InstallDialogDismissed_NotRememberedAsNotNow", async () => {
    // Arrange: afvisning i browserens dialog er ikke det samme som "Ikke nu"
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    await act(async () => {
      const installing = installButtonState(result.current).install();
      fake.choose("dismissed");
      await installing;
    });

    // Assert
    expect(window.localStorage.getItem(dismissedStorageKey)).toBeNull();
  });

  it("useInstallPromptWidget_NotNow_HiddenAndRemembered", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    act(() => {
      installButtonState(result.current).dismiss();
    });

    // Assert
    expect(result.current.status).toBe("hidden");
    expect(window.localStorage.getItem(dismissedStorageKey)).toBe("true");
  });

  it("useInstallPromptWidget_RememberedNotNow_HiddenEvenWithEvent", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    window.localStorage.setItem(dismissedStorageKey, "true");
    dispatchInstallEvent();

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_RunningInstalled_HiddenEvenWithEvent", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome, displayModeStandalone: true });
    dispatchInstallEvent();

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_OtherBrowserWithoutEvent_Hidden", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.desktopFirefox });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_StorageThrows_StillShownAndNotNowHides", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    dispatchInstallEvent();
    const { result } = renderHook(() => useInstallPromptWidget());
    expect(result.current.status).toBe("installButton");

    // Act
    act(() => {
      installButtonState(result.current).dismiss();
    });

    // Assert
    expect(result.current.status).toBe("hidden");
  });
});

describe("useInstallPromptWidget – iPhone og iPad i Safari", () => {
  it.each([
    ["iPhone", userAgents.iphoneSafari, 5],
    ["iPad", userAgents.ipadSafari, 5],
    ["iPad med desktop-UA", userAgents.macSafari, 5],
  ])("useInstallPromptWidget_%sSafari_IosGuide", (_label, userAgent, maxTouchPoints) => {
    // Arrange
    setEnvironment({ userAgent, maxTouchPoints });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("iosGuide");
  });

  it.each([
    ["Chrome", userAgents.iphoneChrome],
    ["Firefox", userAgents.iphoneFirefox],
    ["Edge", userAgents.iphoneEdge],
  ])("useInstallPromptWidget_%sOnIphone_Hidden", (_label, userAgent) => {
    // Arrange
    setEnvironment({ userAgent, maxTouchPoints: 5 });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_IosStartedFromHomeScreen_Hidden", () => {
    // Arrange
    setEnvironment({
      userAgent: userAgents.iphoneSafari,
      maxTouchPoints: 5,
      navigatorStandalone: true,
    });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_IosNotNow_HiddenAndRemembered", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });
    const { result } = renderHook(() => useInstallPromptWidget());

    // Act
    act(() => {
      iosGuideState(result.current).dismiss();
    });

    // Assert
    expect(result.current.status).toBe("hidden");
    expect(window.localStorage.getItem(dismissedStorageKey)).toBe("true");
  });

  it("useInstallPromptWidget_IosRememberedNotNow_Hidden", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });
    window.localStorage.setItem(dismissedStorageKey, "true");

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("hidden");
  });

  it("useInstallPromptWidget_IosStorageThrows_StillShown", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // Act
    const { result } = renderHook(() => useInstallPromptWidget());

    // Assert
    expect(result.current.status).toBe("iosGuide");
  });
});

describe("InstallPromptWidget", () => {
  it("InstallPromptWidget_Hidden_RendersNothing", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });

    // Act
    const { container } = render(<InstallPromptWidget onClosed={vi.fn()} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("InstallPromptWidget_InstallButton_TitleTextAndBothButtons", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();

    // Act
    render(<InstallPromptWidget onClosed={vi.fn()} />);

    // Assert
    expect(screen.getByRole("heading", { name: "Installér My Jobbuddy" })).toBeInTheDocument();
    expect(
      screen.getByText("Få appen på din startskærm – den virker også uden net."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Installér" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ikke nu" })).toBeInTheDocument();
  });

  it("InstallPromptWidget_InstallClicked_PromptOnceThenHiddenAndOnClosed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClosed = vi.fn();
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    render(<InstallPromptWidget onClosed={onClosed} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Installér" }));
    const textBeforeChoice = document.body.textContent ?? "";
    await act(async () => {
      fake.choose("accepted");
      await Promise.resolve();
    });

    // Assert: kortet står, mens browserens dialog er åben, og forsvinder efter valget
    expect(fake.prompt).toHaveBeenCalledTimes(1);
    expect(textBeforeChoice).toContain(da.installPrompt.title);
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: da.installPrompt.title }),
      ).not.toBeInTheDocument();
    });
    expect(onClosed).toHaveBeenCalled();
  });

  it("InstallPromptWidget_InstallClickedTwiceQuickly_PromptOnlyOnce", async () => {
    // Arrange
    const user = userEvent.setup();
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    render(<InstallPromptWidget onClosed={vi.fn()} />);
    const install = screen.getByRole("button", { name: "Installér" });

    // Act
    await user.click(install);
    if (install.isConnected && !install.hasAttribute("disabled")) {
      await user.click(install);
    }
    await act(async () => {
      fake.choose("dismissed");
      await Promise.resolve();
    });

    // Assert
    expect(fake.prompt).toHaveBeenCalledTimes(1);
  });

  it("InstallPromptWidget_NotNowClicked_HiddenRememberedAndOnClosed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClosed = vi.fn();
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();
    render(<InstallPromptWidget onClosed={onClosed} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Ikke nu" }));

    // Assert
    expect(screen.queryByRole("heading", { name: da.installPrompt.title })).not.toBeInTheDocument();
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(dismissedStorageKey)).toBe("true");
  });

  it("InstallPromptWidget_IosGuide_StepsWithoutInstallButton", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });

    // Act
    render(<InstallPromptWidget onClosed={vi.fn()} />);

    // Assert
    expect(screen.getByRole("heading", { name: "Installér My Jobbuddy" })).toBeInTheDocument();
    // Numrene "1." og "2." kommer fra den nummererede liste (se næste test)
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Tryk på Del\s*\(eller ⋯ og så Del\)/);
    expect(text).toContain("Vælg “Føj til hjemmeskærm”");
    expect(screen.queryByRole("button", { name: "Installér" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ikke nu" })).toBeInTheDocument();
  });

  it("InstallPromptWidget_IosGuide_StepsAreAnOrderedList", () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });

    // Act
    render(<InstallPromptWidget onClosed={vi.fn()} />);

    // Assert: en nummereret liste, så trinene vises og læses som 1. og 2.
    expect(screen.getByRole("list").tagName).toBe("OL");
    const items = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("Tryk på Del");
    expect(items[1]).toContain("Føj til hjemmeskærm");
  });

  it("InstallPromptWidget_IosNotNowClicked_HiddenAndOnClosed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClosed = vi.fn();
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });
    render(<InstallPromptWidget onClosed={onClosed} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Ikke nu" }));

    // Assert
    expect(screen.queryByRole("heading", { name: da.installPrompt.title })).not.toBeInTheDocument();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
