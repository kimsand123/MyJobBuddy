// Ved 320 og 360 px bredde: ingen vandret scroll på nogen skærm, heller ikke med kalenderen, åbne
// ark og dialoger (WCAG 1.4.10 Reflow).
import { expect, test, type Page } from "@playwright/test";
import { openRoute, routesUnderTest } from "./support/appRoutes";
import { openOverlay, overlayCases } from "./support/overlays";

const widths = [320, 360];

type Overflow = { scrollWidth: number; clientWidth: number; widest: string };

/** Hvor bred siden er, og hvilket element der stikker længst ud til højre. */
async function measureOverflow(page: Page): Promise<Overflow> {
  return page.evaluate(() => {
    const root = document.documentElement;
    let widest = "";
    let widestRight = root.clientWidth;
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      const right = element.getBoundingClientRect().right;
      if (right > widestRight + 1) {
        widestRight = right;
        const label = element.getAttribute("aria-label") ?? element.textContent ?? "";
        widest = `${element.tagName.toLowerCase()} "${label.trim().slice(0, 40)}" (${String(Math.round(right))}px)`;
      }
    }
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, widest };
  });
}

for (const width of widths) {
  test.describe(`${String(width)} px`, () => {
    test.use({ viewport: { width, height: 640 } });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    for (const route of routesUnderTest) {
      test(`reflow_Route${route.path}At${String(width)}px_NoHorizontalScroll`, async ({ page }) => {
        // Act
        await openRoute(page, route);
        const overflow = await measureOverflow(page);

        // Assert
        expect(overflow.scrollWidth, overflow.widest).toBeLessThanOrEqual(overflow.clientWidth);
      });
    }

    for (const overlay of overlayCases) {
      test(`reflow_${overlay.name}At${String(width)}px_NoHorizontalScroll`, async ({ page }) => {
        // Act
        await openOverlay(page, overlay);
        const overflow = await measureOverflow(page);

        // Assert
        expect(overflow.scrollWidth, overflow.widest).toBeLessThanOrEqual(overflow.clientWidth);
      });
    }
  });
}
