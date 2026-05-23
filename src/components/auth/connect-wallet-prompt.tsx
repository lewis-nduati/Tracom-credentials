"use client";

import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";

export function ConnectWalletPrompt({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ConnectWalletButton />
    </div>
  );
}
