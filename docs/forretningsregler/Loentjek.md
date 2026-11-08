# Forretningsregler – Løntjek og vagter

## Status

- **Seneste revision:** 08-11-2026.
- **Bygger på:**
  - Planen "Pitch-demo af Min Jobbuddy (PWA)", afsnittet "Forretningsregler" og "Kims beslutninger" (planen har ikke et revisionsnummer).
  - Kims beslutninger: løntjekket regner live ud fra vagterne og overenskomstens regelsæt; brugeren kan have flere job, hver med sin overenskomst; en vagt kan kun markeres syg med samtykke (GDPR).
  - Implementeringen i mock-API'et `frontend/src/mockApi/`, der midlertidigt står i stedet for API'et. Reglerne skal senere flyttes til et C#-API.
- **Vigtigt:** Alle satser for HK Handel – Butik og alle chatsvar er **eksempler/pladsholdere**, ikke overenskomstens rigtige indhold. De skal faktatjekkes (evt. juridisk), før de bruges uden for demoen.

> TODO: Datoerne for Kims beslutninger (flere job, live løntjek, samtykke til sygdom) står ikke i planen. Kim skal levere dem, hvis de skal stå under Kilde.

## Område og afgrænsning

Dokumentet dækker:

- regelsæt pr. overenskomst og beregning af forventet løn for en vagt,
- løntjekket pr. job og måned (sammenligning med lønsedlen),
- registrering og validering af vagter,
- oprettelse af job og valg af overenskomst,
- sygdomsmarkering af vagter og samtykket til sygdom,
- valg af opfølgende AI-spørgsmål fra en mulig fejl i løntjekket.

Dokumentet dækker ikke abonnementer (spørgsmål og løntjek pr. måned), AI-chattens indhold, upload af lønseddel og kontrakt, profil og "Mine data". Der findes endnu ingen andre forretningsregel-dokumenter i projektet.

## Begreber

| Begreb | Forklaring |
|---|---|
| Job | En arbejdsplads og stilling, som brugeren har. Hvert job hører til præcis én overenskomst. |
| Overenskomst | Den aftale, der bestemmer løn og tillæg. Har en fast kode, fx `hk-handel-butik`. |
| Overenskomstkatalog | Listen over overenskomster, brugeren kan se. Kun de, der har et regelsæt, kan vælges. |
| Regelsæt | Overenskomstens lønregler i en form, systemet kan regne med: timeløn, om pausen er betalt, om en syg vagt giver tillæg, og tillæggene. |
| Tillæg | Ekstra betaling pr. time på bestemte ugedage fra et bestemt klokkeslæt til midnat (aften, lørdag, søndag). |
| Vagt | En arbejdsperiode på ét job på én dato med start, slut og pause. |
| Betalte minutter | De minutter af en vagt, der betales timeløn for. |
| Forventet løn | Det, brugeren burde have for en vagt eller en måned efter regelsættet. |
| Lønseddel | Det, arbejdsgiveren har udbetalt for ét job i én måned: timer, tillægstimer pr. tillæg og bruttoløn. |
| Løntjek | Sammenligningen af forventet løn med lønsedlen for ét job og én måned. |
| Kategori | En linje i løntjekket: "timer i alt" eller ét af regelsættets tillæg. |
| Mulig fejl | En kategori, hvor lønsedlen har færre minutter end forventet (underbetaling). |
| Syg vagt | En planlagt vagt, som brugeren har markeret, at hun var syg på. |
| Samtykke til sygdom | Brugerens udtrykkelige accept af, at appen gemmer sygdomsoplysninger. Fra fra start. |
| Øre | Hundrededel af en krone. Alle beløb regnes i hele øre. |

## Regler

Område-kode: `LON`. Id'erne genbruges aldrig.

