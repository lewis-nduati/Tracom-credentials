/**
 * Cardano Utilities
 *
 * This file contains Cardano-specific utilities (explorer URLs, network helpers).
 * These will eventually move to @andamio/core/constants/cardano.ts (Layer 1).
 *
 * UI constants have been moved to ~/config/ui-constants.ts (Layer 5).
 * @see ~/config for UI_TIMEOUTS, PAGINATION, FORM_LIMITS, etc.
 */

// Re-export from config for backwards compatibility (deprecated)
export {
  UI_TIMEOUTS,
  POLLING_INTERVALS,
  PAGINATION,
  FORM_LIMITS,
} from "~/config/ui-constants";

import { env } from "~/env";

/**
 * Cardano explorer URLs by network
 *
 * @todo Move to @andamio/core/constants/cardano.ts
 */
export const EXPLORER_URLS = {
  mainnet: "https://cardanoscan.io",
  preprod: "https://preprod.cardanoscan.io",
  preview: "https://preview.cardanoscan.io",
} as const;

export type CardanoNetwork = keyof typeof EXPLORER_URLS;

const DEFAULT_NETWORK: CardanoNetwork = env.NEXT_PUBLIC_CARDANO_NETWORK;

/**
 * Get the explorer base URL for the current network
 */
export function getExplorerBaseUrl(network: CardanoNetwork = DEFAULT_NETWORK): string {
  return EXPLORER_URLS[network];
}

/**
 * Get explorer URL for a transaction
 */
export function getTransactionExplorerUrl(txHash: string, network: CardanoNetwork = DEFAULT_NETWORK): string {
  return `${EXPLORER_URLS[network]}/transaction/${txHash}`;
}

/**
 * Get explorer URL for a token/asset
 */
export function getTokenExplorerUrl(policyId: string, network: CardanoNetwork = DEFAULT_NETWORK): string {
  return `${EXPLORER_URLS[network]}/token/${policyId}`;
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: string, network: CardanoNetwork = DEFAULT_NETWORK): string {
  return `${EXPLORER_URLS[network]}/address/${address}`;
}
