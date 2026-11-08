// Monkey test pr. rute: et stort fast antal tilfældige klik og tastetryk styret af et seed.
// Seedet skrives i testoutput. Testen fejler ved uventede exceptions, konsolfejl, en udløst
// Error Boundary, en side uden for appen eller axe-fejl.
// Genskab en fejl: MONKEY_SEED=<seed> npm run test:e2e --prefix <frontend>
import { expect, test, type Page } from "@playwright/test";
import { openRoute, routesUnderTest } from "./support/appRoutes";
import { findAxeViolations } from "./support/axe";
import { collectPageErrors } from "./support/pageErrors";
import { createSeededRandom, monkeySeed, type Random } from "./support/seededRandom";

const actionCount = 250;
const axeEveryActions = 50;
const baseSeed = 20261031;
const errorBoundaryTitle = "Noget gik galt";

const monkeyKeys = [
  "Tab",
  "Shift+Tab",
  "Enter",
  "Space",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "a",
  "1",
];

const interactiveSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='switch']",
  "[role='tab']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

type Point = { x: number; y: number };

/** Midtpunkter for synlige, interaktive elementer i viewporten. */
async function interactivePoints(page: Page): Promise<Point[]> {
  return page.evaluate((selector) => {
    const points: { x: number; y: number }[] = [];
    for (const element of Array.from(document.querySelectorAll(selector))) {
      const box = element.getBoundingClientRect();
      const insideViewport =
        box.width > 0 &&
        box.height > 0 &&
        box.bottom > 0 &&
        box.right > 0 &&
        box.top < window.innerHeight &&
        box.left < window.innerWidth;
      if (insideViewport) {
        points.push({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }
    }
    return points;
  }, interactiveSelector);
}

async function randomAction(page: Page, random: Random): Promise<string> {
  const choice = random.next();
  const viewport = page.viewportSize() ?? { width: 390, height: 844 };

  if (choice < 0.5) {
    const points = await interactivePoints(page);
    if (points.length > 0) {
      const point = points[random.index(points.length)] ?? { x: 0, y: 0 };
      await page.mouse.click(point.x, point.y);
      return `klik på element (${Math.round(point.x)}, ${Math.round(point.y)})`;
    }
  }

  if (choice < 0.75) {
    const x = random.index(viewport.width);
    const y = random.index(viewport.height);
    await page.mouse.click(x, y);
    return `klik (${x}, ${y})`;
  }

  const key = monkeyKeys[random.index(monkeyKeys.length)] ?? "Tab";
  await page.keyboard.press(key);
  return `tast ${key}`;
}

/** Fejl, der skal stoppe testen. Tom liste = alt er i orden. */
async function problemsOnPage(page: Page, origin: string): Promise<string[]> {
  const problems: string[] = [];
  if (!page.url().startsWith(origin)) {
    problems.push(`Siden forlod appen: ${page.url()}`);
    return problems;
  }
  const boundaryCount = await page.getByRole("heading", { name: errorBoundaryTitle }).count();
  if (boundaryCount > 0) {
    problems.push("En Error Boundary blev udløst.");
  }
  return problems;
}

routesUnderTest.forEach((route, routeIndex) => {
  test(`monkey_Route${route.path}_NoErrorsAfterRandomActions`, async ({
    page,
    baseURL,
  }, testInfo) => {
    test.setTimeout(240_000);

    // Arrange
    const seed = monkeySeed(baseSeed + routeIndex);
    testInfo.annotations.push({ type: "monkey-seed", description: String(seed) });
    process.stdout.write(
      `[monkey] ${testInfo.project.name} ${route.path}: seed=${String(seed)}, handlinger=${String(actionCount)}\n`,
    );
    const random = createSeededRandom(seed);
    const origin = baseURL ?? "http://127.0.0.1:4173";
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = collectPageErrors(page);
    await openRoute(page, route);
    const actions: string[] = [];

    // Act
    for (let step = 1; step <= actionCount; step += 1) {
      actions.push(await randomAction(page, random));
      await page.waitForTimeout(15);

      const problems = [...errors.messages(), ...(await problemsOnPage(page, origin))];
      if (step % axeEveryActions === 0 && problems.length === 0) {
        const violations = await findAxeViolations(page);
        if (violations.length > 0) {
          problems.push(`axe efter handling ${String(step)}: ${JSON.stringify(violations)}`);
        }
      }

      // Assert (undervejs): stop ved første fejl med seed og de seneste handlinger
      expect(
        problems,
        `seed=${String(seed)}, handling ${String(step)}, seneste: ${actions.slice(-5).join(" | ")}`,
      ).toEqual([]);
    }

    // Assert
    expect(errors.messages()).toEqual([]);
    expect(await problemsOnPage(page, origin)).toEqual([]);
    expect(await findAxeViolations(page)).toEqual([]);
  });
});
