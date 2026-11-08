// DeviationCard, MonthCalendar, ConsentToggle, PlanCard, ChatBubble, EscalationCard, ConsentSheet
// og EmptyState med RTL. Elementer findes via rolle og label.
import { cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatBubble } from "@/components/ChatBubble";
import { ConsentSheet } from "@/components/ConsentSheet";
import { ConsentToggle } from "@/components/ConsentToggle";
import { DeviationCard } from "@/components/DeviationCard";
import { EmptyState } from "@/components/EmptyState";
import { EscalationCard } from "@/components/EscalationCard";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PlanCard } from "@/components/PlanCard";
import { da } from "@/texts/da";

afterEach(() => {
  cleanup();
});

const noBreakSpace = String.fromCharCode(0xa0);
function normalized(value: string | null | undefined): string {
  return (value ?? "").replaceAll(noBreakSpace, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mønster for dagens knapnavn ud fra teksten i da.ts; datoteksten fanges som gruppe 1. */
function dayNamePattern(hasShift: boolean, isToday: boolean): RegExp {
  const marker = "§DATO§";
  const template = escapeRegExp(da.calendar.day(marker, hasShift, isToday));
  return new RegExp(`^${template.replace(escapeRegExp(marker), "(.+)")}$`);
}

function dayButton(day: number, hasShift: boolean, isToday: boolean): HTMLElement {
  const pattern = dayNamePattern(hasShift, isToday);
  const match = screen.getAllByRole("button").find((button) => {
    const name = button.getAttribute("aria-label") ?? button.textContent ?? "";
    const found = pattern.exec(normalized(name));
    return found !== null && new RegExp(`(^|\\D)${String(day)}(\\D|$)`).test(found[1] ?? "");
  });
  if (match === undefined) {
    throw new Error(`Ingen dagknap for ${String(day)} (vagt: ${String(hasShift)})`);
  }
  return match;
}

describe("DeviationCard", () => {
  const details = [
    { label: da.pay.deviation.yourShifts, value: "6 t" },
    { label: da.pay.deviation.onPayslip, value: "0 t" },
    { label: da.pay.deviation.amount, value: "270,00 kr." },
  ];

  it("DeviationCard_Collapsed_ButtonNotExpandedAndDetailsHidden", () => {
    // Act
    render(
      <DeviationCard
        title="Søndagstillæg mangler"
        date="11. okt."
        amountOere={27000}
        details={details}
      />,
    );

    // Assert
    const toggle = screen.getByRole("button", { name: /Søndagstillæg mangler/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(da.pay.deviation.onPayslip)).not.toBeInTheDocument();
    expect(normalized(document.body.textContent)).toContain("270,00 kr.");
  });

  it("DeviationCard_Clicked_ExpandsAndShowsCalculation", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DeviationCard
        title="Søndagstillæg mangler"
        date="11. okt."
        amountOere={27000}
        details={details}
        explanation="6 t × 45,00 kr./t"
      />,
    );
    const toggle = screen.getByRole("button", { name: /Søndagstillæg mangler/ });

    // Act
    await user.click(toggle);

    // Assert
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(da.pay.deviation.yourShifts)).toBeVisible();
    expect(screen.getByText(da.pay.deviation.onPayslip)).toBeVisible();
    expect(screen.getByText("6 t × 45,00 kr./t")).toBeVisible();
  });

  it("DeviationCard_ClickedTwice_CollapsesAgain", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DeviationCard
        title="Timer mangler"
        date="oktober 2026"
        amountOere={13875}
        details={details}
      />,
    );
    const toggle = screen.getByRole("button", { name: /Timer mangler/ });

    // Act
    await user.click(toggle);
    await user.click(toggle);

    // Assert
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("DeviationCard_DefaultExpanded_ShowsDetailsAndChildren", () => {
    // Act
    render(
      <DeviationCard
        title="Timer mangler"
        date="oktober 2026"
        amountOere={13875}
        details={details}
        defaultExpanded
      >
        <button type="button">{da.pay.deviation.askAi}</button>
      </DeviationCard>,
    );

    // Assert
    expect(screen.getByRole("button", { name: /Timer mangler/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: da.pay.deviation.askAi })).toBeVisible();
  });

  it("DeviationCard_ControlsAttribute_PointsToExpandedRegion", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DeviationCard
        title="Timer mangler"
        date="oktober 2026"
        amountOere={13875}
        details={details}
      />,
    );
    const toggle = screen.getByRole("button", { name: /Timer mangler/ });

    // Act
    await user.click(toggle);

    // Assert
    const controlsId = toggle.getAttribute("aria-controls") ?? "";
    expect(document.getElementById(controlsId)).toHaveTextContent(da.pay.deviation.yourShifts);
  });
});

