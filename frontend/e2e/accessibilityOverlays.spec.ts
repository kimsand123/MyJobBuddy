// axe (WCAG 2.2 AA) på åbne ark, dialoger og udfoldede kort. Reduced motion, så farver ikke måles
// midt i en animation.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support/axe";
import { openOverlay, overlayCases } from "./support/overlays";
import { collectPageErrors } from "./support/pageErrors";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const overlay of overlayCases) {
  test(`axe_${overlay.name}Open_NoWcag22AaViolations`, async ({ page }) => {
    // Arrange
    const errors = collectPageErrors(page);

    // Act
    await openOverlay(page, overlay);

    // Assert
    await expectNoAxeViolations(page);
    expect(errors.messages()).toEqual([]);
  });
}