### Regelsæt

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-001 | Et job skal beregnes efter det regelsæt, der hører til jobbets overenskomstkode. | Lønnen afhænger af overenskomsten, og brugeren kan have flere job med hver sin overenskomst. | – | `agreements/ruleSetRegistry.ts` (`findRuleSet`), `endpoints/endpointHelpers.ts` (`ruleSetForJob`) | Plan; Kims beslutning (flere job) | Besluttet |
| BR-LON-002 | Et regelsæt skal kunne tilføjes eller skiftes ud uden at ændre beregningen; det består af timeløn, om pausen er betalt, om en syg vagt giver tillæg, og en liste af tillæg (ugedage, starttidspunkt, sats). | Nye overenskomster skal kunne komme til uden ny beregningskode. | – | `agreements/agreementRuleSet.ts`, `agreements/ruleSetRegistry.ts` | Plan | Besluttet |
| BR-LON-003 | Timelønnen i HK Handel – Butik skal være 92,50 kr. (9.250 øre). | Eksempelsats til demoen, ikke overenskomstens rigtige sats. | – | `agreements/hkHandelButik.ts` | Plan | Besluttet (eksempelsats) |
| BR-LON-004 | Aftentillægget i HK Handel – Butik skal være 30,00 kr./t for minutter fra kl. 18:00 til midnat, mandag til fredag. | Eksempelsats til demoen. | Vagt tirsdag 16–20 giver 2 t aftentillæg = 60,00 kr. | `agreements/hkHandelButik.ts` | Plan | Besluttet (eksempelsats) |
| BR-LON-005 | Lørdagstillægget i HK Handel – Butik skal være 40,00 kr./t for minutter fra kl. 15:00 til midnat om lørdagen. | Eksempelsats til demoen. | Vagt lørdag 9–15 giver 0 t lørdagstillæg. | `agreements/hkHandelButik.ts` | Plan | Besluttet (eksempelsats) |
| BR-LON-006 | Søndagstillægget i HK Handel – Butik skal være 45,00 kr./t for alle minutter om søndagen. | Eksempelsats til demoen. | Vagt søndag 10–16 giver 6 t søndagstillæg = 270,00 kr. | `agreements/hkHandelButik.ts` | Plan | Besluttet (eksempelsats) |
| BR-LON-007 | Helligdage må ikke give tillæg i HK Handel – Butik i demoen; en helligdag regnes som den ugedag, den falder på. | Helligdage er ikke med i demoen. | – | `agreements/hkHandelButik.ts` (ingen helligdagsregel) | Plan | Besluttet (kun demo) |
| BR-LON-008 | Pausen skal være betalt i HK Handel – Butik, så betalte minutter = slut − start. | Eksempelregel til demoen. | Vagt 9–15 med 30 min. pause giver 6 t. | `agreements/hkHandelButik.ts` (`pauseIsPaid: true`) | Plan | Besluttet (eksempelregel) |
| BR-LON-009 | En syg vagt i HK Handel – Butik må ikke give tillæg. | Eksempelregel til demoen. | Syg søndag 10–16 giver 555,00 kr. i stedet for 825,00 kr. | `agreements/hkHandelButik.ts` (`sickShiftIncludesSupplements: false`) | Plan | Besluttet (eksempelregel) |
| BR-LON-010 | Et tillæg skal gives for de minutter af vagten, der ligger fra tillæggets starttidspunkt til midnat på tillæggets ugedage; ugedagen bestemmes af vagtens dato. | Tillæg gælder for bestemte tidsrum, ikke hele vagter. | Onsdag 15:30–21 giver 3 t aftentillæg (18–21). | `shiftCalculation.ts` (`supplementMinutes`, `calculateSupplements`), `dateTime.ts` (`weekdayOf`, regnet i UTC) | Plan | Besluttet |

