"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { LogOutIcon } from "~/components/icons";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { PendingTxIndicator } from "~/components/tx/pending-tx-indicator";
import { truncateWalletAddress } from "~/config";
import { cn } from "~/lib/utils";

interface SidebarUserSectionProps {
  /**
   * Whether to show the disconnect button.
   * @default true
   */
  showDisconnect?: boolean;

  /**
   * Styling variant:
   * - "compact": Smaller text, tighter spacing (desktop sidebar)
   * - "expanded": Larger text, more spacing (mobile drawer)
   */
  variant?: "compact" | "expanded";

  /**
   * Callback after disconnect button is clicked.
   * Useful for closing mobile drawer after logout.
   */
  onDisconnect?: () => void;

  /**
   * Additional class names for the container.
   */
  className?: string;
}

/**
 * Consistent user section for all sidebars.
 *
 * Displays:
 * - Access token alias (emphasized)
 * - Truncated wallet address with connection indicator
 * - Optional disconnect button
 *
 * When not authenticated, shows a "Sign In" button via ConnectWalletButton.
 */
export function SidebarUserSection({
  showDisconnect = true,
  variant = "compact",
  onDisconnect,
  className,
}: SidebarUserSectionProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAndamioAuth();

  const isExpanded = variant === "expanded";

  const handleDisconnect = () => {
    logout("sign_out");
    onDisconnect?.();
    // Redirect to home so next user sees proper onboarding
    router.push("/");
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={cn("border-t border-sidebar-border p-2", className)}>
        <ConnectWalletButton
          label="Sign In"
          className={cn(
            "w-full",
            isExpanded ? "text-sm h-9" : "text-[11px] h-7"
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("border-t border-sidebar-border p-2", className)}>
      <div className={isExpanded ? "space-y-3" : "space-y-2"}>
        {/* Pending Transactions */}
        <PendingTxIndicator variant={variant} />

        {/* Wallet Info */}
        <div
          className={cn(
            "rounded-md bg-sidebar-accent/50",
            isExpanded ? "p-3 rounded-lg space-y-2" : "p-2 space-y-1.5"
          )}
        >
          {/* Access Token Alias - emphasized */}
          {user.accessTokenAlias && (
            <div
              className={cn(
                "font-semibold text-sidebar-foreground truncate",
                isExpanded ? "text-base" : "text-sm"
              )}
            >
              {user.accessTokenAlias}
            </div>
          )}

          {/* Wallet Address */}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "rounded-full bg-primary motion-safe:animate-pulse flex-shrink-0",
                isExpanded ? "h-2 w-2" : "h-1.5 w-1.5"
              )}
            />
            <span
              className={cn(
                "font-mono text-muted-foreground truncate",
                isExpanded ? "text-xs" : "text-[10px]"
              )}
            >
              {truncateWalletAddress(user.cardanoBech32Addr ?? undefined)}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        {showDisconnect && (
          <ConfirmDialog
            trigger={
              <AndamioButton
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  isExpanded ? "text-sm h-9 px-3" : "text-[11px] h-7 px-2"
                )}
              >
                <LogOutIcon
                  className={cn(
                    "flex-shrink-0",
                    isExpanded ? "mr-2 h-4 w-4" : "mr-1.5 h-3 w-3"
                  )}
                />
                Sign Out
              </AndamioButton>
            }
            title="Sign Out?"
            description="You will need to reconnect your wallet and sign in again to continue."
            confirmText="Sign Out"
            variant="destructive"
            onConfirm={handleDisconnect}
          />
        )}
      </div>
    </div>
  );
}
