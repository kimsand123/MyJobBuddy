// Ruterne og deres sidetitler. Dokumenttitlen er "<Side> – My Jobbuddy".
// openRoute venter også på indhold, der først vises, når skærmens data er hentet fra mock-API'et.
import { expect, type Locator, type Page } from "@playwright/test";

export type RouteUnderTest = {
  path: string;
  pageTitle: string;
};

export const routesUnderTest: readonly RouteUnderTest[] = [
  { path: "/", pageTitle: "Hjem" },
  { path: "/vagter", pageTitle: "Vagter" },
  { path: "/loen", pageTitle: "Løn" },
  { path: "/ai", pageTitle: "AI" },
  { path: "/mig", pageTitle: "Mig" },
  { path: "/findes-ikke", pageTitle: "Siden findes ikke" },
];

export function documentTitle(pageTitle: string): string {
  return `${pageTitle} – My Jobbuddy`;
}

/** Indhold, der først vises, når skærmens data er hentet. */
function readyMarker(page: Page, path: string): Locator {
  switch (path) {
    case "/":
      return page.getByText(/Maja/).first();
    case "/vagter":
      return page.getByRole("button", { name: "Tilføj vagt" }).first();
    case "/loen":
      return page.getByText(/Vi fandt 2 mulige fejl/).first();
    case "/ai":
      return page.getByRole("button", { name: /søndag|løn|pause|ferie|chef|opsig|syg/i }).first();
    case "/mig":
      return page.getByText("Torvebutikken").first();
    default:
      return page.getByRole("heading", { level: 1 }).first();
  }
}

/** Åbner ruten og venter, til appen har sat sidens titel og vist sine data. */
export async function openRoute(page: Page, route: RouteUnderTest): Promise<void> {
  await page.goto(route.path);
  await expect(page).toHaveTitle(documentTitle(route.pageTitle));
  await expect(readyMarker(page, route.path)).toBeVisible();
}

/** Går til en side via fanebjælken eller et link i appen, så hukommelsen i mock-API'et bevares. */
export async function clickTab(page: Page, name: "Hjem" | "AI" | "Mig"): Promise<void> {
  await page
    .getByRole("navigation", { name: "Hovedmenu" })
    .getByRole("link", { name, exact: true })
    .click();
}
