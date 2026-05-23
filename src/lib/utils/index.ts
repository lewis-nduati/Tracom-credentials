/**
 * Utility Functions
 *
 * Note: Hash utilities (computeTaskHash, computeSltHash, computeCommitmentHash)
 * have been moved to @andamio/core/hashing. Import directly from there:
 *
 * @example
 * ```typescript
 * import { computeTaskHash, computeSltHash, computeCommitmentHash } from "@andamio/core/hashing";
 * ```
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