### Beregning af en vagt

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-011 | Alle beløb skal regnes i hele øre som heltal. | Undgår afrundingsfejl ved kommatal. | 92,50 kr. = 9.250 øre. | `shiftCalculation.ts`, `payCheck.ts` | Plan | Besluttet |
| BR-LON-012 | Al tid skal regnes i hele minutter. | Klokkeslæt angives i minutter, og tillæg kan starte midt i en vagt. | 15:30 = 930 minutter efter midnat. | `dateTime.ts` (`minuteOfDay`) | Plan | Besluttet |
| BR-LON-013 | Hver beløbslinje (grundløn og hvert tillæg for sig) skal afrundes til hele øre, og halve øre skal rundes op. | Samme resultat, uanset hvor mange linjer der lægges sammen. | Se afsnittet Beregninger, eksempel 3. | `shiftCalculation.ts` og `payCheck.ts` (`amountForMinutes`, `Math.round`) | Plan; koden | Besluttet |
| BR-LON-014 | Ved ubetalt pause skal betalte minutter være slut − start − pause, dog mindst 0. | Regelsæt for andre overenskomster kan have ubetalt pause. | Vagt 9–15 med 30 min. ubetalt pause giver 5,5 t. | `shiftCalculation.ts` (`calculateShift`) | Koden | Besluttet |
| BR-LON-015 | Forventet løn for en vagt skal være betalte minutter × timeløn + summen af vagtens tillæg. | Planens formel. | Se Beregninger, eksempel 1. | `shiftCalculation.ts` (`calculateShift`) | Plan | Besluttet |
| BR-LON-016 | En syg vagt skal betales med timeløn for alle betalte minutter. | Sygdom må ikke fjerne grundlønnen for en planlagt vagt. | – | `shiftCalculation.ts` (grundløn uafhængig af `isSick`) | Plan | Besluttet (eksempelregel) |
| BR-LON-017 | En vagt, hvor slut ikke ligger efter start, skal give 0 minutter og 0 kr. | Sikkerhedsnet; valideringen (BR-LON-036) forhindrer, at sådan en vagt gemmes. | – | `shiftCalculation.ts` (`emptyEstimate`) | Koden | Besluttet |

### Løntjek

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-018 | Løntjekket skal gælde ét job og én måned (ÅÅÅÅ-MM). | En lønseddel gælder ét job og én måned. | – | `endpoints/payCheckEndpoints.ts`, `endpoints/endpointHelpers.ts` (`requireMonth`) | Plan | Besluttet |
| BR-LON-019 | Løntjekket skal regnes live ud fra jobbets nuværende vagter i måneden, hver gang det hentes; resultatet må ikke gemmes. | Kims beslutning: ændres eller sygemeldes en vagt, skal løntjekket følge med med det samme. | Markeres søndagsvagten syg, ændres resultatet straks (Beregninger, eksempel 2). | `endpoints/payCheckEndpoints.ts` (`getPayCheck`) | Kims beslutning (live løntjek) | Besluttet |
| BR-LON-020 | Findes der ingen lønseddel for jobbet og måneden, skal løntjekket svare "ingen lønseddel", og det må ikke være en fejl. | Brugeren skal se en tom tilstand, ikke en fejlbesked. | – | `endpoints/payCheckEndpoints.ts` (`status: "noPayslip"`) | Plan | Besluttet |
| BR-LON-021 | Løntjekket skal have kategorien "timer i alt" med alle vagternes betalte minutter, inklusive syge vagter, til timeløn. | Syge timer betales også med timeløn (BR-LON-016). | – | `payCheck.ts` (`hoursCategory`) | Plan | Besluttet |
| BR-LON-022 | Løntjekket skal have én kategori pr. tillæg i regelsættet (for HK Handel – Butik: aften, lørdag og søndag) med summen af vagternes tillægsminutter. | Tillæg kan mangle på lønsedlen, selv om timerne passer. | – | `payCheck.ts` (`supplementCategories`) | Plan | Besluttet |
| BR-LON-023 | En kategori må kun blive en mulig fejl, når forventede minutter er større end lønsedlens minutter (underbetaling). | Appen skal hjælpe brugeren med at få det, hun mangler; overbetaling vises ikke som fejl. | Aften: 7 t forventet og 7 t udbetalt giver ingen mulig fejl. | `payCheck.ts` (`differenceMinutes > 0`) | Plan | Besluttet |
| BR-LON-024 | Beløbet for en mulig fejl skal være manglende minutter × kategoriens sats, afrundet efter BR-LON-013. | Brugeren skal kunne se, hvad fejlen koster. | 1,5 t × 92,50 kr. = 138,75 kr. | `payCheck.ts` (`toPossibleError`) | Plan | Besluttet |
| BR-LON-025 | En tillægsafvigelse skal vise datoerne for de vagter, der giver tillægget, hver dato én gang og i stigende orden. | Brugeren skal kunne pege på de konkrete vagter over for chefen. | Søndagstillæg mangler: 11-10-2026. | `payCheck.ts` (`supplementCategories`, `dates`) | Plan ("søndagsafvigelsen viser datoerne") | Besluttet |
| BR-LON-026 | En timeafvigelse skal vise måneden og ingen enkelte datoer. | Manglende timer kan ikke henføres til én bestemt vagt. | Timer mangler: oktober 2026. | `payCheck.ts` (`dates: []`); visningen af måneden ligger i appen | Plan | Besluttet |
| BR-LON-027 | Forskellen i alt skal være forventet løn for måneden − lønsedlens bruttoløn, og den må være negativ. | Giver brugeren det samlede billede, også ved overbetaling. | 2.838,75 − 2.430,00 = 408,75 kr. | `payCheck.ts` (`differenceOere`) | Plan | Besluttet |
| BR-LON-028 | Mulige fejl i alt skal være summen af de mulige fejls beløb. | Det er det tal, appen fremhæver ("i alt 408,75 kr."). | 138,75 + 270,00 = 408,75 kr. | `payCheck.ts` (`possibleErrorsTotalOere`) | Plan | Besluttet |

