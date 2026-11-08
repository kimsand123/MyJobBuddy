// Præsentationsberegninger for abonnementet.

/** Andel tilbage i procent (0–100). Total 0 giver 0, så der aldrig divideres med nul. */
export function remainingPercent(remaining: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  const percent = (remaining / total) * 100;
  return Math.min(100, Math.max(0, percent));
}
