// Tilgængelige navne beregnet af en rigtig browser: "Kommer snart" med separator og kalenderdagen
// med ugedag.
import { expect, test } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { openRoute } from "./support/appRoutes";

test("names_ComingSoonAgreements_NameIsAgreementCommaSpaceComingSoon", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });
  await page.getByRole("button", { name: da.me.addJob, exact: true }).click();
  const form = page.getByRole("dialog", { name: da.jobForm.title });

  // Act
  const comingSoon = form.getByRole("button", { name: new RegExp(`${da.status.comingSoon}$`) });

  // Assert
  expect(await comingSoon.count()).toBeGreaterThan(0);
  for (const button of await comingSoon.all()) {
    await expect(button).toHaveAccessibleName(new RegExp(`^\\S.*\\S, ${da.status.comingSoon}$`));
  }
});

test("names_CalendarShiftDay_NameHasDateWeekdayAndShift", async ({ page }) => {
  // Act
  await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });

  // Assert
  await expect(page.getByRole("button", { name: "11. okt. 2026, søndag, vagt" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^1\. okt\. 2026, torsdag/ })).toBeVisible();
});
