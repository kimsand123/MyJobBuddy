// App-skallen med de rigtige ruter i en memory-router: dokumenttitel, sidetitel, fanebjælke og
// klokken på Hjem. Appen får en mock-ApiClient uden forsinkelse og demoens clock.
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/AppProviders";
import { createQueryClient } from "@/app/queryClient";
import { appRoutes } from "@/app/routes";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import { demoClock } from "@/shared/clock";

afterEach(() => {
  cleanup();
});

type AppRouter = ReturnType<typeof createMemoryRouter>;

function renderApp(initialEntries: string[], initialIndex?: number): AppRouter {
  const router = createMemoryRouter(appRoutes, { initialEntries, initialIndex });
  render(
    <AppProviders
      queryClient={createQueryClient()}
      apiClient={createMockApiClient({ delayMs: 0, store: createSeedStore() })}
      clock={demoClock}
    >
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

function tab(name: string): HTMLElement {
  const navigation = screen.getByRole("navigation", { name: "Hovedmenu" });
  return within(navigation).getByRole("link", { name });
}

const routes = [
  ["/", "Hjem"],
  ["/vagter", "Vagter"],
  ["/loen", "Løn"],
  ["/ai", "AI"],
  ["/mig", "Mig"],
  ["/findes-ikke", "Siden findes ikke"],
  ["/vagter/findes-ikke", "Siden findes ikke"],
] as const;

describe("routes – titler", () => {
  it.each(routes)("route_%s_DocumentTitleIsPageAndAppName", async (path, pageTitle) => {
    // Act
    renderApp([path]);

    // Assert
    await waitFor(() => {
      expect(document.title).toBe(`${pageTitle} – My Jobbuddy`);
    });
  });

  it.each(routes)("route_%s_HasPageHeadingLevel1", async (path, pageTitle) => {
    // Act
    renderApp([path]);

    // Assert
    expect(await screen.findByRole("heading", { level: 1, name: pageTitle })).toBeInTheDocument();
  });

  it.each(["/Vagter", "/vagter/", "/VAGTER"])("route_%s_ShowsVagter", async (path) => {
    // Act
    renderApp([path]);

    // Assert
    expect(await screen.findByRole("heading", { level: 1, name: "Vagter" })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe("Vagter – My Jobbuddy");
    });
  });
});

describe("routes – fanebjælke", () => {
  it.each([
    ["/", "Hjem"],
    ["/ai", "AI"],
    ["/mig", "Mig"],
  ])("route_%s_TabOfOwnPageHasAriaCurrentPage", async (path, tabName) => {
    // Act
    renderApp([path]);

    // Assert
    await screen.findByRole("navigation", { name: "Hovedmenu" });
    expect(tab(tabName)).toHaveAttribute("aria-current", "page");
    const others = ["Hjem", "AI", "Mig"].filter((name) => name !== tabName);
    for (const name of others) {
      expect(tab(name)).not.toHaveAttribute("aria-current");
    }
  });

  it.each(["/vagter", "/loen"])("route_%s_HomeTabHasAriaCurrentTrue", async (path) => {
    // Act
    renderApp([path]);

    // Assert
    await screen.findByRole("navigation", { name: "Hovedmenu" });
    expect(tab("Hjem")).toHaveAttribute("aria-current", "true");
    expect(tab("AI")).not.toHaveAttribute("aria-current");
    expect(tab("Mig")).not.toHaveAttribute("aria-current");
  });

  it("route_UnknownPath_NoTabHasAriaCurrent", async () => {
    // Act
    renderApp(["/findes-ikke"]);

    // Assert
    await screen.findByRole("navigation", { name: "Hovedmenu" });
    for (const name of ["Hjem", "AI", "Mig"]) {
      expect(tab(name)).not.toHaveAttribute("aria-current");
    }
  });

  it("route_ClickAiTab_NavigatesToAi", async () => {
    // Arrange
    const user = userEvent.setup();
    const router = renderApp(["/"]);
    await screen.findByRole("navigation", { name: "Hovedmenu" });

    // Act
    await user.click(tab("AI"));

    // Assert
    expect(router.state.location.pathname).toBe("/ai");
    await waitFor(() => {
      expect(document.title).toBe("AI – My Jobbuddy");
    });
    expect(tab("AI")).toHaveAttribute("aria-current", "page");
  });
});

describe("routes – AppHeader", () => {
  it("route_Home_NoBackButton", async () => {
    // Act
    renderApp(["/"]);

    // Assert
    await screen.findByRole("navigation", { name: "Hovedmenu" });
    expect(screen.queryByRole("button", { name: "Tilbage" })).not.toBeInTheDocument();
  });

  it("route_HomeBellClicked_OpensNotImplementedDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    renderApp(["/"]);

    // Act
    await user.click(await screen.findByRole("button", { name: /^Notifikationer/ }));

    // Assert
    const dialog = screen.getByRole("dialog", { name: "Ikke implementeret" });
    expect(dialog).toHaveAccessibleDescription("Denne funktion er ikke en del af demoen endnu.");
  });

  it("route_HomeBellTappedWithoutFocus_FocusOnBellAfterOk", async () => {
    // Arrange: fireEvent giver ikke klokken fokus, ligesom et tryk i Safari på iPhone
    const user = userEvent.setup();
    renderApp(["/"]);
    const bell = await screen.findByRole("button", { name: /^Notifikationer/ });
    fireEvent.click(bell);
    expect(screen.getByRole("dialog", { name: "Ikke implementeret" })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bell).toHaveFocus();
  });

  it("route_HomeBellDialogOk_ClosesDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    renderApp(["/"]);
    await user.click(await screen.findByRole("button", { name: /^Notifikationer/ }));

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
