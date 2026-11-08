import type { SelectOption } from "@/shared/viewTypes";
import type { WidgetError } from "@/shared/widgetError";
import type { ShiftDetailsView } from "../sickness/sicknessTypes";

// Tilstand for vagtkalenderen (jobvælger, kalender, vagtliste og totaler).

/** En vagt i listen (ShiftListItem) og i detaljearket. */
export type ShiftItemView = ShiftDetailsView & {
  date: string;
  start: string;
  end: string;
  pauseMinutes: number;
  paidMinutes: number;
  expectedPayOere: number;
  /** Tillægs-badges, fx "Aften 2 t". */
  supplementLabels: readonly string[];
};

export type CalendarView = {
  year: number;
  month: number;
  shiftDays: readonly number[];
  selectedDay: number | undefined;
  today: number | undefined;
};

export type ShiftCalendarReady = {
  status: "ready";
  jobOptions: readonly SelectOption[];
  selectedJobId: string;
  calendar: CalendarView;
  monthName: string;
  listTitle: string;
  /** Den nye måned (eller det nye job) hentes; listen viser indlæsning. */
  isLoadingMonth: boolean;
  shifts: readonly ShiftItemView[];
  isDayFiltered: boolean;
  hasShiftsInMonth: boolean;
  totalHoursText: string;
  totalPayText: string;
  /** Dato, som "Tilføj vagt" starter med. */
  newShiftDate: string;
  openShift: ShiftItemView | undefined;
  shiftDetailsOpen: boolean;
  statusMessage: string;
  addShiftOpen: boolean;
  addShiftKey: number;
};

export type ShiftCalendarActions = {
  selectJob: (jobId: string) => void;
  selectDay: (day: number | undefined) => void;
  showPreviousMonth: () => void;
  showNextMonth: () => void;
  openShiftDetails: (shiftId: string) => void;
  closeShiftDetails: () => void;
  openAddShift: () => void;
  setAddShiftOpen: (open: boolean) => void;
  shiftSaved: (savedDate: string) => void;
};

export type ShiftCalendarState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | { status: "empty" }
  | (ShiftCalendarReady & ShiftCalendarActions);
