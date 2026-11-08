import { CalendarDays, Plus, UserRound } from "lucide-react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import { AppButton } from "@/components/AppButton";
import { BottomSheet } from "@/components/BottomSheet";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { MonthCalendar } from "@/components/MonthCalendar";
import { SectionHeading } from "@/components/SectionHeading";
import { SelectField } from "@/components/SelectField";
import { ShiftListItem } from "@/components/ShiftListItem";
import { routePaths } from "@/shared/routePaths";
import { useReturnFocus } from "@/shared/useReturnFocus";
import { da } from "@/texts/da";
import { ShiftRegistrationWidget } from "../shiftRegistration/ShiftRegistrationWidget";
import { SicknessWidget } from "../sickness/SicknessWidget";
import { useShiftCalendarWidget } from "./useShiftCalendarWidget";

// View for Vagter: jobvælger (ved flere job), kalender, vagtliste med totaler, "Tilføj vagt"
// (ark med ShiftForm) og vagtdetaljer (ark med sygdom).

export function ShiftCalendarWidget(): ReactElement {
  const calendar = useShiftCalendarWidget();
  const navigate = useNavigate();
  const addShiftFocus = useReturnFocus();
  const detailsFocus = useReturnFocus();

  if (calendar.status === "loading") {
    return <LoadingSkeleton variant="list" rows={3} label={da.shifts.loadingLabel} />;
  }
  if (calendar.status === "error") {
    return <ErrorState error={calendar.error} onRetry={calendar.retry} />;
  }
  if (calendar.status === "empty") {
    return (
      <EmptyState
        icon={UserRound}
        title={da.shifts.noJobs.title}
        text={da.shifts.noJobs.text}
        actionLabel={da.shifts.noJobs.action}
        onAction={() => {
          void navigate(routePaths.me);
        }}
      />
    );
  }

  const openShift = calendar.openShift;
  return (
    <div className="flex flex-col gap-4">
      {calendar.jobOptions.length > 1 && (
        <SelectField
          label={da.shifts.jobLabel}
          value={calendar.selectedJobId}
          options={calendar.jobOptions}
          onChange={calendar.selectJob}
        />
      )}

      <MonthCalendar
        year={calendar.calendar.year}
        month={calendar.calendar.month}
        shiftDays={calendar.calendar.shiftDays}
        selectedDay={calendar.calendar.selectedDay}
        today={calendar.calendar.today}
        onSelect={calendar.selectDay}
        onPrev={calendar.showPreviousMonth}
        onNext={calendar.showNextMonth}
      />

      <AppButton
        size="lg"
        block
        icon={Plus}
        onClick={(event) => {
          addShiftFocus.remember(event.currentTarget);
          calendar.openAddShift();
        }}
      >
        {da.shifts.addShift}
      </AppButton>

      <p role="status" className="text-body-sm text-success empty:sr-only">
        {calendar.statusMessage}
      </p>

      <section
        aria-labelledby="shift-list-title"
        aria-busy={calendar.isLoadingMonth || undefined}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading id="shift-list-title">{calendar.listTitle}</SectionHeading>
          {calendar.isDayFiltered && (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => {
                calendar.selectDay(undefined);
              }}
            >
              {da.shifts.showWholeMonth}
            </AppButton>
          )}
        </div>

        {calendar.isLoadingMonth && (
          <LoadingSkeleton variant="list" rows={2} label={da.shifts.loadingLabel} />
        )}
        {!calendar.isLoadingMonth && calendar.shifts.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            headingLevel={3}
            title={
              calendar.isDayFiltered
                ? da.shifts.emptyDay.title
                : da.shifts.emptyMonth.title(calendar.monthName)
            }
            text={calendar.isDayFiltered ? da.shifts.emptyDay.text : da.shifts.emptyMonth.text}
          />
        )}
        {calendar.shifts.length > 0 && (
          <ul className="flex flex-col gap-3">
            {calendar.shifts.map((shift) => (
              <li key={shift.id}>
                <ShiftListItem
                  date={shift.date}
                  start={shift.start}
                  end={shift.end}
                  pauseMinutes={shift.pauseMinutes}
                  paidMinutes={shift.paidMinutes}
                  expectedPayOere={shift.expectedPayOere}
                  supplements={shift.supplementLabels}
                  isSick={shift.isSick}
                  onClick={(event) => {
                    detailsFocus.remember(event.currentTarget);
                    calendar.openShiftDetails(shift.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {calendar.hasShiftsInMonth && (
          <dl
            aria-label={da.shifts.totalsLabel}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-lg bg-card p-4 shadow-card"
          >
            <dt className="text-muted-foreground">{da.shifts.totalHours}</dt>
            <dd className="text-right text-amount-sm">{calendar.totalHoursText}</dd>
            <dt className="text-muted-foreground">{da.shifts.totalPay}</dt>
            <dd className="text-right text-amount-sm">{calendar.totalPayText}</dd>
          </dl>
        )}
      </section>

      <ShiftRegistrationWidget
        key={calendar.addShiftKey}
        open={calendar.addShiftOpen}
        onOpenChange={calendar.setAddShiftOpen}
        onCloseAutoFocus={addShiftFocus.restore}
        jobOptions={calendar.jobOptions}
        defaultJobId={calendar.selectedJobId}
        defaultDate={calendar.newShiftDate}
        onSaved={calendar.shiftSaved}
      />

      <BottomSheet
        open={calendar.shiftDetailsOpen && openShift !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            calendar.closeShiftDetails();
          }
        }}
        title={openShift?.title ?? ""}
        description={da.shiftDetails.description}
        onCloseAutoFocus={detailsFocus.restore}
      >
        {openShift !== undefined && <SicknessWidget key={openShift.id} shift={openShift} />}
      </BottomSheet>
    </div>
  );
}
