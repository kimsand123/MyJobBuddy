import { House, Sparkles, User, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { routePaths } from "@/shared/routePaths";
import { da } from "@/texts/da";

// Fanebjælken i bunden: Hjem, AI (hævet i midten) og Mig. Fanerne er links, styret af routeren.
// Aktiv fane har farve og understreget label, så den ikke kun vises med farve.
// aria-current="page" på fanens egen side og aria-current="true" på dens undersider (fx Vagter
// under Hjem). Er ingen fane aktiv (fx en side, der ikke findes), har ingen aria-current.
// padding-bottom: env(safe-area-inset-bottom), så bjælken ligger over hjemmeindikatoren.

export type TabId = "home" | "ai" | "me";

export type BottomTabBarProps = {
  /** undefined = ingen fane er aktiv. */
  active: TabId | undefined;
  /** false = brugeren er på en underside af den aktive fane. Standard true. */
  activeIsCurrentPage?: boolean;
};

type Tab = {
  id: TabId;
  label: string;
  icon: LucideIcon;
  path: string;
};

type AriaCurrent = "page" | "true" | undefined;

const tabs: readonly Tab[] = [
  { id: "home", label: da.navigation.tabs.home, icon: House, path: routePaths.home },
  { id: "ai", label: da.navigation.tabs.ai, icon: Sparkles, path: routePaths.ai },
  { id: "me", label: da.navigation.tabs.me, icon: User, path: routePaths.me },
];

function ariaCurrentFor(isActive: boolean, activeIsCurrentPage: boolean): AriaCurrent {
  if (!isActive) {
    return undefined;
  }
  return activeIsCurrentPage ? "page" : "true";
}

export function BottomTabBar({
  active,
  activeIsCurrentPage = true,
}: BottomTabBarProps): ReactElement {
  return (
    <nav
      aria-label={da.navigation.mainMenu}
      className="sticky bottom-0 z-10 bg-card pb-[env(safe-area-inset-bottom)] shadow-bar"
    >
      <ul className="mx-auto grid h-tabbar max-w-content grid-cols-3 items-end px-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <TabLink
                tab={tab}
                isActive={isActive}
                ariaCurrent={ariaCurrentFor(isActive, activeIsCurrentPage)}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type TabLinkProps = {
  tab: Tab;
  isActive: boolean;
  ariaCurrent: AriaCurrent;
};

function TabLink({ tab, isActive, ariaCurrent }: TabLinkProps): ReactElement {
  const Icon = tab.icon;
  const isAi = tab.id === "ai";
  return (
    <Link
      to={tab.path}
      aria-current={ariaCurrent}
      className={cn(
        "flex h-tabbar w-full flex-col items-center justify-center gap-0.5 rounded-md text-caption",
        isAi && "text-foreground",
        !isAi && (isActive ? "text-primary" : "text-muted-foreground"),
      )}
    >
      {isAi ? (
        <span
          className={cn(
            "-mt-6 inline-flex size-14 items-center justify-center rounded-full border-4 border-card text-primary-foreground shadow-raised",
            isActive ? "bg-navy" : "bg-primary",
          )}
        >
          <Icon size={26} aria-hidden="true" />
        </span>
      ) : (
        <Icon size={26} aria-hidden="true" />
      )}
      <span className={cn(isActive && "underline decoration-2 underline-offset-4")}>
        {tab.label}
      </span>
    </Link>
  );
}
