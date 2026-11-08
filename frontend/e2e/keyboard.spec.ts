// Tastaturnavigation: fanebjælken kan nås og bruges med Tab og Enter, fokus er altid synligt, og
// "Ikke implementeret"-dialogen kan betjenes med tastatur.
// Safari (WebKit) tabber som standard kun til formularfelter og knapper, og Playwrights WebKit kan
// ikke sende Option+Tab. I WebKit får et link derfor fokus programmatisk lige efter et tastetryk
// (så browseren behandler det som tastaturfokus), og selve Tab-rækkefølgen mellem links testes kun
// i Chromium.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { documentTitle, openRoute } from "./support/appRoutes";

const maxTabPresses = 40;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

function tabLink(page: Page, name: string): Locator {
  return page
    .getByRole("navigation", { name: "Hovedmenu" })
    .getByRole("link", { name, exact: true });
}

async function isFocused(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => element === document.activeElement);
}

/** Trykker Tab, til elementet har fokus. Fejler, hvis det ikke nås. */
async function tabUntilFocused(page: Page, target: Locator): Promise<void> {
  for (let press = 0; press < maxTabPresses; press += 1) {
    if (await isFocused(target)) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  expect(await isFocused(target), "Elementet kunne ikke nås med Tab").toBe(true);
}

/** Et fanelink med tastaturfokus. Med Tab, undtagen i WebKit (se kommentaren øverst). */
async function focusTabLinkWithKeyboard(
  page: Page,
  link: Locator,
  browserName: string,
): Promise<void> {
  if (browserName !== "webkit") {
    await tabUntilFocused(page, link);
    return;
  }
  await page.keyboard.press("Shift");
  await link.focus();
}

type FocusStyle = { focusVisible: boolean; hasOutline: boolean; hasBoxShadow: boolean };

async function focusStyle(locator: Locator): Promise<FocusStyle> {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    return {
      focusVisible: element.matches(":focus-visible"),
      hasOutline: style.outlineStyle !== "none" && outlineWidth > 0,
      hasBoxShadow: style.boxShadow !== "none" && style.boxShadow !== "",
    };
  });
}

function isVisibleFocus(style: FocusStyle): boolean {
  return style.focusVisible && (style.hasOutline || style.hasBoxShadow);
}

test("keyboard_TabThroughTabBar_TabsAreReachedInOrder", async ({ page, browserName }) => {
  test.skip(
    browserName === "webkit",
    "Playwrights WebKit tabber ikke til links (Safari-standard).",
  );

  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });

  // Act
  await tabUntilFocused(page, tabLink(page, "Hjem"));
  await page.keyboard.press("Tab");
  const aiFocused = await isFocused(tabLink(page, "AI"));
  await page.keyboard.press("Tab");
  const meFocused = await isFocused(tabLink(page, "Mig"));

  // Assert
  expect(aiFocused).toBe(true);
  expect(meFocused).toBe(true);
});

for (const tabName of ["Hjem", "AI", "Mig"]) {
  test(`keyboard_Tab${tabName}Focused_FocusIsVisible`, async ({ page, browserName }) => {
    // Arrange
    await openRoute(page, { path: "/", pageTitle: "Hjem" });
    const link = tabLink(page, tabName);

    // Act
    await focusTabLinkWithKeyboard(page, link, browserName);
    const style = await focusStyle(link);

    // Assert
    expect(isVisibleFocus(style), `Synligt fokus på ${tabName}`).toBe(true);
  });
}

test("keyboard_EnterOnMigTab_NavigatesToMig", async ({ page, browserName }) => {
  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  await focusTabLinkWithKeyboard(page, tabLink(page, "Mig"), browserName);

  // Act
  await page.keyboard.press("Enter");

  // Assert
  await expect(page).toHaveURL(/\/mig$/);
  await expect(page).toHaveTitle(documentTitle("Mig"));
  await expect(tabLink(page, "Mig")).toHaveAttribute("aria-current", "page");
});

test("keyboard_ShiftTabFromMigToAi_EnterNavigatesToAi", async ({ page, browserName }) => {
  test.skip(
    browserName === "webkit",
    "Playwrights WebKit tabber ikke til links (Safari-standard).",
  );

  // Arrange
  await openRoute(page, { path: "/mig", pageTitle: "Mig" });
  await tabUntilFocused(page, tabLink(page, "Mig"));

  // Act
  await page.keyboard.press("Shift+Tab");
  const aiFocus = await focusStyle(tabLink(page, "AI"));
  await page.keyboard.press("Enter");

  // Assert
  expect(isVisibleFocus(aiFocus), "Synligt fokus på AI").toBe(true);
  await expect(page).toHaveURL(/\/ai$/);
  await expect(page).toHaveTitle(documentTitle("AI"));
});

test("keyboard_BellOpenedWithEnter_FocusInDialogAndEscapeCloses", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  const bell = page.getByRole("button", { name: /^Notifikationer/ });
  await tabUntilFocused(page, bell);
  const bellFocus = await focusStyle(bell);

  // Act
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Ikke implementeret" });
  await expect(dialog).toBeVisible();
  const focusInDialog = await dialog.evaluate((element) =>
    element.contains(document.activeElement),
  );
  await page.keyboard.press("Escape");

  // Assert
  expect(isVisibleFocus(bellFocus), "Synligt fokus på klokken").toBe(true);
  expect(focusInDialog).toBe(true);
  await expect(dialog).toBeHidden();
});

test("keyboard_DialogClosedWithOk_FocusReturnsToBell", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  const bell = page.getByRole("button", { name: /^Notifikationer/ });
  await tabUntilFocused(page, bell);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Ikke implementeret" });
  await expect(dialog).toBeVisible();

  // Act
  await tabUntilFocused(page, dialog.getByRole("button", { name: "OK" }));
  await page.keyboard.press("Enter");

  // Assert
  await expect(dialog).toBeHidden();
  await expect(bell).toBeFocused();
});

test("keyboard_DialogClosedWithEscape_FocusReturnsToBell", async ({ page }) => {
  // Arrange
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  const bell = page.getByRole("button", { name: /^Notifikationer/ });
  await tabUntilFocused(page, bell);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Ikke implementeret" });
  await expect(dialog).toBeVisible();

  // Act
  await page.keyboard.press("Escape");

  // Assert
  await expect(dialog).toBeHidden();
  await expect(bell).toBeFocused();
});
