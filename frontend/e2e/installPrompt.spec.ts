// Installationskortet øverst på Hjem i rigtige browsere.
// Chromium (Pixel 7, Android): et syntetisk beforeinstallprompt-event med en prompt(), der tælles.
// WebKit (iPhone 15, iOS Safari-UA): vejledning med Del og "Føj til hjemmeskærm".
import { expect, test, type Locator, type Page } from "@playwright/test";
import { da } from "../src/texts/da.ts";
import { clickTab, openRoute } from "./support/appRoutes";
import { expectNoAxeViolations } from "./support/axe";
import { collectPageErrors } from "./support/pageErrors";

const dismissedKey = "myJobbuddy.installPrompt.dismissed";
const home = { path: "/", pageTitle: "Hjem" };

type InstallWindow = Window & {
  installPromptCalls?: number;
  resolveInstallChoice?: (choice: { outcome: string; platform: string }) => void;
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

function card(page: Page): Locator {
  return page.getByRole("heading", { name: da.installPrompt.title });
}

function greeting(page: Page): Locator {
  return page.getByRole("heading", { name: /Hej Maja/ });
}

/** Browseren sender beforeinstallprompt; prompt() tælles, og valget afgøres af testen. */
async function dispatchInstallEvent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const target = window as InstallWindow;
    target.installPromptCalls = 0;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperty(event, "prompt", {
      value: () => {
        target.installPromptCalls = (target.installPromptCalls ?? 0) + 1;
        return Promise.resolve();
      },
    });
    Object.defineProperty(event, "userChoice", {
      value: new Promise((resolve) => {
        target.resolveInstallChoice = resolve;
      }),
    });
    window.dispatchEvent(event);
  });
}

async function promptCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as InstallWindow).installPromptCalls ?? 0);
}

async function chooseInBrowserDialog(page: Page, outcome: "accepted" | "dismissed"): Promise<void> {
  await page.evaluate((value) => {
    (window as InstallWindow).resolveInstallChoice?.({ outcome: value, platform: "web" });
  }, outcome);
}

async function expectMinimumTapTarget(button: Locator): Promise<void> {
  const box = await button.boundingBox();
  expect(box?.width ?? 0, "Knappen skal være mindst 44 px bred").toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0, "Knappen skal være mindst 44 px høj").toBeGreaterThanOrEqual(44);
}

test.describe("Android (Chromium)", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "beforeinstallprompt findes kun i Chromium-browsere.");
  });

  test("installPrompt_NoEvent_NoCard", async ({ page }) => {
    // Act
    await openRoute(page, home);

    // Assert
    await expect(greeting(page)).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_EventOnHome_CardAboveGreetingWithTextAndButtons", async ({ page }) => {
    // Arrange
    await openRoute(page, home);

    // Act
    await dispatchInstallEvent(page);

    // Assert
    await expect(card(page)).toBeVisible();
    await expect(page.getByText(da.installPrompt.text)).toBeVisible();
    const cardBox = await card(page).boundingBox();
    const greetingBox = await greeting(page).boundingBox();
    expect(cardBox?.y ?? 0).toBeLessThan(greetingBox?.y ?? 0);
    await expectMinimumTapTarget(page.getByRole("button", { name: da.installPrompt.install }));
    await expectMinimumTapTarget(page.getByRole("button", { name: da.installPrompt.later }));
  });

  test("installPrompt_EventWhileOnOtherPage_CardShownOnHome", async ({ page }) => {
    // Arrange: appen startes på Vagter, og eventet kommer der
    await openRoute(page, { path: "/vagter", pageTitle: "Vagter" });
    await dispatchInstallEvent(page);

    // Act
    await clickTab(page, "Hjem");

    // Assert
    await expect(card(page)).toBeVisible();
  });

  test("installPrompt_Install_PromptOnceWaitsForChoiceThenHidesAndFocusesGreeting", async ({
    page,
  }) => {
    // Arrange
    const errors = collectPageErrors(page);
    await openRoute(page, home);
    await dispatchInstallEvent(page);

    // Act
    await page.getByRole("button", { name: da.installPrompt.install }).click();
    const callsBeforeChoice = await promptCalls(page);
    await expect(page.getByText(da.installPrompt.text)).toBeVisible();
    await chooseInBrowserDialog(page, "accepted");

    // Assert
    expect(callsBeforeChoice).toBe(1);
    await expect(card(page)).toHaveCount(0);
    await expect(greeting(page)).toBeFocused();
    expect(await promptCalls(page)).toBe(1);
    expect(errors.messages()).toEqual([]);
  });

  test("installPrompt_InstallDialogDismissed_CardHiddenAnyway", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await dispatchInstallEvent(page);

    // Act
    await page.getByRole("button", { name: da.installPrompt.install }).click();
    await chooseInBrowserDialog(page, "dismissed");

    // Assert
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_InstallDoubleTapped_PromptCalledOnce", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await dispatchInstallEvent(page);
    const install = page.getByRole("button", { name: da.installPrompt.install });

    // Act: to hurtige tryk, mens browserens dialog er åben
    await install.dblclick();
    await chooseInBrowserDialog(page, "dismissed");

    // Assert
    expect(await promptCalls(page)).toBe(1);
  });

  test("installPrompt_NotNow_HiddenFocusOnGreetingAndRememberedAfterReload", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await dispatchInstallEvent(page);

    // Act
    await page.getByRole("button", { name: da.installPrompt.later }).click();

    // Assert
    await expect(card(page)).toHaveCount(0);
    await expect(greeting(page)).toBeFocused();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), dismissedKey)).toBe(
      "true",
    );

    // Act: ny session på samme enhed, og browseren tilbyder igen installation
    await page.reload();
    await openRoute(page, home);
    await dispatchInstallEvent(page);

    // Assert
    await expect(greeting(page)).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_AppInstalled_CardHidden", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await dispatchInstallEvent(page);
    await expect(card(page)).toBeVisible();

    // Act
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));

    // Assert
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_RunningInstalled_NoCard", async ({ page }) => {
    // Arrange: appen kører som installeret (display-mode: standalone)
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query: string): MediaQueryList => {
        const result = original(query);
        if (!query.includes("display-mode: standalone")) {
          return result;
        }
        Object.defineProperty(result, "matches", { value: true });
        return result;
      };
    });
    await openRoute(page, home);

    // Act
    await dispatchInstallEvent(page);

    // Assert
    await expect(greeting(page)).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_CardShown_NoAxeViolations", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await dispatchInstallEvent(page);
    await expect(card(page)).toBeVisible();

    // Act & Assert
    await expectNoAxeViolations(page);
  });
});

