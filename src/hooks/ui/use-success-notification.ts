"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UI_TIMEOUTS } from "~/config";

/**
 * useSuccessNotification - Manages temporary success notification state
 *
 * Eliminates the repeated pattern of:
 * ```ts
 * const [saveSuccess, setSaveSuccess] = useState(false);
 * // ...
 * setSaveSuccess(true);
 * setTimeout(() => setSaveSuccess(false), 3000);
 * ```
 *
 * @param duration - How long to show success state (default: 3000ms)
 * @returns Object with isSuccess state and showSuccess trigger
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { isSuccess, showSuccess } = useSuccessNotification();
 *
 *   const handleSave = async () => {
 *     await saveData();
 *     showSuccess(); // Shows success for 3 seconds
 *   };
 *
 *   return (
 *     <>
 *       {isSuccess && <Alert>Saved successfully!</Alert>}
 *       <Button onClick={handleSave}>Save</Button>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom duration
 * const { isSuccess, showSuccess } = useSuccessNotification(5000);
 *
 * // With message tracking
 * const { isSuccess, showSuccess, message } = useSuccessNotification();
 * showSuccess("Changes saved!");
 * // message === "Changes saved!"
 * ```
 */
export interface UseSuccessNotificationResult {
  /** Whether success state is currently active */
  isSuccess: boolean;
  /** Optional message passed to showSuccess */
  message: string | null;
  /** Trigger success state for the configured duration */
  showSuccess: (message?: string) => void;
  /** Manually hide success state */
  hideSuccess: () => void;
}

export function useSuccessNotification(
  duration: number = UI_TIMEOUTS.SAVE_SUCCESS
): UseSuccessNotificationResult {
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showSuccess = useCallback(
    (msg?: string) => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsSuccess(true);
      setMessage(msg ?? null);

      timerRef.current = setTimeout(() => {
        setIsSuccess(false);
        setMessage(null);
      }, duration);
    },
    [duration]
  );

  const hideSuccess = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsSuccess(false);
    setMessage(null);
  }, []);

  return {
    isSuccess,
    message,
    showSuccess,
    hideSuccess,
  };
}

/**
 * useCopyFeedback - Specialized hook for copy-to-clipboard feedback
 *
 * Uses a shorter duration (2 seconds) appropriate for quick feedback.
 *
 * @example
 * ```tsx
 * function CopyButton({ text }: { text: string }) {
 *   const { isCopied, copy } = useCopyFeedback();
 *
 *   return (
 *     <Button onClick={() => copy(text)}>
 *       {isCopied ? "Copied!" : "Copy"}
 *     </Button>
 *   );
 * }
 * ```
 */
export interface UseCopyFeedbackResult {
  /** Whether "copied" feedback is currently shown */
  isCopied: boolean;
  /** Copy text to clipboard and show feedback */
  copy: (text: string) => Promise<void>;
}

export function useCopyFeedback(): UseCopyFeedbackResult {
  const { isSuccess, showSuccess } = useSuccessNotification(
    UI_TIMEOUTS.COPY_FEEDBACK
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showSuccess();
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    },
    [showSuccess]
  );

  return {
    isCopied: isSuccess,
    copy,
  };
}