describe("MonthCalendar", () => {
  it("MonthCalendar_October2026_WeekStartsMonday", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} />);

    // Assert: ugedagsrækken er skjult for skærmlæsere (dagene har fulde datonavne), men vises
    const headers = screen.getAllByRole("columnheader", { hidden: true });
    expect(headers).toHaveLength(7);
    const first = headers[0];
    const firstName = normalized(first?.getAttribute("aria-label") ?? first?.textContent);
    expect(firstName.toLowerCase()).toMatch(/^man/);
    const last = headers[6];
    expect(normalized(last?.getAttribute("aria-label") ?? last?.textContent).toLowerCase()).toMatch(
      /^søn/,
    );
  });

  it("MonthCalendar_October2026_DanishMonthName", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} />);

    // Assert
    expect(normalized(document.body.textContent).toLowerCase()).toContain("oktober 2026");
  });

  it("MonthCalendar_October2026_FirstDayIsThursdayColumn", () => {
    // Act: 1. oktober 2026 er en torsdag
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} />);

    // Assert
    const rows = screen.getAllByRole("row");
    const firstWeek = rows.find((row) => within(row).queryAllByRole("gridcell").length > 0);
    const cells = within(firstWeek ?? document.body).getAllByRole("gridcell");
    const firstWithDay = cells.findIndex((cell) => (cell.textContent ?? "").trim() === "1");
    expect(firstWithDay).toBe(3);
  });

  it("MonthCalendar_ShiftDays_AnnouncedInDayName", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[6, 11]} />);

    // Assert
    expect(dayButton(6, true, false)).toBeInTheDocument();
    expect(dayButton(11, true, false)).toBeInTheDocument();
    expect(dayButton(12, false, false)).toBeInTheDocument();
  });

  it("MonthCalendar_Today_AnnouncedInDayName", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} today={31} />);

    // Assert
    expect(dayButton(31, false, true)).toBeInTheDocument();
  });

  it("MonthCalendar_DayClicked_OnSelectWithDay", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MonthCalendar year={2026} month={10} shiftDays={[11]} onSelect={onSelect} />);

    // Act
    await user.click(dayButton(11, true, false));

    // Assert
    expect(onSelect).toHaveBeenCalledWith(11);
  });

  it("MonthCalendar_SelectedDay_MarkedSelected", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[11]} selectedDay={11} />);

    // Assert
    const button = dayButton(11, true, false);
    const cell = button.closest("[role='gridcell']");
    const isSelected =
      button.getAttribute("aria-pressed") === "true" ||
      button.getAttribute("aria-selected") === "true" ||
      cell?.getAttribute("aria-selected") === "true";
    expect(isSelected).toBe(true);
  });

  it("MonthCalendar_PrevAndNext_CallHandlers", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} onPrev={onPrev} onNext={onNext} />);

    // Act
    await user.click(screen.getByRole("button", { name: da.calendar.previousMonth }));
    await user.click(screen.getByRole("button", { name: da.calendar.nextMonth }));

    // Assert
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("MonthCalendar_Disabled_DayClickDoesNothing", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MonthCalendar year={2026} month={10} shiftDays={[11]} disabled onSelect={onSelect} />);

    // Act
    await user.click(dayButton(11, true, false)).catch(() => undefined);

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("ConsentToggle", () => {
  it("ConsentToggle_Off_SwitchNamedByLabelAndNotChecked", () => {
    // Act
    render(
      <ConsentToggle
        label={da.consent.sicknessLabel}
        description={da.consent.sicknessDescription}
        checked={false}
        onChange={vi.fn()}
      />,
    );

    // Assert
    const toggle = screen.getByRole("switch", { name: da.consent.sicknessLabel });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAccessibleDescription(
      expect.stringContaining(da.consent.sicknessDescription),
    );
  });

  it("ConsentToggle_Clicked_OnChangeWithOpposite", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ConsentToggle
        label={da.consent.sicknessLabel}
        description={da.consent.sicknessDescription}
        checked={false}
        onChange={onChange}
      />,
    );

    // Act
    await user.click(screen.getByRole("switch", { name: da.consent.sicknessLabel }));

    // Assert
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("ConsentToggle_On_CheckedAndClickTurnsOff", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ConsentToggle
        label={da.consent.sicknessLabel}
        description="Beskrivelse"
        checked
        onChange={onChange}
      />,
    );
    const toggle = screen.getByRole("switch", { name: da.consent.sicknessLabel });

    // Act
    await user.click(toggle);

    // Assert
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("ConsentToggle_Disabled_SwitchDisabled", () => {
    // Act
    render(
      <ConsentToggle
        label={da.consent.sicknessLabel}
        description="Beskrivelse"
        checked={false}
        disabled
        onChange={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole("switch", { name: da.consent.sicknessLabel })).toBeDisabled();
  });
});

describe("PlanCard", () => {
  it("PlanCard_CurrentWithUsage_ShowsNameUsageAndNoButton", () => {
    // Act
    render(
      <PlanCard
        name="Gratis"
        price="0 kr./md."
        features={["5 spørgsmål om måneden"]}
        current
        usage={{ remaining: 3, total: 5, remainingPercent: 60, unit: "spørgsmål" }}
      />,
    );

    // Assert
    expect(screen.getByText("Gratis")).toBeInTheDocument();
    expect(screen.getByText(da.subscription.remaining(3, 5, "spørgsmål"))).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("PlanCard_WithCta_ButtonCallsOnSelect", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PlanCard
        name="Plus"
        price="29,00 kr./md."
        features={["Ubegrænset løntjek"]}
        ctaLabel="Skift til Plus"
        onSelect={onSelect}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Skift til Plus" }));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Ubegrænset løntjek")).toBeInTheDocument();
    expect(normalized(document.body.textContent)).toContain("29,00 kr./md.");
  });
});

