import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Bell } from "lucide-react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/AppHeader";

afterEach(() => {
  cleanup();
});

function renderHeader(header: ReactElement): void {
  render(<MemoryRouter>{header}</MemoryRouter>);
}

describe("AppHeader", () => {
  it("AppHeader_WithTitle_ShowsTitleAsHeading", () => {
    // Act
    renderHeader(<AppHeader title="Vagter" />);

    // Assert
    expect(screen.getByRole("heading", { name: "Vagter" })).toBeInTheDocument();
  });

  it("AppHeader_WithOnBack_BackButtonCallsOnBack", async () => {
    // Arrange
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderHeader(<AppHeader title="Vagter" onBack={onBack} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Tilbage" }));

    // Assert
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("AppHeader_WithoutOnBack_NoBackButton", () => {
    // Act
    renderHeader(<AppHeader title="Vagter" />);

    // Assert
    expect(screen.queryByRole("button", { name: "Tilbage" })).not.toBeInTheDocument();
  });

  it("AppHeader_WithAction_ActionButtonCallsOnClick", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderHeader(<AppHeader action={{ icon: Bell, label: "Notifikationer", onClick }} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Notifikationer" }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("AppHeader_ActionClicked_OnClickGetsTheButton", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderHeader(<AppHeader action={{ icon: Bell, label: "Notifikationer", onClick }} />);
    const actionButton = screen.getByRole("button", { name: "Notifikationer" });

    // Act
    await user.click(actionButton);

    // Assert
    expect(onClick).toHaveBeenCalledWith(actionButton);
  });

  it("AppHeader_ActionTappedWithoutFocus_OnClickGetsTheButton", () => {
    // Arrange: fireEvent giver ikke knappen fokus, ligesom et tryk i Safari på iPhone
    const onClick = vi.fn();
    renderHeader(<AppHeader action={{ icon: Bell, label: "Notifikationer", onClick }} />);
    const actionButton = screen.getByRole("button", { name: "Notifikationer" });

    // Act
    fireEvent.click(actionButton);

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(actionButton);
  });

  it("AppHeader_ActionWithBadge_ButtonNameSaysNew", () => {
    // Act
    renderHeader(
      <AppHeader action={{ icon: Bell, label: "Notifikationer", onClick: vi.fn(), badge: true }} />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Notifikationer (nye)" })).toBeInTheDocument();
  });

  it("AppHeader_ActionDisabled_ButtonIsDisabled", () => {
    // Act
    renderHeader(
      <AppHeader
        action={{ icon: Bell, label: "Notifikationer", onClick: vi.fn(), disabled: true }}
      />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Notifikationer" })).toBeDisabled();
  });

  it("AppHeader_WithoutAction_NoActionButton", () => {
    // Act
    renderHeader(<AppHeader title="Vagter" />);

    // Assert
    expect(screen.queryByRole("button", { name: /Notifikationer/ })).not.toBeInTheDocument();
  });
});
