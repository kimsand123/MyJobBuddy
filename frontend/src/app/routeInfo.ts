import type { TabId } from "@/components/BottomTabBar";
import { da } from "@/texts/da";

// Data pr. rute: dokumenttitel, hvad AppHeader viser, og hvilken fane der er aktiv.
// Hver rute får { routeKey } i sin `handle`, og AppShell læser den med useMatches(). Så følger
// opslaget routerens egen matchning (fx /Vagter og /vagter/), i stedet for at sammenligne stier.

export type RouteKey = "home" | "shifts" | "pay" | "ai" | "me" | "notFound";

export type AppRouteHandle = {
  routeKey: RouteKey;
};

export type ActiveTab = {
  id: TabId;
  /** true = fanens egen side (aria-current="page"). false = en underside af fanen (aria-current="true"). */
  isCurrentPage: boolean;
};

export type RouteInfo = {
  /** Sidens navn i dokumenttitlen. */
  pageTitle: string;
  /** undefined = AppHeader viser logoet (kun Hjem). */
  headerTitle: string | undefined;
  showBack: boolean;
  showNotifications: boolean;
  /** undefined = ingen fane er aktiv (fx en side, der ikke findes). */
  activeTab: ActiveTab | undefined;
};

const routeInfos: Readonly<Record<RouteKey, RouteInfo>> = {
  home: {
    pageTitle: da.pages.home.title,
    headerTitle: undefined,
    showBack: false,
    showNotifications: true,
    activeTab: { id: "home", isCurrentPage: true },
  },
  // Vagter og Løn er undersider af Hjem med tilbage-knap.
  shifts: {
    pageTitle: da.pages.shifts.title,
    headerTitle: da.pages.shifts.title,
    showBack: true,
    showNotifications: false,
    activeTab: { id: "home", isCurrentPage: false },
  },
  pay: {
    pageTitle: da.pages.pay.title,
    headerTitle: da.pages.pay.title,
    showBack: true,
    showNotifications: false,
    activeTab: { id: "home", isCurrentPage: false },
  },
  ai: {
    pageTitle: da.pages.ai.title,
    headerTitle: da.pages.ai.title,
    showBack: false,
    showNotifications: false,
    activeTab: { id: "ai", isCurrentPage: true },
  },
  me: {
    pageTitle: da.pages.me.title,
    headerTitle: da.pages.me.title,
    showBack: false,
    showNotifications: false,
    activeTab: { id: "me", isCurrentPage: true },
  },
  notFound: {
    pageTitle: da.pages.notFound.title,
    headerTitle: da.pages.notFound.title,
    showBack: true,
    showNotifications: false,
    activeTab: undefined,
  },
};

export function routeHandle(routeKey: RouteKey): AppRouteHandle {
  return { routeKey };
}

export function routeInfoFor(routeKey: RouteKey): RouteInfo {
  return routeInfos[routeKey];
}

function isRouteKey(value: unknown): value is RouteKey {
  return typeof value === "string" && Object.hasOwn(routeInfos, value);
}

function isAppRouteHandle(value: unknown): value is AppRouteHandle {
  if (typeof value !== "object" || value === null || !("routeKey" in value)) {
    return false;
  }
  return isRouteKey(value.routeKey);
}

/** Den inderste rute med et gyldigt handle. Uden et sådant vises "Siden findes ikke". */
export function findRouteKey(handles: readonly unknown[]): RouteKey {
  const routeHandles = handles.filter(isAppRouteHandle);
  const innermost = routeHandles.at(-1);
  if (innermost === undefined) {
    return "notFound";
  }
  return innermost.routeKey;
}
