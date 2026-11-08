import { QueryClient } from "@tanstack/react-query";

// Fejl fra API'et er beslutninger (fx forbidden) og skal ikke prøves igen automatisk.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
