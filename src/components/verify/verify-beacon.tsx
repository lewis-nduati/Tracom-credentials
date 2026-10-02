"use client";

import { useEffect, useRef } from "react";

interface VerifyBeaconProps {
  /** The `<policy>.<asset>` token, omitted when the input was malformed. */
  credential?: string;
  outcome: "verified" | "not_found" | "malformed";
}

/**
 * Reports one verification view, once per mount.
 *
 * Renders nothing. Reducing the referrer to a bare hostname happens here,
 * on the client, so a referrer carrying identifiers in its query string never
 * reaches the server at all.
 *
 * Failures are swallowed. An employer checking a certificate must never see
 * an error because our measurement did not go through.
 */
export function VerifyBeacon({ credential, outcome }: VerifyBeaconProps) {
  const sent = useRef(false);

  useEffect(() => {
    // React runs effects twice in development. Without this the numbers double.
    if (sent.current) return;
    sent.current = true;

    let referrerHost: string | undefined;
    try {
      if (document.referrer) {
        referrerHost = new URL(document.referrer).hostname;
      }
    } catch {
      referrerHost = undefined;
    }

    const body = JSON.stringify({ credential, outcome, referrerHost });

    void fetch("/api/verify-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Measurement is not worth a visible failure.
    });
  }, [credential, outcome]);

  return null;
}
