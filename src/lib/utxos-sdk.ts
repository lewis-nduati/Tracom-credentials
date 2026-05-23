import "server-only";
import { Web3Sdk } from "@utxos/sdk";
import { BlockfrostProvider } from "@meshsdk/core";
import { env } from "~/env";

/**
 * Server-side Web3Sdk singleton for transaction sponsorship.
 *
 * Returns null when required env vars are missing so the app
 * still works without sponsorship configured.
 */
let _sdk: Web3Sdk | null = null;

export function getWeb3Sdk(): Web3Sdk | null {
  if (_sdk) return _sdk;

  const apiKey = env.WEB3_SDK_API_KEY;
  const privateKey = env.WEB3_SDK_PRIVATE_KEY;
  const projectId = env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID;

  if (!apiKey || !privateKey || !projectId) return null;

  const network = env.NEXT_PUBLIC_WEB3_SDK_NETWORK;

  const blockfrostKey = env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  const fetcher = blockfrostKey
    ? new BlockfrostProvider(blockfrostKey)
    : undefined;
  const submitter = fetcher;

  _sdk = new Web3Sdk({
    projectId,
    apiKey,
    network,
    privateKey,
    fetcher,
    submitter,
  });

  return _sdk;
}
