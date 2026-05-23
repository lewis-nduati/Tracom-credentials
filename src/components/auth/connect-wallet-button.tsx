"use client";

import React from "react";
import Image from "next/image";
import { useWallet, useWalletList } from "@meshsdk/react";
import type { Wallet } from "@meshsdk/common";
import { Web3Wallet } from "@utxos/sdk";
import type { EnableWeb3WalletOptions } from "@utxos/sdk";
import { WalletIcon, LoadingIcon } from "~/components/icons";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { env } from "~/env";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { WEB3_SERVICES_CONFIG } from "~/config/wallet";

/* -------------------------------------------------------------------------- */
/*  Mesh SDK logo SVG (kept for "Powered by" attribution)                     */
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
/*  Social provider SVG icons (from Mesh SDK source)                          */
/* -------------------------------------------------------------------------- */

function IconGoogle() {
  return (
    <svg viewBox="0 0 262 262" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
    </svg>
  );
}

function IconDiscord() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-6 w-6">
      <path
        d="M16.238 4.515a14.842 14.842 0 0 0-3.664-1.136.055.055 0 0 0-.059.027 10.35 10.35 0 0 0-.456.938 13.702 13.702 0 0 0-4.115 0 9.479 9.479 0 0 0-.464-.938.058.058 0 0 0-.058-.027c-1.266.218-2.497.6-3.664 1.136a.052.052 0 0 0-.024.02C1.4 8.023.76 11.424 1.074 14.782a.062.062 0 0 0 .024.042 14.923 14.923 0 0 0 4.494 2.272.058.058 0 0 0 .064-.02c.346-.473.654-.972.92-1.496a.057.057 0 0 0-.032-.08 9.83 9.83 0 0 1-1.404-.669.058.058 0 0 1-.029-.046.058.058 0 0 1 .023-.05c.094-.07.189-.144.279-.218a.056.056 0 0 1 .058-.008c2.946 1.345 6.135 1.345 9.046 0a.056.056 0 0 1 .059.007c.09.074.184.149.28.22a.058.058 0 0 1 .023.049.059.059 0 0 1-.028.046 9.224 9.224 0 0 1-1.405.669.058.058 0 0 0-.033.033.056.056 0 0 0 .002.047c.27.523.58 1.022.92 1.495a.056.056 0 0 0 .062.021 14.878 14.878 0 0 0 4.502-2.272.055.055 0 0 0 .016-.018.056.056 0 0 0 .008-.023c.375-3.883-.63-7.256-2.662-10.246a.046.046 0 0 0-.023-.021Zm-9.223 8.221c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.717 1.814-1.618 1.814Zm5.981 0c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.71 1.814-1.618 1.814Z"
        fill="#5865F2"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M14.095479,10.316482L22.286354,1h-1.940718l-7.115352,8.087682L7.551414,1H1l8.589488,12.231093L1,23h1.940717  l7.509372-8.542861L16.448587,23H23L14.095479,10.316482z M11.436522,13.338465l-0.871624-1.218704l-6.924311-9.68815h2.981339  l5.58978,7.82155l0.867949,1.218704l7.26506,10.166271h-2.981339L11.436522,13.338465z" />
    </svg>
  );
}

/** Social provider definition used to render icon buttons */
interface SocialProvider {
  id: "google" | "discord" | "twitter";
  name: string;
  icon: React.ReactNode;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: "google", name: "Google", icon: <IconGoogle /> },
  { id: "discord", name: "Discord", icon: <IconDiscord /> },
  { id: "twitter", name: "X", icon: <IconX /> },
];

/* -------------------------------------------------------------------------- */
/*  Single wallet icon button (matches Mesh's grid-of-icons layout)           */
/* -------------------------------------------------------------------------- */

