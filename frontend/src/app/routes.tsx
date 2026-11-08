import type { RouteObject } from "react-router";
import { routePaths } from "@/shared/routePaths";
import { da } from "@/texts/da";
import { AppShell } from "./AppShell";
import { RouteErrorScreen } from "./RouteErrorScreen";
import { routeHandle } from "./routeInfo";
import { AiScreen } from "./screens/AiScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MeScreen } from "./screens/MeScreen";
import { PayScreen } from "./screens/PayScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { ShiftsScreen } from "./screens/ShiftsScreen";

// Rutetabellen. Eksporteres, så tests kan bruge den med createMemoryRouter.
// Hver rute har et handle med sin routeKey (se routeInfo.ts).

export const appRoutes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteErrorScreen />,
    children: [
      {
        path: routePaths.home,
        handle: routeHandle("home"),
        element: <HomeScreen />,
      },
      {
        path: routePaths.shifts,
        handle: routeHandle("shifts"),
        element: <ShiftsScreen />,
      },
      {
        path: routePaths.pay,
        handle: routeHandle("pay"),
        element: <PayScreen />,
      },
      {
        path: routePaths.ai,
        handle: routeHandle("ai"),
        element: <AiScreen />,
      },
      {
        path: routePaths.me,
        handle: routeHandle("me"),
        element: <MeScreen />,
      },
      {
        path: "*",
        handle: routeHandle("notFound"),
        element: <PlaceholderScreen title={da.pages.notFound.title} isPageHeading={false} />,
      },
    ],
  },
];
