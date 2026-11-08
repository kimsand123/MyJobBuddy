// Alle handlinger, som planens tabel kalder "Ikke implementeret", viser dialogen, og fokus vender
// tilbage til knappen, når dialogen lukkes med OK.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { openRoute, type RouteUnderTest } from "./support/appRoutes";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

type NotImplementedAction = {
  name: string;
  route: RouteUnderTest;
  /** Bringer siden i den tilstand, hvor knappen findes, og giver knappen. */
  trigger: (page: Page) => Promise<Locator>;
};

const home: RouteUnderTest = { path: "/", pageTitle: "Hjem" };
const me: RouteUnderTest = { path: "/mig", pageTitle: "Mig" };
const shifts: RouteUnderTest = { path: "/vagter", pageTitle: "Vagter" };
const pay: RouteUnderTest = { path: "/loen", pageTitle: "Løn" };
const ai: RouteUnderTest = { path: "/ai", pageTitle: "AI" };

function exactButton(page: Page | Locator, name: string): Locator {
  return page.getByRole("button", { name, exact: true });
}

async function openSundayShift(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /^11\. okt\. 2026/ }).click();
  await page.getByRole("button", { name: /11/ }).filter({ hasText: /10:00/ }).first().click();
  return page.getByRole("dialog");
}

async function openJobForm(page: Page): Promise<Locator> {
  await exactButton(page, da.me.addJob).click();
  return page.getByRole("dialog", { name: da.jobForm.title });
}

const actions: NotImplementedAction[] = [
  {
    name: "Hjem_Kontrakt",
    route: home,
    trigger: (page) => Promise.resolve(page.getByRole("button", { name: /^Kontrakt/ })),
  },
  {
    name: "Hjem_Klokken",
    route: home,
    trigger: (page) => Promise.resolve(page.getByRole("button", { name: /^Notifikationer/ })),
  },
  {
    name: "Mig_RedigerProfil",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.me.editProfile)),
  },
  {
    name: "Mig_UploadKontrakt",
    route: me,
    trigger: (page) =>
      Promise.resolve(
        exactButton(page, da.me.jobActionLabel(da.me.uploadContract, "Torvebutikken")),
      ),
  },
  {
    name: "Mig_RetJob",
    route: me,
    trigger: (page) =>
      Promise.resolve(exactButton(page, da.me.jobActionLabel(da.me.editJob, "Torvebutikken"))),
  },
  {
    name: "Mig_SletJob",
    route: me,
    trigger: (page) =>
      Promise.resolve(exactButton(page, da.me.jobActionLabel(da.me.deleteJob, "Torvebutikken"))),
  },
  {
    name: "Mig_SkiftTilPlus",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.subscription.select.plus)),
  },
  {
    name: "Mig_KoebSpoergsmaal",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.subscription.select.payPerQuestion)),
  },
  {
    name: "Mig_SeMineData",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.me.myData.see)),
  },
  {
    name: "Mig_HentMineData",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.me.myData.download)),
  },
  {
    name: "Mig_SletAlleMineData",
    route: me,
    trigger: (page) => Promise.resolve(exactButton(page, da.me.myData.deleteAll)),
  },
  {
    name: "Mig_OverenskomstKommerSnart",
    route: me,
    trigger: async (page) => {
      const form = await openJobForm(page);
      return form.getByRole("button", { name: new RegExp(da.status.comingSoon) }).first();
    },
  },
  {
    name: "Vagter_RetVagt",
    route: shifts,
    trigger: async (page) => exactButton(await openSundayShift(page), da.shiftDetails.edit),
  },
  {
    name: "Vagter_SletVagt",
    route: shifts,
    trigger: async (page) => exactButton(await openSundayShift(page), da.shiftDetails.delete),
  },
  {
    name: "Loen_SaadanSpoergerDuDinChef",
    route: pay,
    trigger: async (page) => {
      const toggle = page.getByRole("button", { name: /Søndagstillæg mangler/ });
      if ((await toggle.getAttribute("aria-expanded")) !== "true") {
        await toggle.click();
      }
      return page.getByRole("listitem").filter({ has: toggle }).getByRole("button", {
        name: da.pay.deviation.askBoss,
      });
    },
  },
  {
    name: "Loen_UploadLoenseddel",
    route: pay,
    trigger: async (page) => {
      await page.getByRole("button", { name: da.calendar.nextMonth }).first().click();
      await expect(page.getByText(da.pay.noPayslip.title("november 2026"))).toBeVisible();
      return page
        .getByRole("button", { name: new RegExp(`${da.pay.upload.select}|${da.pay.upload.title}`) })
        .first();
    },
  },
  {
    name: "AI_SendFritekst",
    route: ai,
    trigger: async (page) => {
      await page.getByLabel(da.ai.input.label).fill("Hvornår skal jeg have pause?");
      return exactButton(page, da.ai.input.send);
    },
  },
  {
    name: "AI_DelMedHkHandel",
    route: ai,
    trigger: async (page) => {
      const seriousChip = page.getByRole("button", { name: /opsag|fyre|chef|syg/i }).first();
      await seriousChip.click();
      await exactButton(page, da.ai.escalation.share).click();
      const sheet = page.getByRole("dialog", { name: da.ai.consentSheet.title(da.ai.recipient) });
      return exactButton(sheet, da.ai.consentSheet.confirm(da.ai.recipient));
    },
  },
];

for (const action of actions) {
  test(`notImplemented_${action.name}_DialogShownAndFocusReturns`, async ({ page }) => {
    // Arrange
    await openRoute(page, action.route);
    const trigger = await action.trigger(page);
    await expect(trigger).toBeVisible();

    // Act
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: da.notImplemented.title });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(da.notImplemented.text);
    await dialog.getByRole("button", { name: da.notImplemented.ok }).click();

    // Assert
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
