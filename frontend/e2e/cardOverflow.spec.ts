// Fejlrettelse (fundet på en Android-telefon, ca. 412 px): på Hjem flyder Løn-feltet ind under
// Rettigheder-feltet, fordi status-badgen ikke ombrydes og gør feltets indhold bredere end feltet.
// Siden scroller ikke vandret, så reflow-testene fanger det ikke.
// Her måles derfor inde i hvert kort: kortene må ikke overlappe hinanden, og intet element i et kort
// må række ud over kortets venstre eller højre kant. Bredder 320–430 px, også med større tekst.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { openRoute } from "./support/appRoutes";

const widths = [320, 360, 390, 412, 430];

/** Tolerance i px for afrunding af kanter. */
const tolerancePx = 1;

/**
 * Elementer i kortene, der rækker ud over kortets kant. Med walkUp=true er de givne elementer
 * startpunkter, og kortet er den nærmeste forfader med baggrundsfarve og mindst halv skærmbredde.
 * Funktionen kører i browseren og må ikke bruge noget uden for sig selv.
 */
function overflowIssues(
  starts: Element[],
  options: { walkUp: boolean; tolerance: number },
): string[] {
  const issues: string[] = [];
  const describe = (element: Element): string => {
    const text = element.getAttribute("aria-label") ?? element.textContent ?? "";
    return text.trim().replace(/\s+/g, " ").slice(0, 40);
  };
  const hasBackground = (element: Element): boolean => {
    const color = window.getComputedStyle(element).backgroundColor;
    return color !== "" && color !== "transparent" && color !== "rgba(0, 0, 0, 0)";
  };
  const cardOf = (start: Element): Element => {
    let current: Element | null = start;
    while (current !== null && current !== document.body) {
      const wideEnough = current.getBoundingClientRect().width >= window.innerWidth / 2;
      if (hasBackground(current) && wideEnough) {
        return current;
      }
      current = current.parentElement;
    }
    return start;
  };

  for (const start of starts) {
    const card = options.walkUp ? cardOf(start) : start;
    const box = card.getBoundingClientRect();
    const cardName = describe(card);
    if (card instanceof HTMLElement && card.scrollWidth > card.clientWidth + options.tolerance) {
      issues.push(
        `"${cardName}": indholdet er ${String(card.scrollWidth)}px bredt, kortet ${String(card.clientWidth)}px`,
      );
    }
    for (const child of Array.from(card.querySelectorAll("*"))) {
      const rect = child.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }
      // Rene dekorationer uden tekst og navn (fx en baggrundsform, som kortet klipper) tæller ikke.
      const isDecoration =
        (child.textContent ?? "").trim() === "" &&
        child.getAttribute("aria-label") === null &&
        child.closest("svg") === null;
      if (isDecoration) {
        continue;
      }
      const outLeft = box.left - rect.left;
      const outRight = rect.right - box.right;
      const out = Math.max(outLeft, outRight);
      if (out > options.tolerance) {
        const side = outRight >= outLeft ? "højre" : "venstre";
        issues.push(
          `"${cardName}": <${child.tagName.toLowerCase()}> "${describe(child)}" rækker ${String(Math.round(out))}px ud til ${side} (element ${String(Math.round(rect.left))}–${String(Math.round(rect.right))}px, kort ${String(Math.round(box.left))}–${String(Math.round(box.right))}px)`,
        );
      }
    }
  }
  return issues;
}

/** Par af elementer, hvis bokse overlapper. */
function overlappingPairs(elements: Element[], tolerance: number): string[] {
  const pairs: string[] = [];
  const name = (element: Element): string =>
    (element.getAttribute("aria-label") ?? element.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30);
  elements.forEach((firstElement, firstIndex) => {
    for (const secondElement of elements.slice(firstIndex + 1)) {
      const a = firstElement.getBoundingClientRect();
      const b = secondElement.getBoundingClientRect();
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (width > tolerance && height > tolerance) {
        pairs.push(
          `"${name(firstElement)}" og "${name(secondElement)}" overlapper ${String(Math.round(width))}×${String(Math.round(height))}px`,
        );
      }
    }
  });
  return pairs;
}

async function issuesIn(cards: Locator, walkUp = false): Promise<string[]> {
  expect(await cards.count(), "Ingen kort fundet").toBeGreaterThan(0);
  return cards.evaluateAll(overflowIssues, { walkUp, tolerance: tolerancePx });
}

function homeTiles(page: Page): Locator {
  return page
    .getByRole("navigation", { name: da.home.tiles.label })
    .getByRole("listitem")
    .locator("> a, > button");
}

async function expandAllDeviations(page: Page): Promise<void> {
  const toggles = page.getByRole("button", { name: /mangler/ });
  for (const toggle of await toggles.all()) {
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
  }
}

/**
 * Telefoner kan have større systemtekst (fx Samsung og Android "Skriftstørrelse"). Det simuleres
 * ved at forstørre rodskriften, så alle rem-mål vokser som på telefonen.
 */
type LayoutConfig = { width: number; textScale: number };

const configs: LayoutConfig[] = [
  ...widths.map((width) => ({ width, textScale: 1 })),
  { width: 360, textScale: 1.15 },
  { width: 412, textScale: 1.15 },
  { width: 412, textScale: 1.3 },
];

function configLabel(config: LayoutConfig): string {
  const scale =
    config.textScale === 1 ? "" : `Text${String(Math.round(config.textScale * 100))}pct`;
  return `${String(config.width)}px${scale}`;
}

