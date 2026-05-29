"use client";

import {
  defaultShouldDehydrateQuery,
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from "@tanstack/react-query";
import { useState } from "react";
import SuperJSON from "superjson";

// Caching defaults tuned for the V2 gateway API.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes before a background refetch.
        staleTime: 1000 * 60 * 5,
        // Keep cached data for 30 minutes after the last use.
        gcTime: 1000 * 60 * 30,
        // Rely on explicit invalidation instead of refetching on focus.
        refetchOnWindowFocus: false,
        retry: 1,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

let browserQueryClient: QueryClientType | undefined = undefined;

const getQueryClient = () => {
  // Server: always make a fresh client so requests don't share cache.
  if (typeof window === "undefined") return createQueryClient();
  // Browser: reuse a single client across renders.
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
