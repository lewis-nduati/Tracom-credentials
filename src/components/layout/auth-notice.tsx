"use client";

import React from "react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { SecurityAlertIcon } from "~/components/icons";

/**
 * Shown in the spine when sign-in failed or the wallet popup was blocked.
 * Replaces the error/retry that lived in the old status bar.
 */
export function AuthNotice() {
  const { isAuthenticated, authError, popupBlocked, authenticate } = useAndamioAuth();
  if (isAuthenticated || (!authError && !popupBlocked)) return null;

  return (
    <div role="alert" className="flex items-start gap-2 rounded-sm bg-sidebar-accent px-2 py-2 text-xs text-sidebar-foreground">
      <SecurityAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      {popupBlocked ? (
        <button type="button" onClick={() => void authenticate()} className="text-left underline underline-offset-2">
          The wallet popup was blocked. Sign in again.
        </button>
      ) : (
        <span>Sign-in failed. Try connecting your wallet again.</span>
      )}
    </div>
  );
}
