import { da } from "@/texts/da";
import type { SupplementKind } from "./apiSchemas";
import { formatHours } from "./format";

// Tekst for et tillæg på en vagt, fx "Aften 2 t".

export function supplementLabel(kind: SupplementKind, minutes: number): string {
  const hoursText = da.units.hoursValue(formatHours(minutes));
  if (kind === "evening") {
    return da.shifts.supplements.evening(hoursText);
  }
  if (kind === "saturday") {
    return da.shifts.supplements.saturday(hoursText);
  }
  return da.shifts.supplements.sunday(hoursText);
}
