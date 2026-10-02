import type { Metadata } from "next";

import { SAMPLE_CERTIFIED_SKILLS } from "~/components/verify/certified-skills";
import { VerifiedResult } from "~/components/verify/verified-result";
import type { CredentialRef } from "~/lib/credential-verification";
import type { AssetInfo } from "~/lib/koios";

export const metadata: Metadata = {
  title: "Example verification result",
  description:
    "What an employer sees after checking a genuine Tracom credential. All details are made up.",
};

/**
 * Made-up values in the shape of a real ledger record. The hex is a visible
 * pattern on purpose, so nobody mistakes it for a real policy or transaction.
 */
const EXAMPLE_REF: CredentialRef = {
  policyId: "0123456789abcdef".repeat(3) + "01234567",
  assetNameHex: "e3a1".repeat(16),
};

const EXAMPLE_ASSET: AssetInfo = {
  policyId: EXAMPLE_REF.policyId,
  assetNameHex: EXAMPLE_REF.assetNameHex,
  fingerprint: "asset1exampleexampleexampleexample0000",
  mintingTxHash: "abcdef0123456789".repeat(4),
  // 14 August 2026, 09:30 UTC. Fixed so the page renders the same every time.
  creationTime: 1786699800,
  totalSupply: "1",
};

/**
 * A worked example of the verified result, so anyone who opens the
 * verification pages can see what a successful check shows without needing a
 * real credential to hand.
 */
export default function VerifyExamplePage() {
  return (
    <VerifiedResult
      credentialRef={EXAMPLE_REF}
      asset={EXAMPLE_ASSET}
      network="mainnet"
      skills={SAMPLE_CERTIFIED_SKILLS}
      skillsAreSample
      mode="example"
    />
  );
}
