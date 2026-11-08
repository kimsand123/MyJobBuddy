import { ChevronRight, HeartPulse, Plus } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { formatDate, formatHours, formatKr, formatTimeRange, weekdayShort } from "@/shared/format";
import { dayOfDate } from "@/shared/month";
import { da } from "@/texts/da";
import { StatusBadge } from "./StatusBadge";

// En vagt i listen: dato, tid, timer, pause, tillæg og forventet løn. Hele rækken er en knap,
// der åbner vagtdetaljerne.

export type ShiftListItemProps = {
  date: string;
  start: string;
  end: string;
  pauseMinutes: number;
  paidMinutes: number;
  expectedPayOere: number;
  /** Færdige tekster, fx "Aften 2 t". */
  supplements: readonly string[];
  isSick: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function ShiftListItem({
  date,
  start,
  end,
  pauseMinutes,
  paidMinutes,
  expectedPayOere,
  supplements,
  isSick,
  onClick,
}: ShiftListItemProps): ReactElement {
  const weekday = weekdayShort(date);
  const timeRange = formatTimeRange(start, end);
  const hoursText = da.units.hoursValue(formatHours(paidMinutes));
  const payText = formatKr(expectedPayOere);

  // Navnet er den synlige tekst (WCAG 2.5.3). Datoboksen er skjult for skærmlæsere og erstattet
  // af den fulde dato, fx "søn. 11. okt. 2026".
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg bg-card py-3 pr-2 pl-3 text-left text-foreground shadow-card active:bg-accent"
    >
      <span className="sr-only">{`${weekday} ${formatDate(date)},`}</span>
      <span
        aria-hidden="true"
        className="flex h-14 w-13 flex-none flex-col items-center justify-center rounded-md bg-secondary text-secondary-foreground"
      >
        <span className="text-[1.25rem] leading-6 font-extrabold">{dayOfDate(date)}</span>
        <span className="text-caption">{weekday}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-3 tabular-nums">{timeRange}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-muted-foreground">
          <span className="tabular-nums">{hoursText}</span>
          {pauseMinutes > 0 && <span>· {da.shifts.item.pause(pauseMinutes)}</span>}
          {supplements.map((supplement) => (
            <StatusBadge key={supplement} tone="primary" icon={Plus}>
              {supplement}
            </StatusBadge>
          ))}
          {isSick && (
            <StatusBadge tone="info" icon={HeartPulse}>
              {da.shifts.item.sick}
            </StatusBadge>
          )}
        </span>
      </span>
      <span className="flex-none text-right">
        <span className="block text-amount-sm">{payText}</span>
        <span className="text-body-sm text-muted-foreground">{da.shifts.item.expected}</span>
      </span>
      <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
