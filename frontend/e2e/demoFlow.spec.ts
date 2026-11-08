// Demoforløbet og de levende beregninger fra planens "Verifikation". Al navigation sker i appen
// (faner og links), fordi mock-API'et ligger i hukommelsen og nulstilles ved genindlæsning.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { clickTab, documentTitle, openRoute } from "./support/appRoutes";
import { collectPageErrors } from "./support/pageErrors";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

/** Tal i appen kan have hårdt mellemrum før "kr.". */
function krPattern(amount: string): RegExp {
  return new RegExp(`${amount.replace(".", "\\.").replace(",", ",")}\\s?kr\\.`);
}

/** Genvejen på Hjem. Lønflisens navn kan starte med statusmærket, fx "2 mulige fejl Løn …". */
function homeTile(page: Page, title: string): Locator {
  return page
    .getByRole("navigation", { name: da.home.tiles.label })
    .getByRole("link", { name: new RegExp(`(^|\\s)${title}(\\s|$)`) });
}

async function goToPayFromHome(page: Page): Promise<void> {
  await clickTab(page, "Hjem");
  await homeTile(page, da.home.tiles.pay.title).click();
  await expect(page).toHaveTitle(documentTitle("Løn"));
}

async function goToShiftsFromHome(page: Page): Promise<void> {
  await clickTab(page, "Hjem");
  await homeTile(page, da.home.tiles.shifts.title).click();
  await expect(page).toHaveTitle(documentTitle("Vagter"));
}

/** Folder en mulig fejl ud og giver listepunktet med udregning og knapper. */
async function expandDeviation(page: Page, title: string): Promise<Locator> {
  const toggle = page.getByRole("button", { name: new RegExp(title) });
  // Det første kort kan være foldet ud fra start; så skal det ikke klikkes i.
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  return page.getByRole("listitem").filter({ has: toggle });
}

test("demo_HomeToPayToAskAi_SundayQuestionAnsweredWithSourceAndDisclaimer", async ({ page }) => {
  // Arrange
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/", pageTitle: "Hjem" });

  // Act: Hjem → Løn
  await homeTile(page, da.home.tiles.pay.title).click();

  // Assert: løntjekket
  await expect(page).toHaveTitle(documentTitle("Løn"));
  await expect(page.getByText(/Vi fandt 2 mulige fejl – i alt 408,75\skr\./)).toBeVisible();

  // Act: fold søndagen ud og spørg AI
  const sunday = await expandDeviation(page, "Søndagstillæg mangler");
  await expect(sunday).toContainText(/6\s?t × 45,00\s?kr\./);
  await sunday.getByRole("button", { name: da.pay.deviation.askAi }).click();

  // Assert: chatten stiller søndagsspørgsmålet automatisk og svarer
  await expect(page).toHaveTitle(documentTitle("AI"));
  expect(new URL(page.url()).pathname).toBe("/ai");
  expect(new URL(page.url()).search).toBe("");
  expect(page.url()).not.toContain("question");
  await expect(page.getByText("Hvorfor mangler mit søndagstillæg?")).toBeVisible();
  await expect(page.getByText(da.ai.aiSaid).first()).toBeAttached();
  await expect(page.getByText(da.ai.disclaimer).first()).toBeVisible();
  const conversation = page
    .getByRole("log")
    .or(page.getByRole("region", { name: da.ai.conversation }));
  await expect(conversation.first()).toContainText(/Kilde|§|overenskomst/i);
  expect(errors.messages()).toEqual([]);
});

test("demo_AskAiFromHoursDeviation_HoursQuestionAsked", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/loen", pageTitle: "Løn" });
  const hours = await expandDeviation(page, "Timer mangler");

  // Act
  await hours.getByRole("button", { name: da.pay.deviation.askAi }).click();

  // Assert
  await expect(page.getByText("Hvorfor mangler der timer på min lønseddel?")).toBeVisible();
  expect(page.url()).not.toContain("question");
});

test("demo_PayScreen_PayCheckAbovePayslipAndPayslipMasked", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/loen", pageTitle: "Løn" });

  // Act
  const summary = page.getByText(/Vi fandt 2 mulige fejl/).first();
  const payslipHeading = page.getByRole("heading", { name: /[Ll]ønseddel/ }).first();

  // Assert
  const summaryBox = await summary.boundingBox();
  const payslipBox = await payslipHeading.boundingBox();
  expect(summaryBox?.y ?? 0).toBeLessThan(payslipBox?.y ?? 0);
  await expect(page.getByText(da.pay.payslip.hiddenForAi).first()).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/\d{6}-\d{4}/);
});

test("live_SickSundayWithConsent_PayCheckShowsOneErrorOf13875", async ({ page }) => {
  // Arrange: samtykke Til under Mig
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });
  const consent = page.getByRole("switch", { name: da.consent.sicknessLabel });
  await consent.click();
  await expect(consent).toHaveAttribute("aria-checked", "true");

  // Act: Vagter → søndag 11. okt. → "Jeg var syg"
  await goToShiftsFromHome(page);
  await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
  await page
    .getByRole("button", { name: /søn\.?.*11|11\. okt/i })
    .filter({ hasText: /10:00/ })
    .first()
    .click();
  const details = page.getByRole("dialog");
  await details.getByRole("button", { name: da.shiftDetails.markSick }).click();
  await expect(details.getByText(da.shiftDetails.markedSick)).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();

  // Assert: Løn viser 1 mulig fejl på 138,75 kr.
  await goToPayFromHome(page);
  await expect(page.getByText(/1 mulig fejl – i alt 138,75\skr\./)).toBeVisible();
  expect(errors.messages()).toEqual([]);
});

