import type { EnableWeb3WalletOptions } from "@utxos/sdk";
import { env } from "~/env";

/**
 * Shared Web3 Services config for social wallet login (Google, Discord, X).
 *
 * Used as the default `web3Services` prop for ConnectWalletButton.
 * Project ID and network are configured via env vars (NEXT_PUBLIC_WEB3_SDK_*).
 *
 * Returns undefined when no project ID is configured (social login will be hidden).
 *
 * BlockfrostProvider (fetcher/submitter) is created lazily inside
 * handleSocialConnect to avoid SSR WASM init. See issue #453.
 */
export const WEB3_SERVICES_CONFIG: EnableWeb3WalletOptions | undefined =
  env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID
    ? {
        networkId: env.NEXT_PUBLIC_WEB3_SDK_NETWORK === "mainnet" ? 1 : 0,
        projectId: env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID,
      }
    : undefined;