async function openAt(
  page: Page,
  path: string,
  pageTitle: string,
  config: LayoutConfig,
): Promise<void> {
  await openRoute(page, { path, pageTitle });
  if (config.textScale !== 1) {
    await page.addStyleTag({
      content: `html { font-size: ${String(Math.round(config.textScale * 100))}% !important; }`,
    });
  }
}

for (const config of configs) {
  const label = configLabel(config);

  test.describe(label, () => {
    test.use({ viewport: { width: config.width, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    test(`home_FeatureTilesAt${label}_DoNotOverlap`, async ({ page }) => {
      // Arrange
      await openAt(page, "/", "Hjem", config);
      await expect(homeTiles(page)).toHaveCount(4);

      // Act
      const pairs = await homeTiles(page).evaluateAll(overlappingPairs, tolerancePx);

      // Assert
      expect(pairs).toEqual([]);
    });

    test(`home_FeatureTilesAt${label}_ContentStaysInsideTile`, async ({ page }) => {
      // Arrange
      await openAt(page, "/", "Hjem", config);
      await expect(homeTiles(page)).toHaveCount(4);

      // Act
      const issues = await issuesIn(homeTiles(page));

      // Assert
      expect(issues).toEqual([]);
    });

    test(`home_GreetingAndPromoAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/", "Hjem", config);

      // Act
      const greeting = await issuesIn(page.getByRole("heading", { name: /Maja/ }), true);
      const promo = await issuesIn(
        page.getByRole("heading", { name: da.home.promo.title, exact: true }),
        true,
      );

      // Assert
      expect([...greeting, ...promo]).toEqual([]);
    });

    test(`shifts_ShiftListItemsAt${label}_ContentStaysInsideItem`, async ({ page }) => {
      // Arrange
      await openAt(page, "/vagter", "Vagter", config);
      const items = page.getByRole("button").filter({ hasText: da.shifts.item.expected });
      await expect(items.first()).toBeVisible();

      // Act
      const issues = await issuesIn(items);

      // Assert
      expect(issues).toEqual([]);
    });

    test(`shifts_CalendarAndTotalsAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/vagter", "Vagter", config);

      // Act
      const calendar = await issuesIn(page.getByRole("region", { name: /Kalender for/ }));
      const totals = await issuesIn(page.getByText(da.shifts.totalPay).first(), true);

      // Assert
      expect([...calendar, ...totals]).toEqual([]);
    });

    test(`pay_SummaryAndPayslipAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/loen", "Løn", config);

      // Act
      const summary = await issuesIn(page.getByRole("heading", { name: /Vi fandt/ }), true);
      const payslip = await issuesIn(page.getByRole("heading", { name: /Lønseddel/ }), true);

      // Assert
      expect([...summary, ...payslip]).toEqual([]);
    });

    test(`pay_DeviationCardsExpandedAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/loen", "Løn", config);
      await expandAllDeviations(page);
      const cards = page
        .getByRole("main")
        .getByRole("listitem")
        .filter({ has: page.getByRole("button", { name: /mangler/ }) });

      // Act
      const issues = await issuesIn(cards);

      // Assert
      expect(issues).toEqual([]);
    });

    test(`me_PlanCardsAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/mig", "Mig", config);
      const names = [
        da.subscription.names.free,
        da.subscription.names.plus,
        da.subscription.names.payPerQuestion,
      ];
      const issues: string[] = [];

      for (const name of names) {
        // Act
        issues.push(...(await issuesIn(page.getByText(name, { exact: true }).first(), true)));
      }

      // Assert
      expect(issues).toEqual([]);
    });

    test(`me_JobRowAndProfileAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/mig", "Mig", config);

      // Act
      const job = await issuesIn(page.getByText("Torvebutikken").first(), true);
      const profile = await issuesIn(page.getByText("Maja").first(), true);
      const consent = await issuesIn(
        page.getByRole("switch", { name: da.consent.sicknessLabel }),
        true,
      );

      // Assert
      expect([...job, ...profile, ...consent]).toEqual([]);
    });

    test(`jobForm_ComingSoonButtonsAt${label}_ContentStaysInsideButton`, async ({ page }) => {
      // Arrange
      await openAt(page, "/mig", "Mig", config);
      await page.getByRole("button", { name: da.me.addJob, exact: true }).click();
      const form = page.getByRole("dialog", { name: da.jobForm.title });
      const buttons = form.getByRole("button", { name: new RegExp(`${da.status.comingSoon}$`) });
      await expect(buttons.first()).toBeVisible();

      // Act
      const issues = await issuesIn(buttons);
      const radios = await issuesIn(form.getByRole("radio").locator("xpath=.."));

      // Assert
      expect([...issues, ...radios]).toEqual([]);
    });

    test(`ai_ChipsAndAnswerAt${label}_ContentStaysInsideCard`, async ({ page }) => {
      // Arrange
      await openAt(page, "/ai", "AI", config);
      const chips = page.getByRole("button", { name: /søndag|løn|pause|ferie|chef|opsig|syg/i });
      await chips.first().click();
      await expect(page.getByText(da.ai.aiSaid).first()).toBeAttached();

      // Act
      const chipIssues = await issuesIn(chips);
      const disclaimer = await issuesIn(page.getByText(da.ai.disclaimer).first(), true);

      // Assert
      expect([...chipIssues, ...disclaimer]).toEqual([]);
    });
  });
}
