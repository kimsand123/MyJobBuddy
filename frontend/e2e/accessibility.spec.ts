// axe (WCAG 2.2 AA) på hver rute og på den åbne "Ikke implementeret"-dialog.
import { expect, test } from "@playwright/test";
import { openRoute, routesUnderTest } from "./support/appRoutes";
import { expectNoAxeViolations } from "./support/axe";
import { collectPageErrors } from "./support/pageErrors";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const route of routesUnderTest) {
  test(`axe_Route${route.path}_NoWcag22AaViolations`, async ({ page }) => {
    // Arrange
    const errors = collectPageErrors(page);

    // Act
    await openRoute(page, route);

    // Assert
    await expectNoAxeViolations(page);
    expect(errors.messages()).toEqual([]);
  });
}

test("axe_NotImplementedDialogOpen_NoWcag22AaViolations", async ({ page }) => {
  // Arrange
  const errors = collectPageErrors(page);
  await openRoute(page, { path: "/", pageTitle: "Hjem" });

  // Act
  await page.getByRole("button", { name: /^Notifikationer/ }).click();
  const dialog = page.getByRole("dialog", { name: "Ikke implementeret" });
  await expect(dialog).toBeVisible();

  // Assert
  await expect(dialog).toContainText("Denne funktion er ikke en del af demoen endnu.");
  await expectNoAxeViolations(page);
  expect(errors.messages()).toEqual([]);
});
