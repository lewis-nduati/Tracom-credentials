/**
 * Feature Flags Configuration
 *
 * Toggle features on/off for different deployment scenarios.
 * This allows gradual rollouts and environment-specific builds.
 */

export const FEATURES = {
  /**
   * Core Features
   */
  core: {
    /** Enable course functionality (browse, enroll, learn) */
    courses: true,
    /** Enable project functionality (browse, contribute, manage) */
    projects: true,
    /** Enable credential viewing */
    credentials: true,
  },

  /**
   * Studio Features (requires authentication)
   */
  studio: {
    /** Enable course creation and management */
    courseStudio: true,
    /** Enable project creation and management */
    projectStudio: true,
    /** Enable module wizard for course editing */
    moduleWizard: true,
    /** Enable task management for projects */
    taskManagement: true,
    /** Enable treasury management */
    treasury: true,
  },

  /**
   * Developer Tools
   */
  devTools: {
    /** Show API setup page */
    apiSetup: true,
    /** Show component library page */
    componentLibrary: true,
    /** Show sitemap page */
    sitemap: true,
    /** Show editor demo page */
    editorDemo: true,
  },

  /**
   * Authentication & Access
   */
  auth: {
    /** Enable wallet-based authentication */
    walletAuth: true,
    /** Enable access token gating */
    accessTokenGating: true,
    /** Enable role-based navigation hiding */
    roleBasedNav: true,
  },

  /**
   * Experimental Features (use with caution)
   */
  experimental: {
    /** Enable new V2 transaction components */
    v2Transactions: true,
    /** Enable pending TX list in sidebar */
    pendingTxList: false,
    /** Enable analytics tracking */
    analytics: false,
  },
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  category: keyof typeof FEATURES,
  feature: string
): boolean {
  const categoryFeatures = FEATURES[category];
  if (typeof categoryFeatures === "object" && feature in categoryFeatures) {
    return categoryFeatures[feature as keyof typeof categoryFeatures] ?? false;
  }
  return false;
}

/**
 * Get all enabled features in a category
 */
export function getEnabledFeatures(
  category: keyof typeof FEATURES
): string[] {
  const categoryFeatures = FEATURES[category];
  return Object.entries(categoryFeatures)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}

export type Features = typeof FEATURES;
