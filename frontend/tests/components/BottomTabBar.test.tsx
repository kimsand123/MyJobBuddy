// Fanebjælken Hjem · AI · Mig. aria-current="page" på fanens egen side, "true" på en underside af
// fanen og ingen markering, når ingen fane er aktiv.
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { BottomTabBar, type BottomTabBarProps, type TabId } from "@/components/BottomTabBar";

afterEach(() => {
  cleanup();
});

const tabNames: Record<TabId, string> = { home: "Hjem", ai: "AI", me: "Mig" };

// Routeren står på en neutral sti, så det kun er props, der bestemmer markeringen.
function renderTabBar(props: BottomTabBarProps): void {
  render(
    <MemoryRouter initialEntries={["/neutral-test-sti"]}>
      <BottomTabBar {...props} />
    </MemoryRouter>,
  );
}

function tab(name: string): HTMLElement {
  const navigation = screen.getByRole("navigation", { name: "Hovedmenu" });
  return within(navigation).getByRole("link", { name });
}

describe("BottomTabBar", () => {
  it("BottomTabBar_Rendered_NavigationNamedHovedmenuWithThreeLinks", () => {
    // Act
    renderTabBar({ active: "home" });

    // Assert
    const navigation = screen.getByRole("navigation", { name: "Hovedmenu" });
    const names = within(navigation)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());
    expect(names).toEqual(["Hjem", "AI", "Mig"]);
  });

  it.each([
    ["Hjem", "/"],
    ["AI", "/ai"],
    ["Mig", "/mig"],
  ])("BottomTabBar_Link%s_PointsTo%s", (name, href) => {
    // Act
    renderTabBar({ active: "home" });

    // Assert
    expect(tab(name)).toHaveAttribute("href", href);
  });

  it.each<TabId>(["home", "ai", "me"])(
    "BottomTabBar_Active%sOnOwnPage_AriaCurrentPageOnlyOnThatTab",
    (active) => {
      // Act
      renderTabBar({ active });

      // Assert
      for (const [id, name] of Object.entries(tabNames)) {
        if (id === active) {
          expect(tab(name)).toHaveAttribute("aria-current", "page");
        } else {
          expect(tab(name)).not.toHaveAttribute("aria-current");
        }
      }
    },
  );

  it("BottomTabBar_ActiveIsCurrentPageDefault_AriaCurrentPage", () => {
    // Act
    renderTabBar({ active: "ai" });

    // Assert
    expect(tab("AI")).toHaveAttribute("aria-current", "page");
  });

  it.each<TabId>(["home", "ai", "me"])(
    "BottomTabBar_Active%sOnSubPage_AriaCurrentTrue",
    (active) => {
      // Act
      renderTabBar({ active, activeIsCurrentPage: false });

      // Assert
      expect(tab(tabNames[active])).toHaveAttribute("aria-current", "true");
    },
  );

  it("BottomTabBar_NoActiveTab_NoAriaCurrent", () => {
    // Act
    renderTabBar({ active: undefined });

    // Assert
    for (const name of Object.values(tabNames)) {
      expect(tab(name)).not.toHaveAttribute("aria-current");
    }
  });
});