### Vagtregistrering

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-029 | En vagt skal have job, dato, start, slut og pause udfyldt; tom tekst tæller som ikke udfyldt. | Uden alle felter kan vagten ikke beregnes. | – | `validation/shiftValidation.ts`, `validation/requestFields.ts` | Plan | Besluttet |
| BR-LON-030 | Jobbet på en vagt skal findes. | En vagt skal kunne knyttes til et regelsæt. | – | `validation/shiftValidation.ts` (`validateJob`, `unknownJob`) | Koden | Besluttet |
| BR-LON-031 | Datoen skal være en gyldig kalenderdato i formatet ÅÅÅÅ-MM-DD. | Ugedagen bestemmer tillæggene. | 2026-02-30 afvises. | `dateTime.ts` (`isValidIsoDate`) | Koden | Besluttet |
| BR-LON-032 | Start og slut skal være klokkeslæt i formatet TT:MM fra 00:00 til 23:59; "24:00" må ikke bruges. | En vagt ligger inden for én dag (BR-LON-036). | "24:00" afvises med `invalidFormat`. | `dateTime.ts` (`minuteOfDay`) | Koden | Besluttet |
| BR-LON-033 | Pausen skal være et helt antal minutter fra 0 til 120. | Demoens grænse for en rimelig pause. | 121 min. afvises. | `validation/shiftValidation.ts` (`validatePause`) | Plan | Besluttet |
| BR-LON-034 | Pausen skal være kortere end vagten. | En pause, der er lige så lang som vagten, giver ingen arbejdstid. | Vagt 10:00–11:00 med 60 min. pause afvises. | `validation/shiftValidation.ts` (`validateTimeSpan`) | Plan | Besluttet |
| BR-LON-035 | En ny vagt må ikke overlappe en anden vagt på samme job og dato; vagter, der kun rører hinanden, er tilladt. | Brugeren kan ikke arbejde to vagter på samme job på samme tid. | 16–20 og 20–22 er tilladt; 16–20 og 19–22 afvises. | `validation/shiftValidation.ts` (`validateNoOverlap`); kun ved oprettelse | Plan | Besluttet |
| BR-LON-036 | Slut skal ligge efter start på samme dag; en vagt må ikke gå hen over midnat. | Demoen understøtter ikke vagter over midnat. | 22:00–02:00 afvises med `endNotAfterStart`. | `validation/shiftValidation.ts` (`validateTimeSpan`) | Plan | Besluttet (kun demo) |
| BR-LON-037 | En valideringsfejl skal returneres pr. felt med en fejlkode, så appen kan vise teksten ved feltet; en overlapsfejl vises ved start. | Brugeren skal se, hvilket felt der er forkert. | Se fejlkoderne nedenfor. | `validation/shiftValidation.ts` (`fieldErrors`) | Plan | Besluttet |
| BR-LON-038 | En ny vagt skal oprettes som ikke syg. | Sygdom markeres bagefter og kræver samtykke (BR-LON-047). | – | `endpoints/shiftEndpoints.ts` (`createShift`, `isSick: false`) | Koden | Besluttet |
| BR-LON-039 | Timer og forventet løn for en vagt, der endnu ikke er gemt, skal kunne beregnes med samme validering og beregning som ved oprettelse, men uden overlapstjek og som ikke syg. | Formularen viser en live opsummering. | – | `endpoints/shiftEndpoints.ts` (`estimateShift`) | Plan ("estimat-endpoint") | Besluttet |

