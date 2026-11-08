// Ark og dialoger, der kan åbnes på skærmene. Hver funktion åbner sin og venter, til den er synlig.
import { expect, type Page } from "@playwright/test";
import { da } from "../../src/texts/da.ts";
import { openRoute, type RouteUnderTest } from "./appRoutes";

export type OverlayCase = {
  name: string;
  route: RouteUnderTest;
  open: (page: Page) => Promise<void>;
};

const shifts: RouteUnderTest = { path: "/vagter", pageTitle: "Vagter" };
const me: RouteUnderTest = { path: "/mig", pageTitle: "Mig" };
const pay: RouteUnderTest = { path: "/loen", pageTitle: "Løn" };
const ai: RouteUnderTest = { path: "/ai", pageTitle: "AI" };

export const overlayCases: readonly OverlayCase[] = [
  {
    name: "TilfoejVagt",
    route: shifts,
    open: async (page) => {
      await page.getByRole("button", { name: da.shifts.addShift, exact: true }).first().click();
      await expect(page.getByRole("dialog", { name: da.shiftForm.title })).toBeVisible();
    },
  },
  {
    name: "Vagtdetaljer",
    route: shifts,
    open: async (page) => {
      await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
      await page.getByRole("button", { name: /11/ }).filter({ hasText: /10:00/ }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
    },
  },
  {
    name: "SygdomKraeverSamtykke",
    route: shifts,
    open: async (page) => {
      await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
      await page.getByRole("button", { name: /11/ }).filter({ hasText: /10:00/ }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: da.shiftDetails.markSick }).click();
      await expect(dialog.getByText(da.shiftDetails.consentRequired.title)).toBeVisible();
    },
  },
  {
    name: "TilfoejJob",
    route: me,
    open: async (page) => {
      await page.getByRole("button", { name: da.me.addJob, exact: true }).click();
      await expect(page.getByRole("dialog", { name: da.jobForm.title })).toBeVisible();
    },
  },
  {
    name: "SamtykkeFraBekraeftelse",
    route: me,
    open: async (page) => {
      const consent = page.getByRole("switch", { name: da.consent.sicknessLabel });
      await consent.click();
      await expect(consent).toHaveAttribute("aria-checked", "true");
      await consent.click();
      await expect(page.getByText(da.consent.confirm.title)).toBeVisible();
    },
  },
  {
    name: "MuligFejlFoldetUd",
    route: pay,
    open: async (page) => {
      const toggle = page.getByRole("button", { name: /Søndagstillæg mangler/ });
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    },
  },
  {
    name: "DelMinSag",
    route: ai,
    open: async (page) => {
      await page
        .getByRole("button", { name: /opsag|fyre|chef|syg/i })
        .first()
        .click();
      await page.getByRole("button", { name: da.ai.escalation.share, exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: da.ai.consentSheet.title(da.ai.recipient) }),
      ).toBeVisible();
    },
  },
];

export async function openOverlay(page: Page, overlay: OverlayCase): Promise<void> {
  await openRoute(page, overlay.route);
  await overlay.open(page);
}
