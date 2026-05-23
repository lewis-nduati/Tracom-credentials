"use client";

interface AccessTokenConfirmationAlertProps {
  /** Callback when confirmation flow completes (after success delay) */
  onComplete?: () => void;
}

/**
 * AccessTokenConfirmationAlert
 *
 * Shows blockchain confirmation status for access token minting.
 *
 * NOTE: This component is currently disabled pending restoration of
 * the pending transaction context. The onComplete callback will be
 * used once the V2 TX State Machine pattern is fully integrated.
 *
 * @see ~/hooks/tx/use-tx-watcher.ts - V2 TX status polling
 */
export function AccessTokenConfirmationAlert(_props: AccessTokenConfirmationAlertProps) {
  // Pending TX tracking disabled - awaiting V2 TX State Machine integration
  return null;
}
