// "Ikke implementeret"-dialogen åbnes via useNotImplemented(). Titel "Ikke implementeret", teksten
// "Denne funktion er ikke en del af demoen endnu." og knappen "OK".
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotImplementedDialog } from "@/app/notImplemented/NotImplementedDialog";
import { NotImplementedProvider } from "@/app/notImplemented/NotImplementedProvider";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";

afterEach(() => {
  cleanup();
});

function UploadButton(): ReactElement {
  const showNotImplemented = useNotImplemented();
  return (
    <button type="button" onClick={showNotImplemented}>
      Upload lønseddel
    </button>
  );
}

function renderWithProvider(): void {
  render(
    <NotImplementedProvider>
      <UploadButton />
    </NotImplementedProvider>,
  );
}

describe("useNotImplemented", () => {
  it("useNotImplemented_Called_OpensDialogWithTitle", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();

    // Act
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Ikke implementeret" })).toBeInTheDocument();
  });

  it("useNotImplemented_Called_DialogShowsTextAndOkButton", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();

    // Act
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Assert
    const dialog = screen.getByRole("dialog", { name: "Ikke implementeret" });
    expect(dialog).toHaveAccessibleDescription("Denne funktion er ikke en del af demoen endnu.");
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("useNotImplemented_NotCalled_NoDialog", () => {
    // Act
    renderWithProvider();

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("useNotImplemented_DialogOpen_FocusIsInsideDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();

    // Act
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Assert
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("useNotImplemented_OkClicked_ClosesDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("useNotImplemented_OkClicked_FocusReturnsToTrigger", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();
    const trigger = screen.getByRole("button", { name: "Upload lønseddel" });
    await user.click(trigger);

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(trigger).toHaveFocus();
  });

  it("useNotImplemented_EscapePressed_ClosesDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("useNotImplemented_OpenedTwice_DialogOpensAgain", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Ikke implementeret" })).toBeInTheDocument();
  });

  it("useNotImplemented_WithoutProvider_DoesNothing", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UploadButton />);

    // Act
    await user.click(screen.getByRole("button", { name: "Upload lønseddel" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("NotImplementedDialog", () => {
  it("NotImplementedDialog_OpenFalse_RendersNoDialog", () => {
    // Act
    render(<NotImplementedDialog open={false} onOpenChange={vi.fn()} />);

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("NotImplementedDialog_OkClicked_CallsOnOpenChangeWithFalse", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<NotImplementedDialog open onOpenChange={onOpenChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
