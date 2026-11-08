// Tilstand for vagtdetaljer og sygdom.

/** En vagt, som den vises i detaljearket. Teksterne er færdigformaterede af ViewModel. */
export type ShiftDetailsView = {
  id: string;
  /** Arkets titel, fx "søn. 11. okt. 2026". */
  title: string;
  isSick: boolean;
  /** "10:00–16:00" */
  timeRangeText: string;
  /** "6 t" */
  hoursText: string;
  /** "30 min. pause" eller "Ingen pause". */
  pauseText: string;
  /** "825,00 kr." */
  expectedPayText: string;
  /** "Søndag 6 t (270,00 kr.)" eller "Ingen tillæg". */
  supplementsText: string;
};

export type SicknessState = {
  /** API'et afviste sygdom, fordi samtykket er Fra. Forklaring og ConsentToggle vises. */
  consentRequired: boolean;
  consentGranted: boolean;
  busy: boolean;
  /** Statusbesked efter en ændring (annonceres med aria-live). */
  message: string;
  errorText: string | undefined;
  markSick: () => void;
  unmarkSick: () => void;
  grantConsent: () => void;
};
