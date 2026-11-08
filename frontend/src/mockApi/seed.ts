import type { MockStore } from "./storeTypes";

// Syntetiske startdata. Alt er fiktivt. Satser og svar er eksempler, som skal faktatjekkes.
// createSeedStore() danner nye objekter ved hvert kald, så demoen altid starter ens.
//
// Tallene giver ved start:
//  - vagter i oktober 2026: 25,5 t og 2.838,75 kr. forventet,
//  - lønseddel: 24 t, 7 aftentimer, 0 lørdags- og søndagstimer, 2.430,00 kr. udbetalt,
//  - mulige fejl: timer 1,5 t = 138,75 kr. og søndagstillæg 6 t = 270,00 kr., i alt 408,75 kr.

export const seedJobId = "job-1";
export const seedMonth = "2026-10";

/** Første nummer til nye id'er, så de aldrig rammer seedens id'er. */
const firstSequenceNumber = 100;

export function createSeedStore(): MockStore {
  return {
    profile: {
      firstName: "Maja",
      age: 17,
    },

    subscription: {
      currentPlanCode: "free",
      questionsRemaining: 3,
      questionsTotal: 5,
    },

    plans: [
      {
        code: "free",
        priceOere: 0,
        billingPeriod: "month",
        questionsPerMonth: 5,
        payChecksPerMonth: 1,
      },
      {
        code: "plus",
        priceOere: 2900,
        billingPeriod: "month",
        questionsPerMonth: 100,
        payChecksPerMonth: null,
      },
      {
        code: "payPerQuestion",
        priceOere: null,
        billingPeriod: "question",
        questionsPerMonth: null,
        payChecksPerMonth: null,
      },
    ],

    // Samtykke til sygdom er Fra fra start.
    consents: {
      sickness: false,
    },

    // Kun overenskomster med et regelsæt (ruleSetRegistry.ts) kan vælges.
    agreementCatalog: [
      { code: "hk-handel-butik", name: "HK Handel – Butik" },
      { code: "3f-hotel-restaurant", name: "3F – Hotel og restaurant" },
      { code: "3f-lager-transport", name: "3F – Lager og transport" },
      { code: "hk-kontor", name: "HK – Kontor" },
    ],

    jobs: [
      {
        id: seedJobId,
        workplace: "Torvebutikken",
        position: "Butiksmedarbejder",
        agreementCode: "hk-handel-butik",
      },
    ],

    shifts: [
      // tir. 6/10 16–20 → 430,00 kr. (aften 2 t)
      {
        id: "shift-1",
        jobId: seedJobId,
        date: "2026-10-06",
        start: "16:00",
        end: "20:00",
        pauseMinutes: 0,
        isSick: false,
      },
      // tor. 8/10 16–20 → 430,00 kr. (aften 2 t)
      {
        id: "shift-2",
        jobId: seedJobId,
        date: "2026-10-08",
        start: "16:00",
        end: "20:00",
        pauseMinutes: 0,
        isSick: false,
      },
      // lør. 10/10 9–15 → 555,00 kr. (lørdagstillæg først efter kl. 15)
      {
        id: "shift-3",
        jobId: seedJobId,
        date: "2026-10-10",
        start: "09:00",
        end: "15:00",
        pauseMinutes: 30,
        isSick: false,
      },
      // søn. 11/10 10–16 → 825,00 kr. (søndag 6 t)
      {
        id: "shift-4",
        jobId: seedJobId,
        date: "2026-10-11",
        start: "10:00",
        end: "16:00",
        pauseMinutes: 30,
        isSick: false,
      },
      // ons. 14/10 15:30–21 → 598,75 kr. (aften 3 t)
      {
        id: "shift-5",
        jobId: seedJobId,
        date: "2026-10-14",
        start: "15:30",
        end: "21:00",
        pauseMinutes: 30,
        isSick: false,
      },
    ],

    payslips: [
      {
        id: "payslip-1",
        jobId: seedJobId,
        month: seedMonth,
        employerName: "Torvebutikken",
        cprMasked: "••••••-••••",
        accountNumberMasked: "•••• ••••••••••",
        paidMinutes: 24 * 60,
        supplementMinutes: { evening: 7 * 60, saturday: 0, sunday: 0 },
        grossPayOere: 243000,
      },
    ],

    chatQuestions: [
      {
        id: "question-1",
        question: "Har jeg ret til pause på min vagt på 5,5 timer?",
        answer:
          "Ja. Du er under 18, så du skal have mindst 30 minutters pause, når du arbejder mere end 4,5 timer.",
        source: "Fra din overenskomst",
        referToUnion: false,
        isSuggested: true,
      },
      {
        id: "question-2",
        question: "Hvad får jeg i tillæg om søndagen?",
        answer:
          "Du får 45,00 kr. i tillæg for hver time, du arbejder om søndagen. Det gælder alle timer på dagen.",
        source: "Fra din overenskomst",
        referToUnion: false,
        isSuggested: true,
      },
      {
        id: "question-3",
        question: "Min chef siger, at jeg bliver fyret, hvis jeg melder mig syg igen.",
        answer:
          "Det lyder hårdt, og det er godt, du spørger. Du må gerne være syg, og din chef må ikke true dig for det.",
        source: "Generel vejledning om sygdom",
        referToUnion: true,
        isSuggested: true,
      },
      // Opfølgning fra løntjekket ("Spørg AI" ved en mulig fejl). Vises ikke som forslag.
      // Svarene nævner ingen beløb, så de passer, også når vagterne ændres.
      {
        id: "question-missing-sunday",
        question: "Hvorfor mangler mit søndagstillæg?",
        answer:
          "Det kan være en fejl. Din overenskomst giver tillæg for alle de timer, du arbejder om søndagen. Tal med din chef eller lønkontoret, og vis dem din vagtplan.",
        source: "Fra din overenskomst",
        referToUnion: false,
        isSuggested: false,
      },
      {
        id: "question-missing-hours",
        question: "Hvorfor mangler der timer på min lønseddel?",
        answer:
          "Det kan være en fejl. Du skal have løn for alle de timer, du har arbejdet, også når pausen er betalt. Tal med din chef eller lønkontoret, og vis dem din vagtplan.",
        source: "Fra din overenskomst",
        referToUnion: false,
        isSuggested: false,
      },
    ],

    nextSequenceNumber: firstSequenceNumber,
  };
}