describe("ChatBubble", () => {
  it("ChatBubble_FromAiWithSource_ShowsTextAndSource", () => {
    // Act
    render(
      <ChatBubble from="ai" source="Testoverenskomst § 12">
        Du har ret til søndagstillæg.
      </ChatBubble>,
    );

    // Assert
    expect(screen.getByText("Du har ret til søndagstillæg.")).toBeInTheDocument();
    expect(normalized(document.body.textContent)).toContain("Testoverenskomst § 12");
    expect(normalized(document.body.textContent)).toContain(da.ai.aiSaid);
  });

  it("ChatBubble_FromUser_SaysUserWrote", () => {
    // Act
    render(<ChatBubble from="user">Hvorfor mangler mit søndagstillæg?</ChatBubble>);

    // Assert
    expect(normalized(document.body.textContent)).toContain(da.ai.userSaid);
  });

  it("ChatBubble_Typing_AnnouncesAiIsTyping", () => {
    // Act
    render(<ChatBubble from="ai" typing />);

    // Assert: enten som tekst eller som tilgængeligt navn
    const asText = normalized(document.body.textContent).includes(da.ai.typing);
    const asName = screen.queryAllByLabelText(da.ai.typing).length > 0;
    expect(asText || asName).toBe(true);
  });
});

describe("EscalationCard", () => {
  it("EscalationCard_ShareClicked_OnShare", async () => {
    // Arrange
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<EscalationCard text={da.ai.escalation.text} onShare={onShare} onLater={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: da.ai.escalation.share }));

    // Assert
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(screen.getByText(da.ai.escalation.text)).toBeInTheDocument();
  });

  it("EscalationCard_LaterClicked_OnLater", async () => {
    // Arrange
    const user = userEvent.setup();
    const onLater = vi.fn();
    render(<EscalationCard text={da.ai.escalation.text} onShare={vi.fn()} onLater={onLater} />);

    // Act
    await user.click(screen.getByRole("button", { name: da.ai.escalation.later }));

    // Assert
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});

describe("ConsentSheet", () => {
  const shared = [{ label: da.ai.consentSheet.nameAndAge, value: "Maja, 17 år" }];

  it("ConsentSheet_Open_DialogWithRecipientSharedAndNotShared", () => {
    // Act
    render(
      <ConsentSheet
        open
        recipient={da.ai.recipient}
        shared={shared}
        notShared={da.ai.consentSheet.notShared}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Assert
    const dialog = screen.getByRole("dialog", { name: da.ai.consentSheet.title(da.ai.recipient) });
    expect(within(dialog).getByText("Maja, 17 år")).toBeInTheDocument();
    for (const item of da.ai.consentSheet.notShared) {
      expect(within(dialog).getByText(item)).toBeInTheDocument();
    }
  });

  it("ConsentSheet_ConfirmClicked_OnConfirm", async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConsentSheet
        open
        recipient={da.ai.recipient}
        shared={shared}
        notShared={[]}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: da.ai.consentSheet.confirm(da.ai.recipient) }),
    );

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("ConsentSheet_CancelClicked_OnCancel", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConsentSheet
        open
        recipient={da.ai.recipient}
        shared={shared}
        notShared={[]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: da.common.cancel }));

    // Assert
    expect(onCancel).toHaveBeenCalled();
  });

  it("ConsentSheet_Closed_NoDialog", () => {
    // Act
    render(
      <ConsentSheet
        open={false}
        recipient={da.ai.recipient}
        shared={shared}
        notShared={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it.each([2, 3] as const)("EmptyState_HeadingLevel%s_HeadingAtThatLevel", (level) => {
    // Act
    render(<EmptyState title="Ingen vagter" text="Tilføj en vagt." headingLevel={level} />);

    // Assert
    expect(screen.getByRole("heading", { level, name: "Ingen vagter" })).toBeInTheDocument();
  });

  it("EmptyState_WithAction_ButtonCallsOnAction", async () => {
    // Arrange
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Ingen job"
        text="Tilføj et job."
        actionLabel="Gå til Mig"
        onAction={onAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Gå til Mig" }));

    // Assert
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("EmptyState_WithoutAction_NoButton", () => {
    // Act
    render(<EmptyState title="Ingen job" text="Tilføj et job." />);

    // Assert
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
