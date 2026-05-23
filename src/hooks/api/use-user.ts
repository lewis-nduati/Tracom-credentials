/**
 * React Query hooks for User API endpoints
 *
 * Provides mutations for user-level operations like updating access token alias.
 *
 * @example
 * ```tsx
 * import { useUpdateAccessTokenAlias } from "~/hooks/api/use-user";
 *
 * function MintToken() {
 *   const updateAlias = useUpdateAccessTokenAlias();
 *
 *   const handleMint = async (alias: string) => {
 *     const result = await updateAlias.mutateAsync({ alias });
 *     // result.jwt contains the refreshed JWT
 *   };
 * }
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Types
// =============================================================================

/** Input for updating access token alias */
export interface UpdateAccessTokenAliasInput {
  alias: string;
}

/** Response from updating access token alias */
export interface UpdateAccessTokenAliasResponse {
  success: boolean;
  user: {
    id: string;
    cardanoBech32Addr: string | null;
    accessTokenAlias: string | null;
  };
  jwt: string;
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Update the user's access token alias in the database.
 *
 * Called optimistically after a successful Access Token Mint TX to update
 * the alias immediately rather than waiting for gateway confirmation.
 *
 * Returns the updated JWT which should be stored for subsequent auth requests.
 *
 * @example
 * ```tsx
 * const updateAlias = useUpdateAccessTokenAlias();
 *
 * // After TX success:
 * const result = await updateAlias.mutateAsync({ alias: "my_alias" });
 * storeJWT(result.jwt);
 * refreshAuth();
 * ```
 */
export function useUpdateAccessTokenAlias() {
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (
      input: UpdateAccessTokenAliasInput,
    ): Promise<UpdateAccessTokenAliasResponse | null> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/user/access-token-alias`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token_alias: input.alias }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[useUpdateAccessTokenAlias] Failed to update alias:",
          errorText,
        );
        // Don't throw — this is an optimistic update, gateway handles on confirmation
        return null;
      }

      const data =
        (await response.json()) as UpdateAccessTokenAliasResponse;
      console.log(
        "[useUpdateAccessTokenAlias] Access token alias updated optimistically",
      );
      return data;
    },
  });
}
