/**
 * Defensive wallet address helper for MeshSDK v2 compatibility.
 *
 * MeshSDK v2 `MeshCardanoBrowserWallet` provides `getChangeAddressBech32()`,
 * but the method may not exist if the wallet instance is from an older SDK
 * version, hasn't been fully initialized, or is a raw CIP-30 wallet.
 *
 * This helper tries the v2 method first, then falls back to `getChangeAddress()`
 * (hex) + manual bech32 conversion via `@meshsdk/core`.
 *
 * NOTE: `@meshsdk/core` is imported dynamically (not at module scope) to avoid
 * triggering libsodium WASM initialization during SSR. See issue #453.
 */

interface WalletLike {
  getChangeAddressBech32?: () => Promise<string>;
  getChangeAddress?: () => Promise<string>;
}

export async function getWalletAddressBech32(wallet: WalletLike): Promise<string> {
  // Happy path: v2 method exists — try/catch in case it's present but throws
  if (typeof wallet.getChangeAddressBech32 === "function") {
    try {
      return await wallet.getChangeAddressBech32();
    } catch {
      // Method exists but threw — fall through to getChangeAddress fallback
    }
  }

  // Fallback: v1 method returns hex or bech32 depending on wallet extension
  if (typeof wallet.getChangeAddress !== "function") {
    throw new Error("Wallet does not support getChangeAddress");
  }

  const rawAddress = await wallet.getChangeAddress();
  if (!rawAddress || typeof rawAddress !== "string" || rawAddress.length < 10) {
    throw new Error("Wallet returned invalid address");
  }
  if (rawAddress.startsWith("addr")) {
    return rawAddress; // Already bech32
  }

  // Hex → bech32 conversion via @meshsdk/core (dynamic import to avoid SSR WASM init)
  const { core } = await import("@meshsdk/core");
  const addressObj = core.Address.fromString(rawAddress);
  if (!addressObj) {
    throw new Error(`Failed to parse wallet address: ${rawAddress.slice(0, 20)}...`);
  }
  return addressObj.toBech32();
}
