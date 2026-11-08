// axe mod WCAG 2.2 AA. Kræver page.emulateMedia({ reducedMotion: "reduce" }), ellers måles
// halvgennemsigtige farver midt i dialogens animation.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type AxeViolationSummary = {
  id: string;
  impact: string | null | undefined;
  help: string;
  targets: string[];
};

export async function findAxeViolations(page: Page): Promise<AxeViolationSummary[]> {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const violations = await findAxeViolations(page);
  expect(violations).toEqual([]);
}
