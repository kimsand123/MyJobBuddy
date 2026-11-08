// Al brugervendt tekst i appen. Komponenter henter tekst herfra og hardcoder den aldrig.
// Filen må kun importere typer med relative stier, fordi vite.config.ts også læser appnavnet herfra.
// Funktioner her sætter kun allerede formaterede tal og datoer ind i sætninger.
import type { FieldErrorCode } from "../shared/fieldErrorCode.ts";
import type { ErrorType } from "../shared/result.ts";

/** Appens navn (myjobbuddy.dk). Står kun her; manifest, <title> og logoet dannes ud fra det. */
export const appName = "My Jobbuddy";

function countText(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${String(count)} ${many}`;
}

const errorTexts: Record<ErrorType, string> = {
  validationFailed: "Nogle felter er ikke udfyldt rigtigt. Ret dem, og prøv igen.",
  unauthorized: "Du er ikke logget ind længere. Log ind igen.",
  forbidden: "Du har ikke adgang til at gøre det her.",
  notFound: "Vi kunne ikke finde det, du leder efter.",
  conflict: "Det kunne ikke gemmes, fordi noget er ændret i mellemtiden. Prøv igen.",
  serverError: "Der skete en fejl hos os. Prøv igen om lidt.",
  serviceUnavailable: "Tjenesten er ikke tilgængelig lige nu. Prøv igen om lidt.",
  networkError: "Der er ingen forbindelse. Tjek dit internet, og prøv igen.",
  aborted: "Forespørgslen blev afbrudt.",
  invalidResponse: "Vi fik et svar, vi ikke kunne læse. Prøv igen.",
};

const fieldErrorTexts: Record<FieldErrorCode, string> = {
  required: "Udfyld feltet.",
  invalidFormat: "Feltet har et forkert format.",
  tooLong: "Teksten er for lang.",
  endNotAfterStart: "Slut skal ligge efter start samme dag.",
  pauseOutOfRange: "Pausen skal være mellem 0 og 120 minutter.",
  pauseNotShorterThanShift: "Pausen skal være kortere end vagten.",
  overlapsExistingShift: "Vagten overlapper en anden vagt samme dag.",
  unknownJob: "Vælg et job.",
  unknownAgreement: "Vælg en overenskomst.",
  agreementNotAvailable: "Overenskomsten kommer snart og kan ikke vælges endnu.",
};

export const da = {
  app: {
    name: appName,
    tagline: "Din arbejdsplads i lommen",
    /** Dokumenttitel pr. side, fx "Vagter – My Jobbuddy". */
    documentTitle: (pageTitle: string): string => `${pageTitle} – ${appName}`,
  },

  common: {
    close: "Luk",
    ok: "OK",
    retry: "Prøv igen",
    cancel: "Annuller",
    loading: "Henter…",
    saving: "Gemmer…",
  },

  navigation: {
    mainMenu: "Hovedmenu",
    back: "Tilbage",
    notifications: "Notifikationer",
    /** Tilføjes til knappens navn, når der er nye notifikationer. */
    newSuffix: " (nye)",
    tabs: {
      home: "Hjem",
      ai: "AI",
      me: "Mig",
    },
  },

  pages: {
    home: { title: "Hjem" },
    shifts: { title: "Vagter" },
    pay: { title: "Løn" },
    ai: { title: "AI" },
    me: { title: "Mig" },
    notFound: { title: "Siden findes ikke" },
  },

  notImplemented: {
    title: "Ikke implementeret",
    text: "Denne funktion er ikke en del af demoen endnu.",
    ok: "OK",
  },

  errors: {
    byType: errorTexts,
    widgetTitle: "Noget gik galt",
    widgetText: "Denne del af siden kunne ikke vises. Resten af appen virker stadig.",
    traceIdLabel: "Fejl-id",
    /** Titel, når data ikke kunne hentes (ErrorState). */
    loadTitle: "Det kunne ikke hentes",
    traceId: (traceId: string): string => `Fejl-id: ${traceId}`,
  },

  fieldErrors: fieldErrorTexts,

  units: {
    currency: "kr.",
    perHour: "kr./t",
    perMonth: "kr./md.",
    hours: "t",
    timeRangeSeparator: "–",
    /** Mellem led i et opremsende navn, fx "3F – Hotel og restaurant, Kommer snart". */
    listSeparator: ", ",
    /** "25,5" → "25,5 t" */
    hoursValue: (formattedHours: string): string => `${formattedHours} t`,
  },

  status: {
    possibleErrors: (count: number): string => countText(count, "mulig fejl", "mulige fejl"),
    ok: "I orden",
    comingSoon: "Kommer snart",
  },

  home: {
    greeting: (firstName: string): string => `Hej ${firstName}`,
    jobLine: (position: string, workplace: string): string => `${position} · ${workplace}`,
    loadingLabel: "Henter din forside",
    noJob: {
      title: "Tilføj dit første job",
      text: "Når vi kender dit job og din overenskomst, kan vi tjekke din løn.",
      action: "Gå til Mig",
    },
    tiles: {
      label: "Genveje",
      contract: { title: "Kontrakt", description: "Upload din kontrakt" },
      shifts: {
        title: "Vagter",
        description: (count: number, monthName: string): string =>
          `${countText(count, "vagt", "vagter")} i ${monthName}`,
      },
      pay: {
        title: "Løn",
        description: (monthName: string): string => `Tjek ${monthName}`,
      },
      rights: { title: "Rettigheder", description: "Kend dine rettigheder" },
    },
    promo: {
      title: "Spørg AI",
      text: "Få svar ud fra din egen kontrakt.",
      action: "Spørg",
    },
  },

  installPrompt: {
    title: `Installér ${appName}`,
    text: "Få appen på din startskærm – den virker også uden net.",
    install: "Installér",
    later: "Ikke nu",
    /** Vejledning på iPhone og iPad, hvor Safari ikke selv kan installere appen. */
    iosGuideLabel: "Sådan gør du",
    iosShare: "Tryk på Del",
    /** Står efter Del-ikonet. I Safaris kompakte layout (iOS 26) ligger Del bag ⋯. */
    iosShareAlternative: "(eller ⋯ og så Del)",
    iosAdd: "Vælg “Føj til hjemmeskærm”",
  },

  calendar: {
    label: (monthTitle: string): string => `Kalender for ${monthTitle}`,
    navigation: "Skift måned",
    previousMonth: "Forrige måned",
    nextMonth: "Næste måned",
    /** Dagens navn for skærmlæsere, fx "11. okt. 2026, søndag, vagt" (dateText fra dayDate). */
    day: (dateText: string, hasShift: boolean, isToday: boolean): string =>
      `${dateText}${hasShift ? ", vagt" : ""}${isToday ? ", i dag" : ""}`,
    /** "11. okt. 2026" + "søndag" → "11. okt. 2026, søndag" (ugedagsrækken læses ikke op). */
    dayDate: (dateText: string, weekday: string): string => `${dateText}, ${weekday}`,
    legendShift: "Vagt (understreget)",
    legendToday: "I dag (kant)",
  },

  shifts: {
    jobLabel: "Job",
    loadingLabel: "Henter dine vagter",
    listTitle: (monthName: string): string => `Vagter i ${monthName}`,
    dayListTitle: (dateText: string): string => `Vagter ${dateText}`,
    showWholeMonth: "Vis hele måneden",
    totalsLabel: "I alt for måneden",
    totalHours: "Timer i alt",
    totalPay: "Forventet bruttoløn",
    addShift: "Tilføj vagt",
    emptyMonth: {
      title: (monthName: string): string => `Ingen vagter i ${monthName}`,
      text: "Tilføj dine vagter, så kan vi regne din løn ud.",
    },
    emptyDay: {
      title: "Ingen vagter den dag",
      text: "Vælg en anden dag, eller tilføj en vagt.",
    },
    noJobs: {
      title: "Tilføj dit job først",
      text: "Du skal have et job, før du kan registrere vagter.",
      action: "Gå til Mig",
    },
    item: {
      expected: "forventet",
      pause: (minutes: number): string => `${String(minutes)} min. pause`,
      sick: "Syg",
    },
    supplements: {
      evening: (hoursText: string): string => `Aften ${hoursText}`,
      saturday: (hoursText: string): string => `Lørdag ${hoursText}`,
      sunday: (hoursText: string): string => `Søndag ${hoursText}`,
    },
  },

  shiftForm: {
    title: "Tilføj vagt",
    description: "Udfyld vagten. Vi regner den forventede løn ud.",
    job: "Job",
    date: "Dato",
    start: "Start",
    end: "Slut",
    pause: "Pause (minutter)",
    pauseHint: "Pausen er betalt i din overenskomst.",
    summaryLabel: "Forventet løn",
    summaryValue: (hoursText: string, payText: string): string => `${hoursText} · ${payText}`,
    summaryPending: "Udfyld dato, start, slut og pause for at se den forventede løn.",
    summaryLoading: "Regner…",
    summaryInvalid: "Tjek felterne for at se den forventede løn.",
    summaryFailed: "Den forventede løn kunne ikke beregnes lige nu. Du kan stadig gemme vagten.",
    save: "Gem vagt",
    saved: "Vagten er gemt.",
  },

  shiftDetails: {
    description: "Detaljer om vagten",
    time: "Tid",
    hours: "Timer",
    pause: "Pause",
    noPause: "Ingen pause",
    expected: "Forventet løn",
    supplements: "Tillæg",
    noSupplements: "Ingen tillæg",
    status: "Status",
    sick: "Syg",
    notSick: "Ikke syg",
    markSick: "Jeg var syg",
    unmarkSick: "Ikke syg alligevel",
    edit: "Ret vagt",
    delete: "Slet vagt",
    consentRequired: {
      title: "Det kræver dit samtykke",
      text: 'Vi gemmer kun, at du har været syg, hvis du siger ja. Slå samtykket til, og tryk så på "Jeg var syg" igen.',
    },
    markedSick: "Vagten er markeret som syg.",
    unmarkedSick: "Markeringen som syg er fjernet.",
  },

  consent: {
    sicknessLabel: "Gem sygedage",
    sicknessDescription:
      "Må vi gemme, når du har været syg? Det bruger vi til at tjekke din løn under sygdom.",
    on: "Til",
    off: "Fra",
    confirm: {
      title: "Slå samtykket fra?",
      text: "Alle dine sygdomsmarkeringer bliver slettet. Det kan ikke fortrydes.",
      action: "Slå fra",
    },
    enabled: "Samtykket er slået til.",
    disabled: (removedCount: number): string =>
      removedCount === 0
        ? "Samtykket er slået fra."
        : `Samtykket er slået fra, og ${countText(removedCount, "sygdomsmarkering", "sygdomsmarkeringer")} er slettet.`,
  },

  pay: {
    jobLabel: "Job",
    loadingLabel: "Tjekker din løn",
    monthPicker: "Vælg måned",
    payslip: {
      title: (monthTitle: string): string => `Lønseddel · ${monthTitle}`,
      employer: "Arbejdsgiver",
      cpr: "CPR-nummer",
      account: "Kontonummer",
      grossPay: "Udbetalt brutto",
      hiddenForAi: "Skjult for AI",
      hidden: (label: string): string => `${label} er skjult`,
    },
    summary: {
      kicker: (monthTitle: string): string => `Løntjek · ${monthTitle}`,
      headlineIssues: (count: number, totalText: string): string =>
        `Vi fandt ${countText(count, "mulig fejl", "mulige fejl")} – i alt ${totalText}`,
      headlineOk: "Din løn ser rigtig ud",
      expected: "Forventet ud fra dine vagter",
      paid: "Udbetalt på lønsedlen",
      missing: "Du mangler måske",
      difference: "Forskel",
    },
    deviation: {
      kicker: (whenText: string): string => `Mulig fejl · ${whenText}`,
      titles: {
        hours: "Timer mangler",
        evening: "Aftentillæg mangler",
        saturday: "Lørdagstillæg mangler",
        sunday: "Søndagstillæg mangler",
      },
      yourShifts: "Dine vagter",
      onPayslip: "På lønsedlen",
      missing: "Mangler",
      calculation: (hoursText: string, rateText: string): string => `${hoursText} × ${rateText}`,
      amount: "Beløb",
      askAi: "Spørg AI",
      askBoss: "Sådan spørger du din chef",
    },
    noPayslip: {
      title: (monthTitle: string): string => `Ingen lønseddel for ${monthTitle}`,
      text: "Upload lønsedlen, så tjekker vi den mod dine vagter.",
    },
    upload: {
      title: "Upload lønseddel",
      description: "Vi fjerner CPR og kontonummer, før AI'en læser den.",
      hint: "PDF eller billede · højst 10 MB",
      select: "Vælg fil",
    },
    noJobs: {
      title: "Tilføj dit job først",
      text: "Du skal have et job, før vi kan tjekke din løn.",
      action: "Gå til Mig",
    },
  },

  ai: {
    disclaimer: "Jeg er en AI og giver vejledning, ikke juridisk rådgivning.",
    welcome: "Hej. Vælg et af spørgsmålene, eller skriv dit eget.",
    loadingLabel: "Henter spørgsmål",
    suggestions: "Forslag til spørgsmål",
    conversation: "Samtale",
    userSaid: "Du skrev:",
    aiSaid: "Jobbuddy AI siger:",
    typing: "AI skriver",
    answerFailed: "Svaret kunne ikke hentes.",
    escalation: {
      title: "Det her bør du få hjælp til.",
      text: "Kontakt en fagforening, fx HK Handel.",
      note: "Du ser præcis, hvad der deles, før noget bliver sendt.",
      share: "Del min sag",
      later: "Ikke nu",
    },
    recipient: "HK Handel",
    consentSheet: {
      title: (recipient: string): string => `Del din sag med ${recipient}`,
      description: "Det her sender vi. Intet bliver delt, før du trykker på knappen.",
      sharedTitle: "Det deler vi",
      notSharedTitle: "Det deler vi ikke",
      confirm: (recipient: string): string => `Del med ${recipient}`,
      nameAndAge: "Dit fornavn og din alder",
      nameAndAgeValue: (firstName: string, age: number): string =>
        `${firstName}, ${String(age)} år`,
      workplace: "Din arbejdsplads",
      workplaceValue: (workplace: string, agreement: string): string =>
        `${workplace} · ${agreement}`,
      message: "Din besked",
      messageValue: (text: string): string => `“${text}”`,
      notShared: [
        "CPR-nummer og adresse",
        "Kontonummer",
        "Kontrakter og lønsedler",
        "Resten af chatten",
      ],
    },
    input: {
      label: "Dit spørgsmål",
      placeholder: "Skriv fx: Hvornår skal jeg have pause?",
      outOfQuestionsPlaceholder: "Du har brugt dine gratis spørgsmål",
      send: "Send spørgsmål",
      remaining: (remaining: number, total: number): string =>
        `${String(remaining)} af ${String(total)} spørgsmål tilbage`,
      none: "Ingen spørgsmål tilbage denne måned",
    },
  },

  me: {
    loadingProfile: "Henter din profil",
    profileTitle: "Profil",
    age: (age: number): string => `${String(age)} år`,
    editProfile: "Rediger profil",
    jobsTitle: "Job og overenskomster",
    loadingJobs: "Henter dine job",
    addJob: "Tilføj job",
    uploadContract: "Upload kontrakt",
    editJob: "Ret",
    deleteJob: "Slet",
    jobActionLabel: (action: string, workplace: string): string => `${action} – ${workplace}`,
    noJobs: {
      title: "Ingen job endnu",
      text: "Tilføj dit job, så kan vi tjekke din løn efter din overenskomst.",
    },
    consentTitle: "Samtykke",
    loadingConsents: "Henter dit samtykke",
    subscriptionTitle: "Abonnement",
    loadingSubscription: "Henter dit abonnement",
    myData: {
      title: "Mine data",
      text: "Du kan se, hente og slette alle dine data med ét tryk.",
      see: "Se mine data",
      download: "Hent mine data",
      deleteAll: "Slet alle mine data",
    },
  },

  jobForm: {
    title: "Tilføj job",
    description: "Vi bruger din overenskomst til at tjekke din løn.",
    workplace: "Arbejdsplads",
    position: "Stilling",
    agreement: "Overenskomst",
    save: "Gem job",
    saved: "Jobbet er gemt.",
  },

  subscription: {
    current: "Dit abonnement",
    cardLabel: (planName: string): string => `Abonnement ${planName}`,
    names: {
      free: "Gratis",
      plus: "Plus",
      payPerQuestion: "Betal pr. spørgsmål",
    },
    priceOnRequest: "Du ser prisen, før du betaler",
    questionsPerMonth: (count: number): string => `${String(count)} AI-spørgsmål om måneden`,
    payChecksPerMonth: (count: number): string =>
      `${countText(count, "løntjek", "løntjek")} om måneden`,
    unlimitedPayChecks: "Ubegrænset løntjek",
    noBinding: "Ingen binding",
    payWhenAsking: "Betal kun, når du spørger",
    usageUnit: "spørgsmål",
    remaining: (remaining: number, total: number, unit: string): string =>
      `${String(remaining)} af ${String(total)} ${unit} tilbage`,
    select: {
      free: "Skift til Gratis",
      plus: "Skift til Plus",
      payPerQuestion: "Køb spørgsmål",
    },
  },
} as const;
