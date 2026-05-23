"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { MobileNav } from "./mobile-nav";
import {
  WalletIcon,
  ShieldIcon,
  VerifiedIcon,
  PendingIcon,
  SecurityAlertIcon,
  NeutralIcon,
  AccessTokenIcon,
  LogOutIcon,
  LightModeIcon,
  DarkModeIcon,
} from "~/components/icons";
import { getStoredJWT } from "~/lib/andamio-auth";
import { cn } from "~/lib/utils";

interface JWTPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * AuthStatusBar - A minimal, professional status bar showing connection state
 */
export function AuthStatusBar() {
  const router = useRouter();
  const { name: walletName } = useWallet();
  const { theme, setTheme } = useTheme();
  const {
    isWalletConnected,
    isAuthenticated,
    user,
    logout,
    authError,
    popupBlocked,
    authenticate,
  } = useAndamioAuth();

  const [mounted, setMounted] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  const handleLogout = useCallback(() => {
    logout("sign_out");
    router.push("/");
  }, [logout, router]);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update JWT expiration countdown
  useEffect(() => {
    if (!isAuthenticated) {
      setTimeUntilExpiry(null);
      setIsExpiringSoon(false);
      return;
    }

    const updateExpiry = () => {
      const jwt = getStoredJWT();
      if (!jwt) {
        setTimeUntilExpiry(null);
        setIsExpiringSoon(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]!)) as JWTPayload;
        if (!payload.exp) {
          setTimeUntilExpiry(null);
          return;
        }
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const diff = expiresAt - now;

        if (diff <= 0) {
          setTimeUntilExpiry("Expired");
          setIsExpiringSoon(true);
          return;
        }

        // Check if expiring within 5 minutes
        setIsExpiringSoon(diff < 5 * 60 * 1000);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeUntilExpiry(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeUntilExpiry(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilExpiry(`${seconds}s`);
        }
      } catch (error) {
        console.error("Error parsing JWT:", error);
        setTimeUntilExpiry(null);
      }
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="h-10 border-b border-primary-foreground/10 bg-primary text-primary-foreground">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        {/* Left: Mobile Menu + Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0" role="status" aria-live="polite">
          {/* Mobile Menu - Visible on small screens only */}
          <MobileNav />

          {/* Wallet Status - Hidden on very small screens */}
          <div
            className="hidden xs:flex items-center gap-2"
            aria-label={isWalletConnected ? `Wallet connected: ${walletName ?? "Wallet"}` : "Wallet not connected"}
          >
            <WalletIcon className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <NeutralIcon
                className={cn(
                  "h-1.5 w-1.5 fill-current flex-shrink-0",
                  isWalletConnected ? "text-success-foreground" : "text-primary-foreground/50"
                )}
              />
              <span className="text-xs text-primary-foreground/80 truncate">
                {isWalletConnected ? walletName ?? "Wallet" : "Not connected"}
              </span>
            </div>
          </div>

          {/* Divider - Hidden on small screens */}
          <div className="hidden sm:block h-4 w-px bg-primary-foreground/20 flex-shrink-0" />

          {/* Auth Status - Hidden on very small screens */}
          <div
            className="hidden xs:flex items-center gap-2"
            aria-label={isAuthenticated ? "Authenticated" : authError ? "Authentication error" : "Not authenticated"}
          >
            {isAuthenticated ? (
              <VerifiedIcon className="h-3.5 w-3.5 text-success-foreground flex-shrink-0" />
            ) : authError || popupBlocked ? (
              <SecurityAlertIcon className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            ) : (
              <ShieldIcon className="h-3.5 w-3.5 text-primary-foreground/50 flex-shrink-0" />
            )}
            {popupBlocked && !isAuthenticated ? (
              <button
                onClick={() => void authenticate()}
                className="text-xs whitespace-nowrap text-destructive underline underline-offset-2 hover:text-destructive/80"
              >
                Sign In
              </button>
            ) : (
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isAuthenticated
                    ? "text-success-foreground"
                    : authError
                    ? "text-destructive"
                    : "text-primary-foreground/50"
                )}
              >
                {isAuthenticated
                  ? "Auth"
                  : authError
                  ? "Error"
                  : "Unauth"}
              </span>
            )}
          </div>

          {/* JWT Timer - Only show when authenticated, hidden on small screens */}
          {isAuthenticated && timeUntilExpiry && (
            <>
              <div className="hidden sm:block h-4 w-px bg-primary-foreground/20 flex-shrink-0" />
              <div className="hidden sm:flex items-center gap-1.5" aria-label={`Session expires in ${timeUntilExpiry}`}>
                <PendingIcon
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    isExpiringSoon ? "text-warning" : "text-primary-foreground/70"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-mono",
                    timeUntilExpiry === "Expired"
                      ? "text-destructive"
                      : isExpiringSoon
                      ? "text-warning"
                      : "text-primary-foreground/70"
                  )}
                >
                  {timeUntilExpiry === "Expired" ? "Exp" : timeUntilExpiry}
                </span>
              </div>
            </>
          )}

          {/* User Alias - Only show when authenticated, hidden on very small screens */}
          {isAuthenticated && user?.accessTokenAlias && (
            <>
              <div className="hidden sm:block h-4 w-px bg-primary-foreground/20 flex-shrink-0" />
              <div className="hidden sm:flex items-center gap-1.5">
                <AccessTokenIcon className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
                <span className="h-5 text-[10px] font-mono px-1.5 bg-primary-foreground/15 text-primary-foreground rounded">
                  {user.accessTokenAlias}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          {mounted && (
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <LightModeIcon className="h-3.5 w-3.5" />
              ) : (
                <DarkModeIcon className="h-3.5 w-3.5" />
              )}
            </AndamioButton>
          )}

          {isAuthenticated ? (
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex h-6 px-2 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15"
            >
              <LogOutIcon className="mr-1.5 h-3 w-3" />
              Sign Out
            </AndamioButton>
          ) : (
            <ConnectWalletButton
              label="Sign In"
              className="hidden sm:flex h-6 px-2 text-xs border-0 bg-transparent text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15"
            />
          )}
        </div>
      </div>
    </div>
  );
}
