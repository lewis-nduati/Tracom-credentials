"use client";

import React from "react";
import Image from "next/image";
import { useWallet, useWalletList } from "@meshsdk/react";
import type { EnableWeb3WalletOptions } from "@utxos/sdk";
import { WalletIcon } from "~/components/icons";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { WEB3_SERVICES_CONFIG } from "~/config/wallet";
import { SignInOptions } from "~/components/auth/sign-in-options";

/* -------------------------------------------------------------------------- */
/*  Mesh SDK logo (attribution)                                               */
/* -------------------------------------------------------------------------- */

function MeshLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      fill="currentColor"
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m289 127-45-60-45-60c-.9-1.3-2.4-2-4-2s-3.1.7-4 2l-37 49.3c-2 2.7-6 2.7-8 0l-37-49.3c-.9-1.3-2.4-2-4-2s-3.1.7-4 2l-45 60-45 60c-1.3 1.8-1.3 4.2 0 6l45 60c.9 1.3 2.4 2 4 2s3.1-.7 4-2l37-49.3c2-2.7 6-2.7 8 0l37 49.3c.9 1.3 2.4 2 4 2s3.1-.7 4-2l37-49.3c2-2.7 6-2.7 8 0l37 49.3c.9 1.3 2.4 2 4 2s3.1-.7 4-2l45-60c1.3-1.8 1.3-4.2 0-6zm-90-103.3 32.5 43.3c1.3 1.8 1.3 4.2 0 6l-32.5 43.3c-2 2.7-6 2.7-8 0l-32.5-43.3c-1.3-1.8-1.3-4.2 0-6l32.5-43.3c2-2.7 6-2.7 8 0zm-90 0 32.5 43.3c1.3 1.8 1.3 4.2 0 6l-32.5 43.3c-2 2.7-6 2.7-8 0l-32.5-43.3c-1.3-1.8-1.3-4.2 0-6l32.5-43.3c2-2.7 6-2.7 8 0zm-53 152.6-32.5-43.3c-1.3-1.8-1.3-4.2 0-6l32.5-43.3c2-2.7 6-2.7 8 0l32.5 43.3c1.3 1.8 1.3 4.2 0 6l-32.5 43.3c-2 2.7-6 2.7-8 0zm90 0-32.5-43.3c-1.3-1.8-1.3-4.2 0-6l32.5-43.3c2-2.7 6-2.7 8 0l32.5 43.3c1.3 1.8 1.3 4.2 0 6l-32.5 43.3c-2 2.7-6 2.7-8 0zm90 0-32.5-43.3c-1.3-1.8-1.3-4.2 0-6l32.5-43.3c2-2.7 6-2.7 8 0l32.5 43.3c1.3 1.8 1.3 4.2 0 6l-32.5 43.3c-2 2.7-6 2.7-8 0z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Connected dropdown                                                        */
/* -------------------------------------------------------------------------- */

function ConnectedDropdown() {
  const { address, name, disconnect } = useWallet();
  const wallets = useWalletList();
  const connectedWallet = wallets.find((w) => w.id === name);
  const isWeb3 = name === "Mesh Web3 Services";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {connectedWallet?.icon ? (
            <Image
              src={connectedWallet.icon}
              alt={connectedWallet.name}
              width={20}
              height={20}
              className="rounded-sm"
            />
          ) : (
            <WalletIcon className="h-4 w-4" />
          )}
          <span>
            {address.slice(0, 6)}...{address.slice(-6)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => void navigator.clipboard.writeText(address)}
        >
          Copy Address
        </DropdownMenuItem>
        {isWeb3 && (
          <DropdownMenuItem
            onClick={() => window.open("https://utxos.dev/dashboard", "_blank")}
          >
            Open Web3 Wallet
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                               */
/* -------------------------------------------------------------------------- */

interface ConnectWalletButtonProps {
  className?: string;
  label?: string;
  onConnected?: () => void;
  persist?: boolean;
  web3Services?: EnableWeb3WalletOptions;
}

/**
 * Trigger button that opens a sign-in dialog.
 *
 * Shows the connected wallet dropdown when already connected.
 * The dialog renders SignInOptions — social login first, browser wallets second.
 */
export function ConnectWalletButton({
  className,
  label = "Connect Wallet",
  onConnected,
  persist = true,
  web3Services = WEB3_SERVICES_CONFIG,
}: ConnectWalletButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { connected } = useWallet();

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (connected) onConnected?.();
  }, [connected, onConnected]);

  if (connected) return <ConnectedDropdown />;

  if (!mounted) {
    return (
      <Button variant="outline" className={className}>
        {label}
      </Button>
    );
  }

  const hasSocial = !!web3Services;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Sign in to Tracom Credentials</DialogTitle>
          <DialogDescription>
            {hasSocial
              ? "No wallet or crypto experience needed"
              : "Select a Cardano wallet to connect"}
          </DialogDescription>
        </DialogHeader>

        <SignInOptions
          onConnected={() => setOpen(false)}
          persist={persist}
          web3Services={web3Services}
        />

        <DialogFooter className="justify-center sm:justify-center">
          <a
            href="https://meshjs.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Powered by</span>
            <MeshLogo className="h-4 w-4" />
            <span className="font-medium">Mesh SDK</span>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
