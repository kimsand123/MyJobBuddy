// Installationskortet øverst på Hjem: når kortet lukkes, får hilsenens overskrift ("Hej Maja",
// tabIndex -1) fokus. Vises hilsenen ikke, får sidens h1 "Hjem" fokus.
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeScreen } from "@/app/screens/HomeScreen";
import { fail } from "@/shared/result";
import {
  clearDeferredInstallPrompt,
  startInstallPromptCapture,
} from "@/widgets/installPrompt/installPromptPlatform";
import {
  dispatchInstallEvent,
  resetEnvironment,
  setEnvironment,
  userAgents,
} from "../../testUtils/installPromptEnvironment";
import {
  createOverridableApiClient,
  createSeedApiClient,
  createWrapper,
} from "../../testUtils/widgetTestProviders";

beforeAll(() => {
  startInstallPromptCapture();
});

beforeEach(() => {
  // Fejlende widgets logger via React i fejltesten. Det er forventet.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  clearDeferredInstallPrompt();
  resetEnvironment();
});

function renderHome(apiClient = createSeedApiClient()): void {
  const Wrapper = createWrapper({ apiClient, initialEntries: ["/"] });
  render(
    <Wrapper>
      <HomeScreen />
    </Wrapper>,
  );
}

describe("HomeScreen – installationskort", () => {
  it("HomeScreen_InstallCard_ShownAboveGreeting", async () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();

    // Act
    renderHome();

    // Assert
    const card = screen.getByRole("heading", { name: "Installér My Jobbuddy" });
    const greeting = await screen.findByRole("heading", { name: /Hej Maja/ });
    const cardIsBefore = card.compareDocumentPosition(greeting) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(cardIsBefore).toBeTruthy();
  });

  it("HomeScreen_NotNow_FocusOnGreetingHeading", async () => {
    // Arrange
    const user = userEvent.setup();
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();
    renderHome();
    const greeting = await screen.findByRole("heading", { name: /Hej Maja/ });

    // Act
    await user.click(screen.getByRole("button", { name: "Ikke nu" }));

    // Assert
    expect(greeting).toHaveFocus();
    expect(greeting).toHaveAttribute("tabindex", "-1");
  });

  it("HomeScreen_InstallChoiceMade_FocusOnGreetingHeading", async () => {
    // Arrange
    const user = userEvent.setup();
    setEnvironment({ userAgent: userAgents.androidChrome });
    const fake = dispatchInstallEvent();
    renderHome();
    const greeting = await screen.findByRole("heading", { name: /Hej Maja/ });

    // Act
    await user.click(screen.getByRole("button", { name: "Installér" }));
    await act(async () => {
      fake.choose("accepted");
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Ikke nu" })).not.toBeInTheDocument();
    });
    expect(greeting).toHaveFocus();
  });

  it("HomeScreen_IosGuideNotNow_FocusOnGreetingHeading", async () => {
    // Arrange
    const user = userEvent.setup();
    setEnvironment({ userAgent: userAgents.iphoneSafari, maxTouchPoints: 5 });
    renderHome();
    const greeting = await screen.findByRole("heading", { name: /Hej Maja/ });

    // Act
    await user.click(screen.getByRole("button", { name: "Ikke nu" }));

    // Assert
    expect(greeting).toHaveFocus();
  });

  it("HomeScreen_NotNowWithoutGreeting_FocusOnPageHeading", async () => {
    // Arrange: forsiden kan ikke hentes, så hilsenen vises ikke
    const user = userEvent.setup();
    setEnvironment({ userAgent: userAgents.androidChrome });
    dispatchInstallEvent();
    const apiClient = createOverridableApiClient((request) =>
      request.path === "/profile" ? fail("serverError", "x", { traceId: "t" }) : undefined,
    );
    renderHome(apiClient);
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Hej Maja/ })).not.toBeInTheDocument();
    });

    // Act
    await user.click(screen.getByRole("button", { name: "Ikke nu" }));

    // Assert
    expect(screen.getByRole("heading", { level: 1, name: "Hjem" })).toHaveFocus();
  });

  it("HomeScreen_RunningInstalled_NoInstallCard", async () => {
    // Arrange
    setEnvironment({ userAgent: userAgents.androidChrome, displayModeStandalone: true });
    dispatchInstallEvent();

    // Act
    renderHome();

    // Assert
    await screen.findByRole("heading", { name: /Hej Maja/ });
    expect(
      screen.queryByRole("heading", { name: "Installér My Jobbuddy" }),
    ).not.toBeInTheDocument();
  });
});
