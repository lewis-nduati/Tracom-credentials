"use client";

import React from "react";
import {
  AndamioRecordHeader,
  AndamioRecordLayout,
  AndamioRecordSection,
  AndamioNextStep,
  AndamioPathTimeline,
} from "~/components/andamio";
import { MintAccessToken } from "~/components/tx";
import { truncateWalletAddress } from "~/config";

/**
 * Dashboard for a signed-in wallet with no access token yet. Replaces
 * GettingStarted + MintAccessToken with the same steps and the same form.
 */
export function Admission({
  walletAddress,
  onMinted,
}: {
  walletAddress: string | null | undefined;
  onMinted: () => void;
}) {
  return (
    <>
      <AndamioRecordHeader
        label="Admission"
        title="Welcome to Tracom"
        meta={walletAddress ? `Wallet ${truncateWalletAddress(walletAddress)}` : undefined}
      />
      <AndamioRecordLayout
        main={
          <AndamioNextStep
            title="Choose your alias"
            detail="Your alias is your name on every credential you earn."
          >
            <MintAccessToken onSuccess={onMinted} />
          </AndamioNextStep>
        }
        margin={
          <AndamioRecordSection label="Path">
            <AndamioPathTimeline
              label="Getting started"
              milestones={[
                { id: "connect", label: "Connect wallet", done: true },
                { id: "alias", label: "Choose your alias", done: false },
                { id: "explore", label: "Explore courses", done: false, href: "/course" },
              ]}
            />
          </AndamioRecordSection>
        }
      />
    </>
  );
}
