import type { AgreementRuleSet } from "./agreementRuleSet";

// HK Handel – Butik. Eksempelsatser til demoen, ikke overenskomstens rigtige satser.
// Helligdage er ikke med i demoen.

const minutesPerHour = 60;

export const hkHandelButik: AgreementRuleSet = {
  agreementCode: "hk-handel-butik",
  // Timeløn 92,50 kr.
  hourlyWageOere: 9250,
  pauseIsPaid: true,
  // Syg vagt: timeløn uden tillæg (eksempelregel).
  sickShiftIncludesSupplements: false,
  supplementRules: [
    // Aftentillæg 30,00 kr./t efter kl. 18:00, mandag til fredag.
    {
      kind: "evening",
      weekdays: [1, 2, 3, 4, 5],
      fromMinuteOfDay: 18 * minutesPerHour,
      rateOerePerHour: 3000,
    },
    // Lørdagstillæg 40,00 kr./t efter kl. 15:00 om lørdagen.
    {
      kind: "saturday",
      weekdays: [6],
      fromMinuteOfDay: 15 * minutesPerHour,
      rateOerePerHour: 4000,
    },
    // Søndagstillæg 45,00 kr./t for alle timer om søndagen.
    {
      kind: "sunday",
      weekdays: [0],
      fromMinuteOfDay: 0,
      rateOerePerHour: 4500,
    },
  ],
};
