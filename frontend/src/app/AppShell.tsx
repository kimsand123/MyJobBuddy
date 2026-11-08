import { Bell } from "lucide-react";
import { useEffect, useRef, type ReactElement } from "react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router";
import { AppHeader, type HeaderAction } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { WidgetErrorAnnouncer } from "@/components/WidgetErrorAnnouncer";
import { routePaths } from "@/shared/routePaths";
import { da } from "@/texts/da";
import { useNotImplemented } from "./notImplemented/useNotImplemented";
import { findRouteKey, routeInfoFor } from "./routeInfo";

// Skallen om alle skærme: AppHeader øverst, indhold (højst 480px, centreret og det eneste, der
// scroller) og fanebjælken nederst.
// Safe areas: header og fanebjælke håndterer top og bund; skallen håndterer venstre og højre.
// Header, dokumenttitel og aktiv fane kommer fra den matchede rutes handle (routeInfo.ts).

export function AppShell(): ReactElement {
  const location = useLocation();
  const matches = useMatches();
  const navigate = useNavigate();
  const showNotImplemented = useNotImplemented();
  const route = routeInfoFor(findRouteKey(matches.map((match) => match.handle)));
  const documentTitle = da.app.documentTitle(route.pageTitle);

  // Hver side har sin egen titel (WCAG 2.4.2). Titlen er en ekstern tilstand i browseren.
  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  // <main> scroller selv, så en ny side starter øverst i stedet for at arve scrollpositionen.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const main = mainRef.current;
    if (main === null) {
      return;
    }
    main.scrollTop = 0;
  }, [location.pathname]);

  const goHome = (): void => {
    void navigate(routePaths.home);
  };

  const notificationsAction: HeaderAction | undefined = route.showNotifications
    ? { icon: Bell, label: da.navigation.notifications, badge: true, onClick: showNotImplemented }
    : undefined;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <AppHeader
        title={route.headerTitle}
        onBack={route.showBack ? goHome : undefined}
        action={notificationsAction}
      />
      {/* Kun indholdet scroller. Header og fanebjælke ligger uden for, så indhold aldrig ligger
          under dem (trykflader dækkes ikke, WCAG 2.5.8). */}
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-content p-4">
          <WidgetErrorAnnouncer>
            <WidgetErrorBoundary key={location.pathname}>
              <Outlet />
            </WidgetErrorBoundary>
          </WidgetErrorAnnouncer>
        </div>
      </main>
      <BottomTabBar
        active={route.activeTab?.id}
        activeIsCurrentPage={route.activeTab?.isCurrentPage ?? false}
      />
    </div>
  );
}