test.describe("iPhone (WebKit, Safari)", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "webkit", "iPhone-profilen køres i WebKit.");
  });

  test("installPrompt_IosSafari_GuideWithStepsAndNoInstallButton", async ({ page }) => {
    // Act
    await openRoute(page, home);

    // Assert
    await expect(card(page)).toBeVisible();
    await expect(page.getByText(da.installPrompt.text)).toBeVisible();
    const steps = page.getByRole("listitem").filter({ hasText: /Del|hjemmeskærm/ });
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toContainText("Tryk på Del");
    await expect(steps.nth(0)).toContainText("(eller ⋯ og så Del)");
    await expect(steps.nth(1)).toContainText("Vælg “Føj til hjemmeskærm”");
    await expect(page.getByRole("button", { name: da.installPrompt.install })).toHaveCount(0);
    await expectMinimumTapTarget(page.getByRole("button", { name: da.installPrompt.later }));
  });

  test("installPrompt_IosNotNow_HiddenFocusOnGreetingAndRememberedAfterReload", async ({
    page,
  }) => {
    // Arrange
    await openRoute(page, home);

    // Act
    await page.getByRole("button", { name: da.installPrompt.later }).click();

    // Assert
    await expect(card(page)).toHaveCount(0);
    await expect(greeting(page)).toBeFocused();
    await page.reload();
    await openRoute(page, home);
    await expect(greeting(page)).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_IosStartedFromHomeScreen_NoCard", async ({ page }) => {
    // Arrange: navigator.standalone er true, når appen er startet fra hjemmeskærmen
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, "standalone", { value: true, configurable: true });
    });

    // Act
    await openRoute(page, home);

    // Assert
    await expect(greeting(page)).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("installPrompt_IosGuideShown_NoAxeViolations", async ({ page }) => {
    // Arrange
    await openRoute(page, home);
    await expect(card(page)).toBeVisible();

    // Act & Assert
    await expectNoAxeViolations(page);
  });

  test("installPrompt_StorageThrows_AppWorksAndNotNowHides", async ({ page }) => {
    // Arrange: localStorage kaster fejl (fx privat tilstand eller blokeret lager)
    const errors = collectPageErrors(page);
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("SecurityError");
      };
      Storage.prototype.setItem = () => {
        throw new Error("SecurityError");
      };
    });
    await openRoute(page, home);
    await expect(card(page)).toBeVisible();

    // Act
    await page.getByRole("button", { name: da.installPrompt.later }).click();

    // Assert
    await expect(card(page)).toHaveCount(0);
    await expect(greeting(page)).toBeFocused();
    expect(errors.messages()).toEqual([]);
  });
});

test.describe("andre browsere på iPhone", () => {
  for (const [name, userAgent] of [
    [
      "Chrome (CriOS)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
    ],
    [
      "Firefox (FxiOS)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15",
    ],
  ] as const) {
    test.describe(name, () => {
      test.use({ userAgent });

      test(`installPrompt_${name.split(" ")[0] ?? name}OnIphone_NoCard`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "webkit", "iPhone-browsere køres i WebKit.");

        // Act
        await openRoute(page, home);

        // Assert
        await expect(greeting(page)).toBeVisible();
        await expect(card(page)).toHaveCount(0);
      });
    });
  }
});