test("live_SickWithoutConsent_ExplanationWithConsentToggle", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });
  await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
  await page.getByRole("button", { name: /11/ }).filter({ hasText: /10:00/ }).first().click();
  const details = page.getByRole("dialog");

  // Act
  await details.getByRole("button", { name: da.shiftDetails.markSick }).click();

  // Assert
  await expect(details.getByText(da.shiftDetails.consentRequired.title)).toBeVisible();
  await expect(details.getByRole("switch", { name: da.consent.sicknessLabel })).toBeVisible();
});

test("live_AddOctoberShift_ExpectedPayRises", async ({ page }) => {
  // Arrange
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });
  await expect(page.getByText(krPattern("2.838,75")).first()).toBeVisible();

  // Act
  await page.getByRole("button", { name: da.shifts.addShift }).first().click();
  const sheet = page.getByRole("dialog", { name: da.shiftForm.title });
  await sheet.getByLabel(da.shiftForm.date).fill("2026-10-19");
  await sheet.getByLabel(da.shiftForm.start).fill("10:00");
  await sheet.getByLabel(da.shiftForm.end).fill("14:00");
  await sheet.getByLabel(da.shiftForm.pause).fill("0");
  await expect(sheet.getByText(krPattern("370,00"))).toBeVisible();
  await sheet.getByRole("button", { name: da.shiftForm.save }).click();

  // Assert
  await expect(sheet).toBeHidden();
  await expect(page.getByText(krPattern("3.208,75")).first()).toBeVisible();
  await goToPayFromHome(page);
  await expect(page.getByText(krPattern("3.208,75")).first()).toBeVisible();
  expect(errors.messages()).toEqual([]);
});

test("live_AddShiftWithError_ErrorAtFieldAndFocused", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });
  await page.getByRole("button", { name: da.shifts.addShift }).first().click();
  const sheet = page.getByRole("dialog", { name: da.shiftForm.title });
  await sheet.getByLabel(da.shiftForm.date).fill("2026-10-19");
  await sheet.getByLabel(da.shiftForm.start).fill("14:00");
  await sheet.getByLabel(da.shiftForm.end).fill("10:00");
  await sheet.getByLabel(da.shiftForm.pause).fill("0");

  // Act
  await sheet.getByRole("button", { name: da.shiftForm.save }).click();

  // Assert
  const end = sheet.getByLabel(da.shiftForm.end);
  await expect(end).toBeFocused();
  await expect(end).toHaveAttribute("aria-invalid", "true");
  await expect(end).toHaveAccessibleDescription(new RegExp(da.fieldErrors.endNotAfterStart));
});

test("live_AddJob_ShownInMeAndAsJobChoice", async ({ page }) => {
  // Arrange
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });

  // Act
  await page.getByRole("button", { name: da.me.addJob }).click();
  const sheet = page.getByRole("dialog", { name: da.jobForm.title });
  await sheet.getByLabel(da.jobForm.workplace).fill("Testkiosken");
  await sheet.getByLabel(da.jobForm.position).fill("Butiksassistent");
  await sheet.getByRole("radio", { name: "HK Handel – Butik" }).check();
  await sheet.getByRole("button", { name: da.jobForm.save }).click();

  // Assert
  await expect(sheet).toBeHidden();
  await expect(page.getByText("Testkiosken").first()).toBeVisible();
  await expect(page.getByText(da.jobForm.saved)).toBeAttached();
  await goToShiftsFromHome(page);
  const jobPicker = page.getByLabel(da.shifts.jobLabel).first();
  await jobPicker.click();
  await expect(page.getByRole("option", { name: /Testkiosken/ })).toBeVisible();
  expect(errors.messages()).toEqual([]);
});

test("live_AddJobEmpty_ErrorsAndFocusOnWorkplace", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });
  await page.getByRole("button", { name: da.me.addJob }).click();
  const sheet = page.getByRole("dialog", { name: da.jobForm.title });

  // Act
  await sheet.getByRole("button", { name: da.jobForm.save }).click();

  // Assert
  const workplace = sheet.getByLabel(da.jobForm.workplace);
  await expect(workplace).toBeFocused();
  await expect(workplace).toHaveAccessibleDescription(new RegExp(da.fieldErrors.required));
});

test("live_ConsentOffAfterSickMarking_ConfirmDeletesAndAnnouncesCount", async ({ page }) => {
  // Arrange: samtykke Til og søndagsvagten syg
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });
  await page.getByRole("switch", { name: da.consent.sicknessLabel }).click();
  await goToShiftsFromHome(page);
  await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
  await page.getByRole("button", { name: /11/ }).filter({ hasText: /10:00/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: da.shiftDetails.markSick }).click();
  await expect(page.getByRole("dialog").getByText(da.shiftDetails.markedSick)).toBeAttached();
  await page.keyboard.press("Escape");
  await clickTab(page, "Mig");

  // Act
  await page.getByRole("switch", { name: da.consent.sicknessLabel }).click();
  const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog"));
  await expect(confirm.getByText(da.consent.confirm.title)).toBeVisible();
  await confirm.getByRole("button", { name: da.consent.confirm.action }).click();

  // Assert
  await expect(page.getByRole("switch", { name: da.consent.sicknessLabel })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(page.getByText(da.consent.disabled(1))).toBeAttached();
  await goToPayFromHome(page);
  await expect(page.getByText(/Vi fandt 2 mulige fejl – i alt 408,75\skr\./)).toBeVisible();
});

test("live_PayMonthPicker_NextMonthShowsNoPayslip", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/loen", pageTitle: "Løn" });

  // Act
  await page.getByRole("button", { name: da.calendar.nextMonth }).first().click();

  // Assert
  await expect(page.getByText(da.pay.noPayslip.title("november 2026"))).toBeVisible();
  await expect(page.getByText(/Vi fandt 2 mulige fejl/)).toBeHidden();
});
