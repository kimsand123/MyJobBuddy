# Brugerdokumentation – My Jobbuddy

Revision 1 · 08-11-2026
Dækker frontend 0.1.0 (demoen har intet rigtigt API; data kommer fra en indbygget demo-model)

## Introduktion

My Jobbuddy (myjobbuddy.dk) er en app til unge med fritidsjob. Appen hjælper dig med at:

- holde styr på dine vagter,
- tjekke, om du har fået den rigtige løn,
- forstå dine rettigheder ved at spørge en AI.

Det her er en **demo**. Det betyder:

- Alt i appen er **eksempeldata**. Du ser Maja, 17 år, der er butiksmedarbejder i den opdigtede
  Torvebutikken. Hun er dækket af overenskomsten HK Handel – Butik og har 5 vagter i oktober 2026.
- Satserne (timeløn og tillæg) er **eksempelsatser**, ikke overenskomstens rigtige satser.
- Der er **ingen rigtig AI**. Svarene er skrevet på forhånd.
- **Intet bliver gemt.** Genindlæser du siden, starter demoen forfra med Majas data.
- Knapper, der ikke er bygget endnu, viser en boks med titlen **"Ikke implementeret"** og teksten
  "Denne funktion er ikke en del af demoen endnu." Tryk på **OK** for at lukke den.

> TODO: Skærmbilleder af Hjem, Vagter, Løn, AI og Mig mangler.

## Kom i gang

### Åbn appen

Gå ind på **myjobbuddy.dk** i din browser. Der er intet login.

### Læg appen på hjemmeskærmen

**iPhone:**

1. Åbn myjobbuddy.dk i **Safari**.
2. Tryk på **Del**.
3. Vælg **"Føj til hjemmeskærm"**.

**Android:**

1. Åbn myjobbuddy.dk i **Chrome**.
2. Vælg **"Installer app"**.

Når du har åbnet appen én gang, virker den også uden internet.

### Sådan finder du rundt

Nederst er der tre faner:

- **Hjem** – din forside.
- **AI** (i midten) – stil spørgsmål om dit job.
- **Mig** – din profil, dine job, samtykke og abonnement.

**Vagter** og **Løn** åbner du fra Hjem. Brug **Tilbage** øverst for at komme tilbage.

Klokken øverst (**Notifikationer**) viser "Ikke implementeret".

## Funktioner

### Hjem

Forsiden viser:

- en hilsen, fx **"Hej Maja"**, og dit job: "Butiksmedarbejder · Torvebutikken",
- fire felter (genveje):
  - **Kontrakt** – "Upload din kontrakt". Viser "Ikke implementeret".
  - **Vagter** – fx "5 vagter i oktober". Åbner Vagter.
  - **Løn** – fx "Tjek oktober". Åbner Løn.
  - **Rettigheder** – "Kend dine rettigheder". Åbner AI.
- feltet **"Spørg AI"** med knappen **Spørg**, som åbner AI.

### Vagter

Her ser du dine vagter og hvad du kan forvente at få i løn.

**Kalenderen**

1. Kalenderen starter i oktober 2026. Dage med en vagt er understreget. I dag har en kant.
2. Tryk på pilene **Forrige måned** og **Næste måned** for at bladre.
3. Tryk på en dag for kun at se vagterne den dag.
4. Tryk på **"Vis hele måneden"** for at se alle vagter igen.

**Vagtlisten**

- Hver vagt viser dato, tid, pause, forventet løn og eventuelle tillæg, fx "Aften", "Lørdag" eller
  "Søndag". En vagt, du har meldt syg, viser **Syg**.
- Nederst står **Timer i alt** og **Forventet bruttoløn** for måneden.

**Tilføj en vagt**

1. Tryk på **"Tilføj vagt"**.
2. Udfyld **Dato**, **Start**, **Slut** og **Pause (minutter)**.
3. Når felterne er udfyldt, viser **Forventet løn** med det samme timer og beløb.
4. Tryk på **"Gem vagt"**. Du ser beskeden "Vagten er gemt."

Er noget forkert, står fejlen lige ved feltet, fx:

- "Udfyld feltet."
- "Slut skal ligge efter start samme dag." (vagter hen over midnat kan ikke registreres i demoen)
- "Pausen skal være mellem 0 og 120 minutter."
- "Pausen skal være kortere end vagten."
- "Vagten overlapper en anden vagt samme dag."

**Meld en vagt syg**

