import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    // API key for server-side requests to Andamio Gateway
    // This key is used for all proxied requests - usage is billed to the app developer
    ANDAMIO_API_KEY: z.string().min(1),
    // UTXOS/Web3 SDK — server-side only (developer-controlled wallets)
    WEB3_SDK_API_KEY: z.string().optional(),
    WEB3_SDK_PRIVATE_KEY: z.string().optional(),
    // UTXOS Sponsorship ID — for gasless access token migration
    UTXOS_SPONSORSHIP_ID: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Unified API Gateway - combines DB API, Andamioscan, and TX API
    NEXT_PUBLIC_ANDAMIO_GATEWAY_URL: z.string().url(),
    NEXT_PUBLIC_CARDANO_NETWORK: z.enum(["mainnet", "preprod", "preview"]).default("preprod"),
    NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID: z.string().length(56),
    // Blockfrost project ID for social wallet TX submission (Web3/UTXOS wallets).
    // Not needed for CIP-30 browser wallets (Nami, Eternl, etc.).
    // Get a free key at https://blockfrost.io/
    NEXT_PUBLIC_BLOCKFROST_PROJECT_ID: z.string().optional(),
    // UTXOS/Web3 SDK — client-side (wallet connect dialog)
    NEXT_PUBLIC_WEB3_SDK_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_WEB3_SDK_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    ANDAMIO_API_KEY: process.env.ANDAMIO_API_KEY,
    NEXT_PUBLIC_ANDAMIO_GATEWAY_URL: process.env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL,
    NEXT_PUBLIC_CARDANO_NETWORK: process.env.NEXT_PUBLIC_CARDANO_NETWORK,
    NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID: process.env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID,
    NEXT_PUBLIC_BLOCKFROST_PROJECT_ID: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID,
    NEXT_PUBLIC_WEB3_SDK_PROJECT_ID: process.env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID,
    NEXT_PUBLIC_WEB3_SDK_NETWORK: process.env.NEXT_PUBLIC_WEB3_SDK_NETWORK,
    WEB3_SDK_API_KEY: process.env.WEB3_SDK_API_KEY,
    WEB3_SDK_PRIVATE_KEY: process.env.WEB3_SDK_PRIVATE_KEY,
    UTXOS_SPONSORSHIP_ID: process.env.UTXOS_SPONSORSHIP_ID,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
