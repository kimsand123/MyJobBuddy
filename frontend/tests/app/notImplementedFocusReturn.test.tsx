// Fokus tilbage efter "Ikke implementeret"-dialogen.
// show(trigger?) vælger udløseren: et HTMLElement direkte, ellers event.currentTarget, hvis det er
// et HTMLElement, ellers document.activeElement (ikke <body>). Når dialogen lukkes (OK, Esc eller
// klik uden for), får udløseren fokus igen, hvis den stadig findes i DOM'en. Et nyt show()-kald,
// mens dialogen er åben, ændrer ikke den gemte udløser.
// Knapperne, der åbner dialogen, klikkes med fireEvent, som ikke giver knappen fokus. Det svarer til
// et tryk i Safari på iPhone, hvor knappen heller ikke får fokus.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRef, useState, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotImplementedProvider } from "@/app/notImplemented/NotImplementedProvider";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Harness(): ReactElement {
  const showNotImplemented = useNotImplemented();
  const bellRef = useRef<HTMLButtonElement>(null);
  const otherRef = useRef<HTMLButtonElement>(null);
  const [bellMounted, setBellMounted] = useState(true);

  return (
    <>
      {bellMounted ? (
        <button type="button" ref={bellRef}>
          Klokke
        </button>
      ) : null}
      <button type="button" ref={otherRef}>
        Andet
      </button>
      <button type="button" onClick={() => showNotImplemented(bellRef.current ?? undefined)}>
        Åbn med klokke
      </button>
      <button type="button" onClick={() => showNotImplemented(otherRef.current ?? undefined)}>
        Åbn med andet
      </button>
      <button type="button" onClick={(event) => showNotImplemented(event)}>
        Åbn med event
      </button>
      <button type="button" onClick={() => showNotImplemented({ currentTarget: null })}>
        Åbn med tomt event
      </button>
      <button type="button" onClick={() => showNotImplemented()}>
        Åbn uden udløser
      </button>
      <button type="button" onClick={() => setBellMounted(false)}>
        Fjern klokke
      </button>
      <p>Baggrund</p>
    </>
  );
}

function renderHarness(): void {
  render(
    <NotImplementedProvider>
      <Harness />
    </NotImplementedProvider>,
  );
}

/** Klik uden at give knappen fokus. hidden: true, fordi resten af siden er skjult bag dialogen. */
function tapButton(name: string): void {
  fireEvent.click(screen.getByRole("button", { name, hidden: true }));
}

function button(name: string): HTMLElement {
  return screen.getByRole("button", { name, hidden: true });
}

function focusButton(name: string): void {
  act(() => {
    button(name).focus();
  });
}

describe("show(element)", () => {
  it("show_ElementWithoutFocusThenOk_FocusOnElement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    tapButton("Åbn med klokke");
    expect(screen.getByRole("dialog", { name: "Ikke implementeret" })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button("Klokke")).toHaveFocus();
  });

  it("show_ElementWithoutFocusThenEscape_FocusOnElement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    tapButton("Åbn med klokke");

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button("Klokke")).toHaveFocus();
  });

  it("show_ElementWithoutFocusThenClickOutside_FocusOnElement", async () => {
    // Arrange: Radix slår pointer-events fra uden for dialogen, så kontrollen slås fra her
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHarness();
    tapButton("Åbn med klokke");

    // Act
    await user.click(screen.getByText("Baggrund"));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button("Klokke")).toHaveFocus();
  });

  it("show_ElementWhileOtherElementHasFocus_FocusOnGivenElement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    focusButton("Andet");
    tapButton("Åbn med klokke");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(button("Klokke")).toHaveFocus();
  });
});

describe("show(event)", () => {
  it("show_EventWithHtmlElementCurrentTarget_FocusOnCurrentTarget", async () => {
    // Arrange: et andet element har fokus, så kun currentTarget kan give det rigtige resultat
    const user = userEvent.setup();
    renderHarness();
    focusButton("Andet");
    tapButton("Åbn med event");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(button("Åbn med event")).toHaveFocus();
  });

  it("show_EventWithoutHtmlElementCurrentTarget_FocusOnActiveElement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    focusButton("Andet");
    tapButton("Åbn med tomt event");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(button("Andet")).toHaveFocus();
  });
});

describe("show()", () => {
  it("show_WithoutTrigger_FocusReturnsToActiveElement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    focusButton("Andet");
    tapButton("Åbn uden udløser");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(button("Andet")).toHaveFocus();
  });

  it("show_WithoutTriggerAndNothingFocused_ClosesWithoutError", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    expect(document.activeElement).toBe(document.body);
    tapButton("Åbn uden udløser");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("show() mens dialogen er åben", () => {
  it("show_CalledAgainWhileOpen_FocusReturnsToFirstTrigger", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    tapButton("Åbn med klokke");
    tapButton("Åbn med andet");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button("Klokke")).toHaveFocus();
    expect(button("Andet")).not.toHaveFocus();
  });

  it("show_CalledAgainWhileOpen_StillOneDialog", () => {
    // Arrange
    renderHarness();
    tapButton("Åbn med klokke");

    // Act
    tapButton("Åbn med andet");

    // Assert
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});

describe("udløser fjernet", () => {
  it("show_TriggerRemovedBeforeClose_ClosesWithoutError", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    tapButton("Åbn med klokke");
    tapButton("Fjern klokke");

    // Act
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Klokke" })).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("show_TriggerRemovedBeforeClose_CanOpenAgain", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHarness();
    tapButton("Åbn med klokke");
    tapButton("Fjern klokke");
    await user.click(screen.getByRole("button", { name: "OK" }));

    // Act
    tapButton("Åbn uden udløser");

    // Assert
    expect(screen.getByRole("dialog", { name: "Ikke implementeret" })).toBeInTheDocument();
  });
});
