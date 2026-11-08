import type { ReactElement } from "react";
import { da as dayPickerDa } from "react-day-picker/locale/da";
import { Calendar } from "@/components/ui/calendar";
import { formatDate, formatMonth, weekdayLong } from "@/shared/format";
import { toIsoDate, toIsoMonth } from "@/shared/month";
import { da } from "@/texts/da";

// Månedskalender bygget på shadcn's Calendar (react-day-picker): dansk locale, ugen starter
// mandag, danske aria-labels med ugedag (ugedagsrækken er skjult for skærmlæsere). Vagtdage er understreget (ikke kun farve), i dag har en kant,
// og valgt dag er primary. Dagene er 44 × 44 px og krymper på smalle skærme (mindst 24px).

export type MonthCalendarProps = {
  year: number;
  /** 1–12 */
  month: number;
  shiftDays: readonly number[];
  selectedDay?: number;
  /** Dagen i den viste måned, der er "i dag". Udelades, når i dag ligger i en anden måned. */
  today?: number;
  disabled?: boolean;
  onSelect?: (day: number | undefined) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

export function MonthCalendar({
  year,
  month,
  shiftDays,
  selectedDay,
  today,
  disabled = false,
  onSelect,
  onPrev,
  onNext,
}: MonthCalendarProps): ReactElement {
  const displayedMonth = new Date(year, month - 1, 1);
  const monthTitle = formatMonth(toIsoMonth(year, month));
  const shiftDates = shiftDays.map((day) => new Date(year, month - 1, day));
  const selectedDate =
    selectedDay === undefined ? undefined : new Date(year, month - 1, selectedDay);
  // react-day-picker bruger enhedens rigtige dato som "i dag", hvis den ikke får en. Demoen har sin
  // egen dato, så uden "i dag" i denne måned peges på en dag uden for den viste måned.
  const todayDate =
    today === undefined ? new Date(year, month, 1) : new Date(year, month - 1, today);

  return (
    <section
      aria-label={da.calendar.label(monthTitle)}
      className="@container rounded-lg bg-card p-4 shadow-card"
    >
      <Calendar
        mode="single"
        locale={dayPickerDa}
        weekStartsOn={1}
        showOutsideDays={false}
        month={displayedMonth}
        today={todayDate}
        selected={selectedDate}
        disabled={disabled}
        disableNavigation={disabled}
        onMonthChange={(nextMonth) => {
          if (nextMonth > displayedMonth) {
            onNext?.();
            return;
          }
          onPrev?.();
        }}
        onSelect={(date) => {
          onSelect?.(date?.getDate());
        }}
        modifiers={{ shift: shiftDates }}
        modifiersClassNames={{
          shift:
            "[&>button]:bg-secondary [&>button]:font-extrabold [&>button]:text-secondary-foreground [&>button]:underline [&>button]:decoration-2 [&>button]:underline-offset-4",
          today: "[&>button]:ring-2 [&>button]:ring-foreground [&>button]:ring-inset",
        }}
        labels={{
          labelNav: () => da.calendar.navigation,
          labelPrevious: () => da.calendar.previousMonth,
          labelNext: () => da.calendar.nextMonth,
          labelGrid: () => monthTitle,
          labelDayButton: (date, modifiers) => {
            const isoDate = toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
            return da.calendar.day(
              da.calendar.dayDate(formatDate(isoDate), weekdayLong(isoDate)),
              modifiers.shift === true,
              modifiers.today === true,
            );
          },
        }}
        // Cellerne er 44px, men krymper på smalle skærme (en syvendedel af kalenderens bredde,
        // mindst 24px), så der aldrig er vandret scroll ned til 320px.
        className="w-full bg-transparent p-0 [--cell-size:max(--spacing(6),min(--spacing(11),calc(100cqw/7)))]"
        classNames={{
          root: "w-full",
          months: "relative flex w-full flex-col",
          month: "flex w-full flex-col gap-2",
          month_caption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          caption_label: "text-title-3 capitalize",
          weekday: "flex-1 text-caption text-muted-foreground select-none",
          today: "",
        }}
      />
      <p className="mt-3 flex flex-wrap gap-4 text-body-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block h-0.75 w-4 rounded-full bg-secondary-foreground"
          />
          {da.calendar.legendShift}
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block size-4 rounded-sm ring-2 ring-foreground ring-inset"
          />
          {da.calendar.legendToday}
        </span>
      </p>
    </section>
  );
}