function WalletIconButton({
  wallet,
  onClick,
  loading = false,
}: {
  wallet: Wallet;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center rounded-lg w-12 h-12",
            "border border-border bg-muted/50",
            "hover:bg-accent hover:border-foreground/20",
            "transition-colors cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && "border-primary/50 bg-primary/5"
          )}
          onClick={onClick}
          disabled={loading}
          aria-label={`Connect ${wallet.name} wallet`}
        >
          {loading ? (
            <LoadingIcon className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Image
              src={wallet.icon}
              alt={wallet.name}
              width={28}
              height={28}
              className="rounded-sm"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{wallet.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/*  Social login icon button                                                   */
/* -------------------------------------------------------------------------- */

function SocialIconButton({
  provider,
  onClick,
  loading = false,
}: {
  provider: SocialProvider;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center rounded-lg w-12 h-12",
            "border border-border bg-muted/50",
            "hover:bg-accent hover:border-foreground/20",
            "transition-colors cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && "border-primary/50 bg-primary/5"
          )}
          onClick={onClick}
          disabled={loading}
          aria-label={`Sign in with ${provider.name}`}
        >
          {loading ? (
            <LoadingIcon className="h-5 w-5 animate-spin text-primary" />
          ) : (
            provider.icon
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{provider.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/*  Connected button with dropdown (copy address, disconnect)                 */
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
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

interface ConnectWalletButtonProps {
  className?: string;
  label?: string;
  onConnected?: () => void;
  persist?: boolean;
  /** Pass `undefined` to hide social login icons. Defaults to WEB3_SERVICES_CONFIG. */
  web3Services?: EnableWeb3WalletOptions;
}

/**
 * Drop-in replacement for Mesh's CardanoWallet.
 *
 * Uses Mesh's useWallet + useWalletList hooks with our own design system.
 * Matches the original component structure: icon grid, tooltip names,
 * connected dropdown with copy address & disconnect.
 *
 * Web3 services (Google, Discord, X) are shown by default using the
 * project's WEB3_SERVICES_CONFIG. Pass `web3Services={undefined}` to hide.
 */
export function ConnectWalletButton({
  className,
  label = "Connect Wallet",
  onConnected,
  persist = true,
  web3Services = WEB3_SERVICES_CONFIG,
}: ConnectWalletButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [socialLoading, setSocialLoading] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const wallets = useWalletList();
  const { connect, connected, setWallet, setWeb3UserData, setPersist } = useWallet();

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => { setPersist(persist); }, [persist, setPersist]);
  React.useEffect(() => {
    if (connected) onConnected?.();
  }, [connected, onConnected]);

  // Prefetch @meshsdk/core chunk when dialog opens so it's cached before social login click
  React.useEffect(() => {
    if (open && web3Services && env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID) {
      void import("@meshsdk/core");
    }
  }, [open, web3Services]);

  const handleConnect = React.useCallback(
    async (walletId: string) => {
      setConnectingId(walletId);
      try {
        await connect(walletId, persist);
        setOpen(false);
      } catch {
        // User cancelled or wallet errored — stay on dialog
      } finally {
        setConnectingId(null);
      }
    },
    [connect, persist]
  );

  const handleSocialConnect = React.useCallback(
    async (directTo: "google" | "discord" | "twitter") => {
      if (!web3Services) return;
      setSocialLoading(directTo);
      try {
        // Create BlockfrostProvider lazily to avoid @meshsdk/core module-scope
        // import which triggers libsodium WASM initialization during SSR (#453)
        const enableOpts: EnableWeb3WalletOptions = {
          networkId: web3Services.networkId ?? 0,
          projectId: web3Services.projectId,
          directTo,
        };
        if (env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID) {
          const { BlockfrostProvider } = await import("@meshsdk/core");
          const provider = new BlockfrostProvider(env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID);
          enableOpts.fetcher = provider;
          enableOpts.submitter = provider;
        }

        const web3Wallet = await Web3Wallet.enable(enableOpts);
        const user = web3Wallet.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @utxos/sdk UserSocialData uses camelCase avatarUrl, @meshsdk/react expects snake_case avatar_url
        setWeb3UserData(user as any);

        setWallet(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @utxos/sdk Web3Wallet#cardano shape differs from @meshsdk/react setWallet expected wallet type
          web3Wallet.cardano as any,
          "Mesh Web3 Services",
          persist
            ? { walletAddress: await getWalletAddressBech32(web3Wallet.cardano), user }
            : undefined
        );
        setOpen(false);
      } catch {
        // User cancelled social login or popup blocked — stay on dialog
      } finally {
        setSocialLoading(null);
      }
    },
    [web3Services, persist, setWallet, setWeb3UserData]
  );

  if (connected) {
    return <ConnectedDropdown />;
  }

  // Defer Dialog rendering until after hydration to prevent radix ID mismatch
  if (!mounted) {
    return (
      <Button variant="outline" className={className}>
        {label}
      </Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">Connect Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Select a Cardano wallet to connect
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          {wallets.length === 0 && !web3Services ? (
            <div className="py-8 text-center">
              <WalletIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">No wallets found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Install a Cardano wallet browser extension to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-5 place-items-center gap-4 gap-y-6 py-4">
              {wallets.map((wallet) => (
                <WalletIconButton
                  key={wallet.id}
                  wallet={wallet}
                  loading={connectingId === wallet.id}
                  onClick={() => void handleConnect(wallet.id)}
                />
              ))}
              {web3Services &&
                SOCIAL_PROVIDERS.map((provider) => (
                  <SocialIconButton
                    key={provider.id}
                    provider={provider}
                    loading={socialLoading === provider.id}
                    onClick={() => void handleSocialConnect(provider.id)}
                  />
                ))}
            </div>
          )}
        </TooltipProvider>

        {/* Mesh SDK attribution */}
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
