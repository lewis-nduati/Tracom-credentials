"use client";

import { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { getStoredJWT } from "~/lib/andamio-auth";

export interface SessionExpiry {
  /** "3h 12m", "4m 05s", "12s", "Expired", or null when unknown. */
  label: string | null;
  /** True within five minutes of expiry, or after it. */
  isExpiringSoon: boolean;
  expiresAt: Date | null;
}

const UNKNOWN: SessionExpiry = { label: null, isExpiringSoon: false, expiresAt: null };

/** Live countdown to the stored JWT's expiry, updated every second. */
export function useSessionExpiry(): SessionExpiry {
  const { isAuthenticated } = useAndamioAuth();
  const [state, setState] = useState<SessionExpiry>(UNKNOWN);

  useEffect(() => {
    if (!isAuthenticated) {
      setState(UNKNOWN);
      return;
    }

    const update = () => {
      const jwt = getStoredJWT();
      if (!jwt) return setState(UNKNOWN);
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
        if (!payload.exp) return setState(UNKNOWN);
        const expiresAt = new Date(payload.exp * 1000);
        const diff = expiresAt.getTime() - Date.now();
        if (diff <= 0) return setState({ label: "Expired", isExpiringSoon: true, expiresAt });
        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1000);
        const label =
          hours > 0
            ? `${hours}h ${minutes}m`
            : minutes > 0
              ? `${minutes}m ${String(seconds).padStart(2, "0")}s`
              : `${seconds}s`;
        setState({ label, isExpiringSoon: diff < 5 * 60_000, expiresAt });
      } catch {
        setState(UNKNOWN);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return state;
}
