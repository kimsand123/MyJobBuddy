import type { AgreementRuleSet, SupplementRule } from "./agreements/agreementRuleSet";
import type { ShiftEstimateDto, SupplementLineDto } from "./apiTypes";
import { minuteOfDay, weekdayOf } from "./dateTime";

// Forventet løn for én vagt efter et regelsæt:
// forventet løn = timer × timeløn + tillæg.
// Beløb regnes i øre og afrundes til hele øre pr. linje (timeløn og hvert tillæg for sig).

export type ShiftTimes = {
  date: string;
  start: string;
  end: string;
  pauseMinutes: number;
  isSick: boolean;
};

const minutesPerHour = 60;

function amountForMinutes(minutes: number, rateOerePerHour: number): number {
  return Math.round((minutes * rateOerePerHour) / minutesPerHour);
}

function emptyEstimate(ruleSet: AgreementRuleSet): ShiftEstimateDto {
  return {
    paidMinutes: 0,
    hourlyWageOere: ruleSet.hourlyWageOere,
    basePayOere: 0,
    supplements: [],
    expectedPayOere: 0,
  };
}

/** Minutter af vagten [start, slut), der ligger i tillæggets periode fra fromMinuteOfDay til midnat. */
function supplementMinutes(startMinute: number, endMinute: number, rule: SupplementRule): number {
  const overlapStart = Math.max(startMinute, rule.fromMinuteOfDay);
  return Math.max(0, endMinute - overlapStart);
}

function calculateSupplements(
  shift: ShiftTimes,
  startMinute: number,
  endMinute: number,
  ruleSet: AgreementRuleSet,
): SupplementLineDto[] {
  if (shift.isSick && !ruleSet.sickShiftIncludesSupplements) {
    return [];
  }
  const weekday = weekdayOf(shift.date);
  if (weekday === undefined) {
    return [];
  }

  const lines: SupplementLineDto[] = [];
  for (const rule of ruleSet.supplementRules) {
    if (!rule.weekdays.includes(weekday)) {
      continue;
    }
    const minutes = supplementMinutes(startMinute, endMinute, rule);
    if (minutes === 0) {
      continue;
    }
    lines.push({
      kind: rule.kind,
      minutes,
      rateOerePerHour: rule.rateOerePerHour,
      amountOere: amountForMinutes(minutes, rule.rateOerePerHour),
    });
  }
  return lines;
}

export function calculateShift(shift: ShiftTimes, ruleSet: AgreementRuleSet): ShiftEstimateDto {
  const startMinute = minuteOfDay(shift.start);
  const endMinute = minuteOfDay(shift.end);
  if (startMinute === undefined || endMinute === undefined) {
    return emptyEstimate(ruleSet);
  }
  if (endMinute <= startMinute) {
    return emptyEstimate(ruleSet);
  }

  const durationMinutes = endMinute - startMinute;
  const paidMinutes = ruleSet.pauseIsPaid
    ? durationMinutes
    : Math.max(0, durationMinutes - shift.pauseMinutes);
  const basePayOere = amountForMinutes(paidMinutes, ruleSet.hourlyWageOere);
  const supplements = calculateSupplements(shift, startMinute, endMinute, ruleSet);
  const supplementsOere = supplements.reduce((sum, line) => sum + line.amountOere, 0);

  return {
    paidMinutes,
    hourlyWageOere: ruleSet.hourlyWageOere,
    basePayOere,
    supplements,
    expectedPayOere: basePayOere + supplementsOere,
  };
}