1. Tryk på en vagt i listen. Detaljerne om vagten åbner.
2. Tryk på **"Jeg var syg"**. Vagten viser nu **Syg**.
3. Har du ikke givet samtykke, ser du "Det kræver dit samtykke". Slå samtykket til (se
   [Samtykke](#samtykke-til-at-gemme-sygedage) under Mig, eller brug kontakten i boksen), og tryk
   på "Jeg var syg" igen.
4. Fortryder du, så tryk på **"Ikke syg alligevel"**.

**"Ret vagt"** og **"Slet vagt"** viser "Ikke implementeret".

### Løn

Her tjekker appen din lønseddel mod dine vagter.

1. Åbn **Løn** fra Hjem. Du ser oktober 2026. Bladr mellem måneder med pilene.
2. Øverst står resultatet: **"Vi fandt 2 mulige fejl – i alt 408,75 kr."** Du ser også det
   forventede ud fra dine vagter, det udbetalte på lønsedlen og forskellen.
3. Under resultatet står hver mulig fejl:
   - **Timer mangler** – 1,5 time mangler, 138,75 kr.
   - **Søndagstillæg mangler** – søn. 11. okt., 270,00 kr.
4. Tryk på en fejl for at folde den ud. Du ser dine vagter, hvad der står på lønsedlen, hvad der
   mangler, og udregningen (timer × sats).
5. Tryk på **"Spørg AI"** ved en fejl. AI åbner med et spørgsmål om netop den fejl og svarer med
   det samme.

Nederst står **lønsedlen** for måneden. CPR-nummer og kontonummer er skjult og mærket
**"Skjult for AI"**.

Løntjekket regner forfra, hver gang du tilføjer en vagt eller melder en vagt syg. Melder du fx
søndagsvagten syg, er der kun 1 mulig fejl på 138,75 kr. tilbage (en syg vagt betales uden tillæg).

Bladrer du til en måned uden lønseddel, ser du "Ingen lønseddel for …" og feltet **"Upload
lønseddel"**. **"Vælg fil"** viser "Ikke implementeret". Det gør **"Sådan spørger du din chef"**
også.

### AI

Her kan du stille spørgsmål om dit job.

Øverst og under hvert svar står: **"Jeg er en AI og giver vejledning, ikke juridisk rådgivning."**

1. Tryk på et af de tre forslag til spørgsmål:
   - "Har jeg ret til pause på min vagt på 5,5 timer?"
   - "Hvad får jeg i tillæg om søndagen?"
   - "Min chef siger, at jeg bliver fyret, hvis jeg melder mig syg igen."
2. AI'en svarer, og under svaret står kilden, fx "Fra din overenskomst".

**Når du har brug for hjælp fra en fagforening**

1. Vælg spørgsmålet om at blive fyret. Under svaret står **"Det her bør du få hjælp til."** og
   "Kontakt en fagforening, fx HK Handel."
2. Tryk på **"Del min sag"**. Du ser præcis, hvad der ville blive delt med HK Handel:
   - **Det deler vi:** dit fornavn og din alder, din arbejdsplads og din besked.
   - **Det deler vi ikke:** CPR-nummer og adresse, kontonummer, kontrakter og lønsedler og resten
     af chatten.
3. **"Del med HK Handel"** viser "Ikke implementeret". Intet bliver sendt.
4. Tryk på **"Ikke nu"**, hvis du ikke vil dele.

At skrive dit eget spørgsmål og trykke **"Send spørgsmål"** viser "Ikke implementeret".

### Mig

**Profil**

Viser dit navn og din alder (Maja, 17 år). **"Rediger profil"** viser "Ikke implementeret".

**Job og overenskomster**

Viser dine job, fx Torvebutikken. **"Upload kontrakt"**, **"Ret"** og **"Slet"** viser
"Ikke implementeret".

Tilføj et job:

1. Tryk på **"Tilføj job"**.
2. Udfyld **Arbejdsplads** og **Stilling**.
3. Vælg **Overenskomst**. Kun **HK Handel – Butik** kan vælges. De andre er mærket
   **"Kommer snart"**.
4. Tryk på **"Gem job"**. Du ser "Jobbet er gemt."

Har du flere job, kan du vælge job på Vagter og Løn.

**Samtykke til at gemme sygedage**

Under **Samtykke** står **"Gem sygedage"**. Samtykket er **Fra**, når demoen starter.

1. Slå kontakten **Til** for at kunne melde vagter syg.
2. Slår du den **Fra** igen, spørger appen "Slå samtykket fra?". Tryk på **"Slå fra"**. Så bliver
   alle dine sygdomsmarkeringer slettet.

**Abonnement**

Viser tre abonnementer:

- **Gratis** – "3 af 5 spørgsmål tilbage" (dit nuværende abonnement).
- **Plus** – 29 kr./md.
- **Betal pr. spørgsmål**.

Knapperne til at skifte eller købe viser "Ikke implementeret".

**Mine data**

**"Se mine data"**, **"Hent mine data"** og **"Slet alle mine data"** viser "Ikke implementeret".

### Demo i pitchen (ca. 1 minut)

Genindlæs siden lige inden, så demoen starter forfra.

1. Start på **Hjem**.
2. Tryk på **Løn**. Vis "Vi fandt 2 mulige fejl – i alt 408,75 kr."
3. Fold **Søndagstillæg mangler** ud, og vis udregningen.
4. Tryk på **"Spørg AI"** ved søndagsfejlen. Vis svaret og noten om, at AI'en ikke giver juridisk
   rådgivning.

**Ekstra, hvis der er tid:**

1. Gå til **Mig**, og slå **"Gem sygedage"** Til.
2. Gå til **Hjem → Vagter**, tryk på søndagsvagten 11. oktober, og tryk på **"Jeg var syg"**.
3. Gå til **Løn**. Nu er der kun 1 mulig fejl på **138,75 kr.**

## Ofte stillede spørgsmål / fejlmeddelelser

**Mine vagter og ændringer er væk.**
Demoen gemmer intet. Genindlæser du siden, starter den forfra med Majas data.

**Jeg får "Ikke implementeret".**
Funktionen er ikke bygget i demoen endnu. Tryk på OK.

**Jeg kan ikke melde en vagt syg.**
Slå samtykket "Gem sygedage" Til under Mig først.

**Jeg kan ikke vælge en anden overenskomst end HK Handel – Butik.**
De andre kommer senere og er mærket "Kommer snart".

**Der står "Noget gik galt" eller "Det kunne ikke hentes".**
Tryk på **"Prøv igen"**. Resten af appen virker stadig.

**Er svarene fra AI'en juridisk rådgivning?**
Nej. AI'en giver vejledning, og i demoen er alle svar og satser eksempler.

## Revisionshistorik

| Revision | Dato | Dækker | Ændring |
|---|---|---|---|
| 1 | 08-11-2026 | frontend 0.1.0 | Første udgave: installation, navigation, Hjem, Vagter, Løn, AI, Mig og pitch-demo |
