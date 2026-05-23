/**
 * Status Icons - State Indicators
 *
 * These icons represent various states and statuses.
 * Import from ~/components/icons instead of lucide-react directly.
 */

// =============================================================================
// Completion & Success States
// =============================================================================

/** Success - operation completed successfully */
export { CheckCircle as SuccessIcon } from "lucide-react";

/** Completed - task/step is done (minimal checkmark) */
export { Check as CompletedIcon } from "lucide-react";

/** Check - generic checkmark (alias for CompletedIcon) */
export { Check as CheckIcon } from "lucide-react";

/** Verified - verified/validated state */
export { CheckCircle2 as VerifiedIcon } from "lucide-react";

// =============================================================================
// Error & Warning States
// =============================================================================

/** Error - operation failed or error state */
export { XCircle as ErrorIcon } from "lucide-react";

/** Warning/Alert (circle) - attention needed, general alerts */
export { AlertCircle as AlertIcon } from "lucide-react";

/** Warning (triangle) - caution, important warnings */
export { AlertTriangle as WarningIcon } from "lucide-react";

/** Info - informational messages */
export { Info as InfoIcon } from "lucide-react";

/** Security Alert - security-related warnings */
export { ShieldAlert as SecurityAlertIcon } from "lucide-react";

// =============================================================================
// Progress & Loading States
// =============================================================================

/** Loading - async operation in progress */
export { Loader2 as LoadingIcon } from "lucide-react";

/** Pending - waiting for action or confirmation */
export { Clock as PendingIcon } from "lucide-react";

/** Neutral/Empty - neutral state indicator */
export { Circle as NeutralIcon } from "lucide-react";

// =============================================================================
// Availability States
// =============================================================================

/** Locked - unavailable or restricted */
export { Lock as LockedIcon } from "lucide-react";

/** Live/Active - published and available */
export { CheckCircle as LiveIcon } from "lucide-react";

/** Draft - not yet published */
export { FileEdit as DraftIcon } from "lucide-react";
