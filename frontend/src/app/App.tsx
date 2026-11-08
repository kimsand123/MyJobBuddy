import { useState, type ReactElement } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { createMockApiClient } from "@/mockApi/createMockApiClient";
import { demoClock } from "@/shared/clock";
import { AppProviders } from "./AppProviders";
import { createQueryClient } from "./queryClient";
import { appRoutes } from "./routes";

// Demoen bruger mock-API'et. Når det rigtige API findes, skiftes createMockApiClient() ud her.

export function App(): ReactElement {
  const [queryClient] = useState(createQueryClient);
  const [apiClient] = useState(() => createMockApiClient());
  const [router] = useState(() => createBrowserRouter(appRoutes));

  return (
    <AppProviders queryClient={queryClient} apiClient={apiClient} clock={demoClock}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
