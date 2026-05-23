import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // V2 Gateway API caching defaults
        // 5 min staleTime - data considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // 30 min gcTime - keep in cache for 30 minutes after last use
        gcTime: 1000 * 60 * 30,
        // Don't refetch on window focus - rely on explicit invalidation
        refetchOnWindowFocus: false,
        // Single retry on failure
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
