/**
 * Hooks
 *
 * Centralized exports for all React hooks.
 * Organized by domain: api, tx, auth, ui
 *
 * @example
 * ```tsx
 * // API hooks (React Query)
 * import { useCourse, useProject } from "~/hooks";
 *
 * // Transaction hooks
 * import { useTransaction, useTxStream } from "~/hooks";
 *
 * // Auth hooks
 * import { useAndamioAuth } from "~/hooks";
 *
 * // UI hooks
 * import { useSuccessNotification, useWizardNavigation } from "~/hooks";
 * ```
 */

// API hooks (React Query)
export * from "./api";

// Transaction hooks
export * from "./tx";

// Auth hooks
export * from "./auth";

// UI hooks
export * from "./ui";
