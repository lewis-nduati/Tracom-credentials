/**
 * UI Constants Configuration
 *
 * Centralizes magic numbers and timing values for the UI layer.
 * Cardano-specific constants (explorer URLs, etc.) are in @andamio/core.
 *
 * @see packages/core/constants/cardano.ts for blockchain constants
 */

/**
 * UI timing constants for notifications and feedback
 */
export const UI_TIMEOUTS = {
  /** Duration for copy feedback messages (e.g., "Copied!") */
  COPY_FEEDBACK: 2000,
  /** Duration for save success notifications */
  SAVE_SUCCESS: 3000,
  /** Duration for general toast notifications */
  TOAST_DEFAULT: 3000,
  /** Duration for error notifications (longer for readability) */
  ERROR_NOTIFICATION: 5000,
  /** Duration to show success state before transitioning (confirmation alerts) */
  SUCCESS_TRANSITION: 3000,
  /** Duration for workflow notifications (assignment finalization, multi-step flows) */
  WORKFLOW_NOTIFICATION: 8000,
  /** Threshold to show "taking longer than expected" warning */
  LONG_WAIT_WARNING: 120000, // 2 minutes
  /** Debounce delay for search inputs */
  SEARCH_DEBOUNCE: 300,
  /** Delay before showing loading skeleton */
  LOADING_DELAY: 200,
} as const;

/**
 * Blockchain polling intervals by entity type (in milliseconds)
 */
export const POLLING_INTERVALS = {
  /** Default polling interval for most transactions (gateway confirms in ~5s) */
  DEFAULT: 5000, // 5 seconds
  /** Fast polling for access token minting (user waiting on onboarding) */
  ACCESS_TOKEN: 5000, // 5 seconds
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  /** Default page size for lists */
  DEFAULT_PAGE_SIZE: 10,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
  /** Page size options for selectors */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Form validation limits
 */
export const FORM_LIMITS = {
  /** Maximum title length */
  MAX_TITLE_LENGTH: 200,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum module code length */
  MAX_MODULE_CODE_LENGTH: 50,
  /** Maximum SLT text length */
  MAX_SLT_LENGTH: 500,
  /** Maximum number of SLTs per module */
  MAX_SLTS_PER_MODULE: 50,
  /** Minimum title length */
  MIN_TITLE_LENGTH: 3,
} as const;

/**
 * Layout constants
 */
export const LAYOUT = {
  /** Sidebar width in pixels */
  SIDEBAR_WIDTH: 224, // 56 * 4 = 14rem
  /** Header height in pixels */
  HEADER_HEIGHT: 48, // 12 * 4 = 3rem
  /** Max content width in pixels */
  MAX_CONTENT_WIDTH: 1280, // 80rem
  /** Mobile breakpoint in pixels */
  MOBILE_BREAKPOINT: 768,
} as const;

/**
 * Transaction cost estimates displayed in confirmation dialogs (in ADA).
 * These are approximate per-entity costs shown to users before signing.
 */
export const TX_COSTS = {
  /** Cost per teacher added to a course */
  PER_TEACHER_ADA: 10,
  /** Cost per manager added to a project */
  PER_MANAGER_ADA: 10,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATIONS = {
  /** Fast animations (hover states, small transitions) */
  FAST: 150,
  /** Default animations (most UI transitions) */
  DEFAULT: 200,
  /** Slow animations (modals, large transitions) */
  SLOW: 300,
  /** Page transitions */
  PAGE: 400,
} as const;

/**
 * Commitment status categories for filtering assignment/commitment lists
 */
export const RESOLVED_COMMITMENT_STATUSES = ["ACCEPTED", "REFUSED", "DENIED"] as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  /** Base content */
  BASE: 0,
  /** Sticky elements */
  STICKY: 10,
  /** Dropdown menus */
  DROPDOWN: 20,
  /** Fixed header/sidebar */
  FIXED: 30,
  /** Modals/dialogs */
  MODAL: 40,
  /** Popovers and tooltips */
  POPOVER: 50,
  /** Toast notifications */
  TOAST: 60,
} as const;
