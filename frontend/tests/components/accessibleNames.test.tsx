// Tilgængelige navne, som skærmlæsere læser op: kalenderdagen med ugedag (ugedagsrækken læses ikke
// op) og "Kommer snart"-knapperne med separator mellem overenskomst og status.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobForm } from "@/components/JobForm";
import { MonthCalendar } from "@/components/MonthCalendar";
import { da } from "@/texts/da";

afterEach(() => {
  cleanup();
});

describe("da.calendar.dayDate", () => {
  it("dayDate_DateAndWeekday_JoinedWithComma", () => {
    expect(da.calendar.dayDate("11. okt. 2026", "søndag")).toBe("11. okt. 2026, søndag");
  });
});

describe("MonthCalendar – dagens navn", () => {
  it("MonthCalendar_ShiftDay_NameHasDateWeekdayAndShift", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[11]} />);

    // Assert
    expect(screen.getByRole("button", { name: "11. okt. 2026, søndag, vagt" })).toBeInTheDocument();
  });

  it("MonthCalendar_ShiftDay_NameMatchesTextsFile", () => {
    // Arrange
    const expected = da.calendar.day(da.calendar.dayDate("11. okt. 2026", "søndag"), true, false);

    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[11]} />);

    // Assert
    expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
  });

  it.each([
    [1, "torsdag"],
    [5, "mandag"],
    [10, "lørdag"],
    [31, "lørdag"],
  ])("MonthCalendar_DayWithoutShift%s_NameHasWeekday%s", (day, weekday) => {
    // Arrange
    const dateText = `${String(day)}. okt. 2026`;
    const expected = da.calendar.day(da.calendar.dayDate(dateText, weekday), false, false);

    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} />);

    // Assert
    expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
  });

  it("MonthCalendar_Today_NameHasWeekdayAndToday", () => {
    // Arrange
    const expected = da.calendar.day(da.calendar.dayDate("31. okt. 2026", "lørdag"), false, true);

    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[]} today={31} />);

    // Assert
    expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
  });

  it("MonthCalendar_EveryDayButton_NameContainsAWeekday", () => {
    // Act
    render(<MonthCalendar year={2026} month={10} shiftDays={[6, 11]} today={31} />);

    // Assert
    const weekdays = /mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag/;
    const dayButtons = screen
      .getAllByRole("button")
      .filter((button) => /okt\. 2026/.test(button.getAttribute("aria-label") ?? ""));
    expect(dayButtons).toHaveLength(31);
    for (const button of dayButtons) {
      expect(button.getAttribute("aria-label")).toMatch(weekdays);
    }
  });
});

describe("JobForm – Kommer snart", () => {
  it("JobForm_UnavailableAgreement_NameHasSeparatorBeforeStatus", () => {
    // Act
    render(
      <JobForm
        values={{ workplace: "", position: "", agreementCode: "" }}
        agreements={[
          { code: "hk-handel-butik", name: "HK Handel – Butik", isAvailable: true },
          { code: "test-hotel", name: "3F – Hotel og restaurant", isAvailable: false },
        ]}
        onChange={vi.fn()}
        onUnavailableAgreement={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Assert: jsdom fjerner mellemrummet efter kommaet i navneberegningen; browseren beholder det
    // (det præcise navn i en rigtig browser testes i e2e/accessibleNames.spec.ts)
    expect(
      screen.getByRole("button", {
        name: new RegExp(`^3F – Hotel og restaurant,\\s?${da.status.comingSoon}$`),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "HK Handel – Butik" })).toBeInTheDocument();
  });
});
