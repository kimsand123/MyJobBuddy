// Klokken på Hjem aktiveres med et tryk (tap). Når dialogen lukkes med OK, skal fokus være på
// klokken. I Safari på iPhone får en knap ikke fokus ved tryk, så fokus kan kun komme tilbage,
// hvis klokken selv sendes med som udløser.
// Testen registrerer også, om browseren gav klokken fokus ved trykket. Gør emuleringen det, kan
// testen ikke skelne den rettede adfærd fra den gamle; det skrives som annotation og i output.
import { expect, test } from "@playwright/test";
import { openRoute } from "./support/appRoutes";

type FocusProbeWindow = Window & { bellHadFocusOnClick?: boolean };

test("tap_HomeBellTappedThenOk_FocusOnBell", async ({ page }, testInfo) => {
  // Arrange
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(page, { path: "/", pageTitle: "Hjem" });
  const bell = page.getByRole("button", { name: /^Notifikationer/ });
  await bell.evaluate((element) => {
    element.addEventListener(
      "click",
      () => {
        (window as FocusProbeWindow).bellHadFocusOnClick = document.activeElement === element;
      },
      { capture: true, once: true },
    );
  });

  // Act
  await bell.tap();
  const dialog = page.getByRole("dialog", { name: "Ikke implementeret" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "OK" }).tap();

  // Assert
  await expect(dialog).toBeHidden();
  await expect(bell).toBeFocused();

  const bellHadFocusOnClick = await page.evaluate(
    () => (window as FocusProbeWindow).bellHadFocusOnClick ?? false,
  );
  testInfo.annotations.push({
    type: "bell-focused-by-tap",
    description: String(bellHadFocusOnClick),
  });
  process.stdout.write(
    `[tap] ${testInfo.project.name}: klokken havde fokus ved trykket = ${String(bellHadFocusOnClick)}\n`,
  );
});
