"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";

interface RequireAuthProps {
  /** Page title shown when not authenticated */
  title: string;
  /** Description shown when not authenticated */
  description: string;
  /** Content to render when authenticated */
  children: React.ReactNode;
}

/**
 * Wrapper component that shows auth prompt when user is not authenticated.
 *
 * @example
 * ```tsx
 * <RequireAuth
 *   title="Studio"
 *   description="Connect your wallet to access the creator studio"
 * >
 *   <StudioContent />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({ title, description, children }: RequireAuthProps) {
  const { isAuthenticated } = useAndamioAuth();

  if (!isAuthenticated) {
    return <ConnectWalletGate title={title} description={description} />;
  }

  return <>{children}</>;
}