**Fejlkoder for vagter** (felterne `jobId`, `date`, `start`, `end`, `pauseMinutes`):

| Fejlkode | Betydning | Felter |
|---|---|---|
| `required` | Feltet mangler eller er tomt. | alle |
| `invalidFormat` | Forkert type eller format (fx "24:00", 2026-02-30, pause som kommatal). | alle |
| `unknownJob` | Jobbet findes ikke. | `jobId` |
| `pauseOutOfRange` | Pausen er under 0 eller over 120 min. | `pauseMinutes` |
| `endNotAfterStart` | Slut ligger ikke efter start. | `end` |
| `pauseNotShorterThanShift` | Pausen er lige så lang som eller længere end vagten. | `pauseMinutes` |
| `overlapsExistingShift` | Vagten overlapper en anden vagt på samme job og dato. | `start` |

### Job

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-040 | Brugeren må have flere job, og hvert job skal have præcis én overenskomst. | Kims beslutning: unge har ofte flere job. | – | `endpoints/jobEndpoints.ts`, `storeTypes.ts` | Kims beslutning (flere job) | Besluttet |
| BR-LON-041 | Et job skal have en arbejdsplads på højst 100 tegn (efter fjernelse af mellemrum i begge ender). | Arbejdspladsen vises på skærmene. | 101 tegn afvises med `tooLong`. | `validation/jobValidation.ts` (`validateText`) | Plan; koden (100 tegn) | Besluttet |
| BR-LON-042 | Et job skal have en stilling på højst 100 tegn (efter fjernelse af mellemrum i begge ender). | Stillingen vises på skærmene. | – | `validation/jobValidation.ts` (`validateText`) | Plan; koden (100 tegn) | Besluttet |
| BR-LON-043 | Et job skal have en overenskomst, der findes i overenskomstkataloget. | Ukendte koder kan ikke beregnes. | Ukendt kode afvises med `unknownAgreement`. | `validation/jobValidation.ts` (`validateAgreement`) | Plan | Besluttet |
| BR-LON-044 | Kun overenskomster med et regelsæt må vælges; kataloget skal vise, om hver overenskomst kan vælges. | Uden regelsæt kan løntjekket ikke regne. | 3F – Hotel og restaurant afvises med `agreementNotAvailable` og vises som "Kommer snart". | `validation/jobValidation.ts`, `endpoints/agreementEndpoints.ts` (`isAvailable`) | Plan | Besluttet |

**Fejlkoder for job** (felterne `workplace`, `position`, `agreementCode`): `required`, `invalidFormat`, `tooLong` (arbejdsplads og stilling), `unknownAgreement` og `agreementNotAvailable` (overenskomst).

### Sygdom og samtykke

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-045 | Samtykket til sygdom skal være Fra, indtil brugeren selv slår det til. | Sygdom er en helbredsoplysning (særlig kategori efter GDPR) og kræver udtrykkeligt samtykke. | – | `seed.ts` (`consents.sickness: false`) | Kims beslutning (GDPR) | Besluttet |
| BR-LON-046 | Samtykket til sygdom skal angives som til eller fra; andet afvises. | Samtykke skal være entydigt. | – | `endpoints/consentEndpoints.ts` (`setSicknessConsent`) | Koden | Besluttet |
| BR-LON-047 | En vagt må kun markeres som syg, når samtykket til sygdom er til; ellers skal API'et afvise med "forbidden". | Uden samtykke må sygdomsoplysninger ikke gemmes. Appen viser i stedet en forklaring med samtykkeknappen. | – | `endpoints/shiftEndpoints.ts` (`markShiftSick`) | Kims beslutning (GDPR); plan | Besluttet |
| BR-LON-048 | Når samtykket til sygdom slås fra, skal alle sygdomsmarkeringer på alle brugerens vagter slettes, og antallet af slettede markeringer skal returneres. | Tilbagetrækning af samtykke skal fjerne de oplysninger, det dækkede. | – | `endpoints/consentEndpoints.ts` (`removedSickMarkings`) | Kims beslutning (GDPR); plan | Besluttet |
| BR-LON-049 | Før samtykket trækkes tilbage, skal brugeren bekræfte det i en dialog. | Sletningen kan ikke fortrydes. | – | Appen (bekræftelsesdialog før kaldet) | Plan | Besluttet |
| BR-LON-050 | En sygdomsmarkering må fjernes ("Ikke syg alligevel") uden samtykke. | Fjernelse sletter en oplysning og kræver derfor ikke samtykke. | – | `endpoints/shiftEndpoints.ts` (`unmarkShiftSick`) | Kims beslutning (GDPR); koden | Besluttet |
| BR-LON-051 | Slås samtykket til igen, må tidligere slettede sygdomsmarkeringer ikke komme tilbage. | Oplysningerne er slettet. | – | `endpoints/consentEndpoints.ts` | Koden | Besluttet |

