// Et regelsæt beskriver, hvordan løn beregnes efter én overenskomst.
// Regelsættet kan skiftes ud pr. overenskomstkode (se ruleSetRegistry.ts).

/** Ugedag som i Date.getUTCDay(): 0 = søndag, 1 = mandag … 6 = lørdag. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SupplementKind = "evening" | "saturday" | "sunday";

/** Et tillæg gives for de minutter af vagten, der ligger fra fromMinuteOfDay til midnat på de nævnte dage. */
export type SupplementRule = {
  kind: SupplementKind;
  weekdays: readonly Weekday[];
  fromMinuteOfDay: number;
  rateOerePerHour: number;
};

export type AgreementRuleSet = {
  agreementCode: string;
  hourlyWageOere: number;
  /** Betalt pause: timer = slut − start. Ubetalt pause: timer = slut − start − pause. */
  pauseIsPaid: boolean;
  /** Om en syg vagt også giver tillæg. Ellers betales syge timer med timeløn uden tillæg. */
  sickShiftIncludesSupplements: boolean;
  supplementRules: readonly SupplementRule[];
};
