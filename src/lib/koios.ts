/**
 * Koios endpoints and server-side lookups.
 *
 * The browser talks to Koios through `/api/koios/[...path]` to avoid CORS.
 * Server components skip the proxy and call Koios directly — that is what
 * `fetchAssetInfo` does, so public verification resolves before first paint
 * and works with JavaScript disabled.
 */

import { env } from "~/env";

export const KOIOS_URLS = {
  mainnet: "https://api.koios.rest/api/v1",
  preprod: "https://preprod.koios.rest/api/v1",
  preview: "https://preview.koios.rest/api/v1",
} as const;

export function koiosBaseUrl(): string {
  return KOIOS_URLS[env.NEXT_PUBLIC_CARDANO_NETWORK];
}

/**
 * The subset of Koios `asset_info` this app reads.
 *
 * Every field is optional because it comes from an external API we do not
 * version-pin. Callers must treat a missing field as unknown, never as false.
 */
export interface AssetInfo {
  policyId: string;
  assetNameHex: string;
  /** Koios' own ASCII decoding of the asset name, when it is text. */
  assetNameAscii?: string;
  /** CIP-14 asset fingerprint, e.g. `asset1…`. */
  fingerprint?: string;
  /** Transaction that minted the asset. */
  mintingTxHash?: string;
  /** Unix seconds. Koios reports this as the asset's creation time. */
  creationTime?: number;
  /** Supply as a decimal string. "1" for a credential NFT. */
  totalSupply?: string;
  /** On-chain mint metadata, shape set by whoever minted it. */
  mintingTxMetadata?: unknown;
}

/** Narrow an unknown value to a string, treating empty as absent. */
function str(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Look up one asset on chain.
 *
 * Returns null when the asset does not exist, when Koios is unreachable, and
 * when the response does not have the shape we expect. The caller cannot tell
 * those apart, which is deliberate: the page says "we could not confirm this"
 * in every case rather than implying a forged credential when the real problem
 * is a timeout.
 */
export async function fetchAssetInfo(
  policyId: string,
  assetNameHex: string,
  options?: { signal?: AbortSignal },
): Promise<AssetInfo | null> {
  let payload: unknown;

  try {
    const response = await fetch(`${koiosBaseUrl()}/asset_info`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _asset_list: [[policyId, assetNameHex]] }),
      signal: options?.signal,
      // On-chain assets are immutable once minted, so this is safe to cache.
      // The window is short so a freshly claimed credential verifies quickly.
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("[koios] asset_info responded", response.status);
      return null;
    }

    payload = await response.json();
  } catch (error) {
    console.error("[koios] asset_info failed", error);
    return null;
  }

  if (!Array.isArray(payload) || payload.length === 0) return null;

  const row = payload[0] as Record<string, unknown>;
  const resolvedPolicy = str(row.policy_id);
  const resolvedAsset = str(row.asset_name);

  // Koios echoes the asset it resolved. If it does not match what we asked
  // for, something is wrong upstream and we must not present it as a match.
  if (resolvedPolicy !== policyId || resolvedAsset !== assetNameHex) {
    return null;
  }

  return {
    policyId: resolvedPolicy,
    assetNameHex: resolvedAsset,
    assetNameAscii: str(row.asset_name_ascii),
    fingerprint: str(row.fingerprint),
    mintingTxHash: str(row.minting_tx_hash),
    creationTime: num(row.creation_time),
    totalSupply: str(row.total_supply) ?? num(row.total_supply)?.toString(),
    mintingTxMetadata: row.minting_tx_metadata,
  };
}

/** Cardanoscan link for a transaction, on the network this app is pointed at. */
export function explorerTxUrl(txHash: string): string {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;
  const host =
    network === "mainnet" ? "cardanoscan.io" : `${network}.cardanoscan.io`;
  return `https://${host}/transaction/${txHash}`;
}