### "Spørg AI" fra en mulig fejl

| Id | Regel | Hvorfor | Eksempel | Håndhæves af | Kilde | Status |
|---|---|---|---|---|---|---|
| BR-LON-052 | Kategorien for en mulig fejl skal bestemme det opfølgende AI-spørgsmål: timer → "Hvorfor mangler der timer på min lønseddel?", søndag → "Hvorfor mangler mit søndagstillæg?". | Brugeren skal få et svar, der passer til fejlen. | – | `widgets/payCheck/payCheckCalculations.ts` (`followUpQuestionId`), spørgsmålene i `seed.ts` | Plan | Besluttet |
| BR-LON-053 | De opfølgende spørgsmål må ikke vises blandt de foreslåede spørgsmål i AI-chatten. | De giver kun mening fra løntjekket. | – | `endpoints/chatEndpoints.ts` (`isSuggested: false`) | Koden | Besluttet |
| BR-LON-054 | De opfølgende svar må ikke nævne beløb. | Svarene skal passe, også når vagterne ændres (BR-LON-019). | – | `seed.ts` (svarteksterne) | Koden | Besluttet |

## Beregninger

### Formler

```text
betalte minutter   = slut − start                       (betalt pause)
                   = max(0, slut − start − pause)        (ubetalt pause)
tillægsminutter    = max(0, slut − max(start, tillæggets starttidspunkt))   på tillæggets ugedage
beløb (øre)        = afrund(minutter × sats i øre pr. time / 60)            halve øre rundes op
forventet løn      = beløb(betalte minutter, timeløn) + sum af beløb(tillægsminutter, tillægssats)

løntjek pr. kategori:
  forskel (min)    = forventede minutter − lønsedlens minutter
  mulig fejl       = beløb(forskel, sats)                kun når forskel > 0
forskel i alt      = sum af forventet løn − lønsedlens bruttoløn
mulige fejl i alt  = sum af de mulige fejls beløb
```

### Eksempel 1: seed-data for oktober 2026 (Torvebutikken, HK Handel – Butik)

| Vagt | Betalte timer | Grundløn | Tillæg | Forventet |
|---|---|---|---|---|
| tir. 06-10 16–20 | 4 | 370,00 | aften 2 t = 60,00 | 430,00 |
| tor. 08-10 16–20 | 4 | 370,00 | aften 2 t = 60,00 | 430,00 |
| lør. 10-10 9–15, 30 min. pause | 6 | 555,00 | lørdag 0 t (først efter kl. 15) | 555,00 |
| søn. 11-10 10–16, 30 min. pause | 6 | 555,00 | søndag 6 t = 270,00 | 825,00 |
| ons. 14-10 15:30–21, 30 min. pause | 5,5 | 508,75 | aften 3 t = 90,00 | 598,75 |
| **I alt** | **25,5** | | | **2.838,75** |

Lønseddel: 24 t, 7 aftentimer, 0 lørdagstimer, 0 søndagstimer, 2.430,00 kr.

| Kategori | Forventet | Udbetalt | Forskel | Mulig fejl |
|---|---|---|---|---|
| Timer i alt | 25,5 t | 24 t | 1,5 t | 1,5 × 92,50 = **138,75 kr.** (viser oktober 2026) |
| Aften | 7 t | 7 t | 0 | – |
| Lørdag | 0 t | 0 t | 0 | – |
| Søndag | 6 t | 0 t | 6 t | 6 × 45,00 = **270,00 kr.** (viser 11-10-2026) |

