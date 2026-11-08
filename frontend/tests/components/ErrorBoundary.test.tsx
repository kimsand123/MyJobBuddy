// En Error Boundary pr. widget: én fejlende widget vælter ikke resten. Fallback med "Prøv igen", og
// WidgetErrorAnnouncer annoncerer fejlen i en live region (role="status") uden at flytte fokus.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { WidgetErrorAnnouncer } from "@/components/WidgetErrorAnnouncer";

beforeEach(() => {
  // React logger fangede fejl med console.error. Det er forventet her og skjules i output.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

type ThrowingWidgetProps = { shouldThrow: () => boolean };

function ThrowingWidget({ shouldThrow }: ThrowingWidgetProps): ReactElement {
  if (shouldThrow()) {
    throw new Error("Syntetisk widgetfejl");
  }
  return <p>Widgetindhold</p>;
}

/** En widget, der fejler, når man trykker på knappen ved siden af. */
function FailOnDemand(): ReactElement {
  const [failing, setFailing] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setFailing(true)}>
        Fremkald fejl
      </button>
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => failing} />
      </WidgetErrorBoundary>
    </>
  );
}

describe("WidgetErrorBoundary", () => {
  it("WidgetErrorBoundary_ChildRendersFine_ShowsChild", () => {
    // Act
    render(
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => false} />
      </WidgetErrorBoundary>,
    );

    // Assert
    expect(screen.getByText("Widgetindhold")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Prøv igen" })).not.toBeInTheDocument();
  });

  it("WidgetErrorBoundary_ChildThrows_ShowsFallbackWithRetry", () => {
    // Act
    render(
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => true} />
      </WidgetErrorBoundary>,
    );

    // Assert
    expect(screen.getByRole("heading", { name: "Noget gik galt" })).toBeInTheDocument();
    expect(
      screen.getByText("Denne del af siden kunne ikke vises. Resten af appen virker stadig."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeInTheDocument();
    expect(screen.queryByText("Widgetindhold")).not.toBeInTheDocument();
  });

  it("WidgetErrorBoundary_RetryAfterErrorIsGone_ShowsChildAgain", async () => {
    // Arrange
    const user = userEvent.setup();
    let failing = true;
    render(
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => failing} />
      </WidgetErrorBoundary>,
    );
    failing = false;

    // Act
    await user.click(screen.getByRole("button", { name: "Prøv igen" }));

    // Assert
    expect(screen.getByText("Widgetindhold")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Noget gik galt" })).not.toBeInTheDocument();
  });

  it("WidgetErrorBoundary_ChildThrowsWithoutAnnouncer_AnnouncesItselfInStatusRegion", () => {
    // Arrange
    vi.useFakeTimers();

    // Act
    render(
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => true} />
      </WidgetErrorBoundary>,
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Assert
    const status = screen.getByRole("status");
    expect(status.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("WidgetErrorBoundary_RetryWhileStillFailing_ShowsFallbackAgain", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <WidgetErrorBoundary>
        <ThrowingWidget shouldThrow={() => true} />
      </WidgetErrorBoundary>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Prøv igen" }));

    // Assert
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeInTheDocument();
  });

  it("WidgetErrorBoundary_CustomFallback_ShowsCustomFallback", () => {
    // Act
    render(
      <WidgetErrorBoundary fallback={<p>Egen fejlvisning</p>}>
        <ThrowingWidget shouldThrow={() => true} />
      </WidgetErrorBoundary>,
    );

    // Assert
    expect(screen.getByText("Egen fejlvisning")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Prøv igen" })).not.toBeInTheDocument();
  });

  it("WidgetErrorBoundary_OneOfTwoWidgetsThrows_OtherWidgetStillShown", () => {
    // Act
    render(
      <>
        <WidgetErrorBoundary>
          <ThrowingWidget shouldThrow={() => true} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary>
          <p>Anden widget</p>
        </WidgetErrorBoundary>
      </>,
    );

    // Assert
    expect(screen.getByText("Anden widget")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Prøv igen" })).toHaveLength(1);
  });
});

describe("WidgetErrorAnnouncer", () => {
  it("WidgetErrorAnnouncer_NoError_LiveRegionIsEmpty", () => {
    // Arrange
    vi.useFakeTimers();

    // Act
    render(
      <WidgetErrorAnnouncer>
        <FailOnDemand />
      </WidgetErrorAnnouncer>,
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Assert
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByText("Widgetindhold")).toBeInTheDocument();
  });

  it("WidgetErrorAnnouncer_WidgetFails_LiveRegionAnnouncesError", () => {
    // Arrange
    vi.useFakeTimers();
    render(
      <WidgetErrorAnnouncer>
        <FailOnDemand />
      </WidgetErrorAnnouncer>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Fremkald fejl" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Assert
    const status = screen.getByRole("status");
    expect(status.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("WidgetErrorAnnouncer_WidgetFails_FocusIsNotMoved", () => {
    // Arrange
    vi.useFakeTimers();
    render(
      <WidgetErrorAnnouncer>
        <FailOnDemand />
      </WidgetErrorAnnouncer>,
    );
    const trigger = screen.getByRole("button", { name: "Fremkald fejl" });
    trigger.focus();

    // Act
    fireEvent.click(trigger);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Assert
    expect(trigger).toHaveFocus();
  });

  it("WidgetErrorAnnouncer_WidgetFails_LiveRegionIsOutsideFallback", () => {
    // Arrange: live regionen skal findes, før fejlen sker, så skærmlæsere opfanger ændringen
    vi.useFakeTimers();
    render(
      <WidgetErrorAnnouncer>
        <FailOnDemand />
      </WidgetErrorAnnouncer>,
    );
    const statusBefore = screen.getByRole("status");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Fremkald fejl" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Assert
    expect(screen.getByRole("status")).toBe(statusBefore);
    expect(statusBefore.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
