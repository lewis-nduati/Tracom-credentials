"use client";

import React from "react";
import Image from "next/image";
import { useWallet, useWalletList } from "@meshsdk/react";
import { Web3Wallet } from "@utxos/sdk";
import type { EnableWeb3WalletOptions } from "@utxos/sdk";
import type { Wallet } from "@meshsdk/common";
import { AddIcon, ExternalLinkIcon, LoadingIcon, WalletIcon } from "~/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { env } from "~/env";
import { WEB3_SERVICES_CONFIG } from "~/config/wallet";
import { getWalletAddressBech32 } from "~/lib/wallet-address";

/* -------------------------------------------------------------------------- */
/*  Provider icons                                                             */
/* -------------------------------------------------------------------------- */

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 262 262"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5 shrink-0", className)}
    >
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
    </svg>
  );
}

function IconDiscord({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn("h-5 w-5 shrink-0", className)}
    >
      <path
        d="M16.238 4.515a14.842 14.842 0 0 0-3.664-1.136.055.055 0 0 0-.059.027 10.35 10.35 0 0 0-.456.938 13.702 13.702 0 0 0-4.115 0 9.479 9.479 0 0 0-.464-.938.058.058 0 0 0-.058-.027c-1.266.218-2.497.6-3.664 1.136a.052.052 0 0 0-.024.02C1.4 8.023.76 11.424 1.074 14.782a.062.062 0 0 0 .024.042 14.923 14.923 0 0 0 4.494 2.272.058.058 0 0 0 .064-.02c.346-.473.654-.972.92-1.496a.057.057 0 0 0-.032-.08 9.83 9.83 0 0 1-1.404-.669.058.058 0 0 1-.029-.046.058.058 0 0 1 .023-.05c.094-.07.189-.144.279-.218a.056.056 0 0 1 .058-.008c2.946 1.345 6.135 1.345 9.046 0a.056.056 0 0 1 .059.007c.09.074.184.149.28.22a.058.058 0 0 1 .023.049.059.059 0 0 1-.028.046 9.224 9.224 0 0 1-1.405.669.058.058 0 0 0-.033.033.056.056 0 0 0 .002.047c.27.523.58 1.022.92 1.495a.056.056 0 0 0 .062.021 14.878 14.878 0 0 0 4.502-2.272.055.055 0 0 0 .016-.018.056.056 0 0 0 .008-.023c.375-3.883-.63-7.256-2.662-10.246a.046.046 0 0 0-.023-.021Zm-9.223 8.221c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.717 1.814-1.618 1.814Zm5.981 0c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.71 1.814-1.618 1.814Z"
        fill="#5865F2"
      />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("h-5 w-5 shrink-0", className)}
      fill="currentColor"
    >
      <path d="M14.095479,10.316482L22.286354,1h-1.940718l-7.115352,8.087682L7.551414,1H1l8.589488,12.231093L1,23h1.940717l7.509372-8.542861L16.448587,23H23L14.095479,10.316482z M11.436522,13.338465l-0.871624-1.218704l-6.924311-9.68815h2.981339l5.58978,7.82155l0.867949,1.218704l7.26506,10.166271h-2.981339L11.436522,13.338465z" />
    </svg>
  );
}

const SOCIAL_PROVIDERS = [
  { id: "google" as const, name: "Google", icon: <IconGoogle /> },
  { id: "discord" as const, name: "Discord", icon: <IconDiscord /> },
  { id: "twitter" as const, name: "X", icon: <IconX /> },
];

/* -------------------------------------------------------------------------- */
/*  Wallet icon button (for the compact grid)                                 */
/* -------------------------------------------------------------------------- */

function WalletIconButton({
  wallet,
  onClick,
  loading = false,
  dark = false,
}: {
  wallet: Wallet;
  onClick: () => void;
  loading?: boolean;
  dark?: boolean;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            "transition-colors cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            dark
              ? cn("border border-white/15 bg-white/10 hover:bg-white/20", loading && "border-white/30")
              : cn("border border-border bg-muted/50 hover:bg-accent hover:border-foreground/20", loading && "border-primary/50 bg-primary/5")
          )}
          onClick={onClick}
          disabled={loading}
          aria-label={`Connect ${wallet.name}`}
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
/*  Add-wallet tile                                                            */
/* -------------------------------------------------------------------------- */

const CARDANO_WALLETS = [
  { name: "Eternl", url: "https://eternl.io" },
  { name: "Lace", url: "https://www.lace.io" },
  { name: "Vespr", url: "https://vespr.xyz" },
];