Mulige fejl i alt: 138,75 + 270,00 = **408,75 kr.** Forskel i alt: 2.838,75 − 2.430,00 = **408,75 kr.**

### Eksempel 2: søndagsvagten markeret som syg

Søndagsvagten giver nu 6 t × 92,50 = 555,00 kr. og intet søndagstillæg (BR-LON-009, BR-LON-016).

- Forventet: 2.838,75 − 270,00 = **2.568,75 kr.**
- Timer i alt: stadig 25,5 t (syge timer tæller med) → mulig fejl 138,75 kr.
- Søndag: 0 t forventet → ingen mulig fejl.
- Resultat: **1 mulig fejl på 138,75 kr.** Forskel i alt: 2.568,75 − 2.430,00 = 138,75 kr.

### Eksempel 3: afrunding af halve øre

3 minutter til timeløn 92,50 kr.: 3 × 9.250 / 60 = 462,5 øre → **463 øre** (4,63 kr.).

> Til C#-API'et: `Math.Round` i C# runder som standard halve tal til nærmeste lige tal (462,5 → 462). For at få samme resultat som mock-API'et skal der bruges `MidpointRounding.AwayFromZero` (beløbene er altid positive her).

## Undtagelser og konflikter

| Situation | Regler | Hvad gælder |
|---|---|---|
| En kategori er overbetalt, en anden underbetalt. | BR-LON-023, BR-LON-027, BR-LON-028 | Overbetalingen modregnes ikke i de mulige fejl. "Mulige fejl i alt" og "forskel i alt" kan derfor være forskellige; begge vises efter deres egen regel. |
| En syg vagt på en tillægsdag. | BR-LON-009, BR-LON-016, BR-LON-021, BR-LON-022 | Vagten tæller med i "timer i alt", men ikke i tillægskategorien, og dens dato vises ikke ved tillægsafvigelsen. |
| Pausen i en overenskomst med betalt pause. | BR-LON-008, BR-LON-033, BR-LON-034 | Pausen trækkes ikke fra timerne, men valideres stadig (0–120 min. og kortere end vagten). |
| Samtykket trækkes tilbage, mens der findes syge vagter. | BR-LON-048, BR-LON-019 | Markeringerne slettes, og løntjekket regner straks vagterne som ikke syge (tillæg kommer tilbage). |
| Overlap mellem vagter på forskellige job. | BR-LON-035 | Tilladt; reglen gælder kun samme job og dato. |
| Estimat af en vagt, der overlapper en eksisterende. | BR-LON-035, BR-LON-039 | Estimatet beregnes; overlappet afvises først ved oprettelse. |

## Åbne punkter

| Punkt | Hvem afgør |
|---|---|
| De rigtige satser og regler for HK Handel – Butik (timeløn, tillæg, betalt pause, syg vagt) skal erstatte eksempelsatserne (BR-LON-003 til BR-LON-009, BR-LON-016). | Kim, evt. jurist/HK |
| Helligdage: skal de give tillæg, og med hvilken sats (BR-LON-007)? | Kim, evt. jurist |
| Vagter hen over midnat: skal de understøttes, og hvordan fordeles tillæg på de to datoer (BR-LON-036)? | Kim |
| Er grænsen på 120 minutters pause rigtig uden for demoen (BR-LON-033)? | Kim |
| Må vagter på forskellige job overlappe hinanden? | Kim |
| Aften- og lørdagsafvigelser har intet opfølgende AI-spørgsmål (BR-LON-052). Skal der laves et? | Kim |
| Valget af opfølgende spørgsmål ligger i appen (`payCheckCalculations.ts`). Det er en forretningsregel og bør flyttes til API'et sammen med de øvrige regler. | Teknisk afklaring (Kim/csharpdev) |
| Chatsvarene er færdigskrevne pladsholdere og skal faktatjekkes, før de bruges uden for demoen. | Kim, evt. jurist |
| Sygdomssamtykket gælder i demoen alle job samlet. Skal det gælde pr. job? | Kim |

## Ændringslog

| Dato | Regel-id | Ændring |
|---|---|---|
| 08-11-2026 | BR-LON-001 – BR-LON-054 | Dokumentet oprettet ud fra planen og mock-API'et i `frontend/src/mockApi/`. |