function AddWalletTile({ dark = false }: { dark?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            "cursor-pointer transition-colors",
            dark
              ? "border border-dashed border-white/20 text-white/30 hover:bg-white/10 hover:text-white/60"
              : "border border-dashed border-border text-muted-foreground/40 hover:bg-accent hover:text-muted-foreground"
          )}
          aria-label="Add a wallet"
        >
          <AddIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="top" align="center">
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Get a wallet
        </p>
        {CARDANO_WALLETS.map(({ name, url }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            {name}
            <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

interface SignInOptionsProps {
  /** Called after a successful wallet or social connection. */
  onConnected?: () => void;
  /** Whether to persist the wallet session across page reloads. Default: true. */
  persist?: boolean;
  /** UTxOs Web3 config. Defaults to WEB3_SERVICES_CONFIG from env. */
  web3Services?: EnableWeb3WalletOptions;
  /** Use white-on-dark styling for display on brand-navy backgrounds. */
  dark?: boolean;
}

/**
 * Renders the full sign-in option set: social login buttons (Google, Discord, X)
 * followed by a browser wallet icon grid.
 *
 * Shared between ConnectWalletButton (dialog) and RegistrationFlow (inline).
 */
export function SignInOptions({
  onConnected,
  persist = true,
  web3Services = WEB3_SERVICES_CONFIG,
  dark = false,
}: SignInOptionsProps) {
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [socialLoading, setSocialLoading] = React.useState<string | null>(null);
  const wallets = useWalletList();
  const { connect, setWallet, setWeb3UserData, setPersist } = useWallet();

  React.useEffect(() => {
    setPersist(persist);
  }, [persist, setPersist]);

  // Prefetch @meshsdk/core when social providers are visible
  React.useEffect(() => {
    if (web3Services && env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID) {
      void import("@meshsdk/core");
    }
  }, [web3Services]);

  const handleConnect = React.useCallback(
    async (walletId: string) => {
      setConnectingId(walletId);
      try {
        await connect(walletId, persist);
        onConnected?.();
      } catch {
        // User cancelled or wallet errored
      } finally {
        setConnectingId(null);
      }
    },
    [connect, persist, onConnected]
  );

  const handleSocialConnect = React.useCallback(
    async (directTo: "google" | "discord" | "twitter") => {
      if (!web3Services) return;
      setSocialLoading(directTo);
      try {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWeb3UserData(user as any);
        setWallet(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          web3Wallet.cardano as any,
          "Mesh Web3 Services",
          persist
            ? { walletAddress: await getWalletAddressBech32(web3Wallet.cardano), user }
            : undefined
        );
        onConnected?.();
      } catch {
        // User cancelled or popup blocked
      } finally {
        setSocialLoading(null);
      }
    },
    [web3Services, persist, setWallet, setWeb3UserData, onConnected]
  );

  const hasSocial = !!web3Services;
  const hasWallets = wallets.length > 0;
  const isBusy = !!socialLoading || !!connectingId;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Social sign-in — primary path */}
        {hasSocial && (
          <div className="flex gap-3">
            {SOCIAL_PROVIDERS.map((provider) => (
              <Tooltip key={provider.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => void handleSocialConnect(provider.id)}
                    disabled={isBusy}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg",
                      "cursor-pointer transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      dark
                        ? cn("border border-white/15 bg-white/10 hover:bg-white/20", socialLoading === provider.id && "border-white/30")
                        : cn("border border-border bg-muted/50 hover:bg-accent hover:border-foreground/20", socialLoading === provider.id && "border-primary/50 bg-primary/5")
                    )}
                    aria-label={`Sign in with ${provider.name}`}
                  >
                    {socialLoading === provider.id ? (
                      <LoadingIcon className={cn("h-5 w-5 animate-spin", dark ? "text-white/50" : "text-muted-foreground")} />
                    ) : (
                      provider.icon
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{provider.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Divider */}
        {hasSocial && hasWallets && (
          <div className="flex items-center gap-3">
            <div className={cn("flex-1 border-t", dark ? "border-white/20" : "border-border")} />
            <span className={cn("text-xs", dark ? "text-white/40" : "text-muted-foreground")}>or</span>
            <div className={cn("flex-1 border-t", dark ? "border-white/20" : "border-border")} />
          </div>
        )}

        {/* Browser wallet grid — secondary path */}
        {hasWallets && (
          <div className="space-y-2">
            {hasSocial && (
              <p className={cn("text-xs", dark ? "text-white/40" : "text-muted-foreground")}>
                Cardano wallet
              </p>
            )}
            <div className="grid grid-cols-5 place-items-center gap-3">
              {wallets.map((wallet) => (
                <WalletIconButton
                  key={wallet.id}
                  wallet={wallet}
                  loading={connectingId === wallet.id}
                  onClick={() => void handleConnect(wallet.id)}
                  dark={dark}
                />
              ))}
              <AddWalletTile dark={dark} />
            </div>
          </div>
        )}

        {/* Nothing available */}
        {!hasSocial && !hasWallets && (
          <div className="py-6 text-center">
            <WalletIcon className={cn("mx-auto mb-3 h-8 w-8", dark ? "text-white/30" : "text-muted-foreground/40")} />
            <p className={cn("text-sm font-medium", dark ? "text-white" : "text-foreground")}>No wallets found</p>
            <p className={cn("mt-1 text-xs", dark ? "text-white/50" : "text-muted-foreground")}>
              Install a Cardano wallet extension to continue
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
