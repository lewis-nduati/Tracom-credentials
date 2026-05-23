/**
 * Config Exports
 *
 * Centralized configuration for the application.
 *
 * Layer 5 (App) configuration:
 * - branding: App identity (name, logo, links)
 * - features: Feature flags
 * - navigation: Sidebar navigation structure
 * - routes: Route definitions and metadata
 * - ui-constants: UI timing and layout values
 * - transaction-ui: Transaction UI config
 * - transaction-schemas: Zod validation schemas
 */

// Branding configuration
export { BRANDING, getPageTitle, getDocsUrl, getPageMetadata, type Branding } from "./branding";

// Marketing configuration
export { MARKETING, type Marketing } from "./marketing";

// Feature flags
export {
  FEATURES,
  isFeatureEnabled,
  getEnabledFeatures,
  type Features,
} from "./features";

// Navigation configuration
export {
  SIDEBAR_NAVIGATION,
  getNavigationSections,
  getAllNavigationItems,
  findNavigationItem,
  isNavItemActive,
} from "./navigation";

// Route definitions
export {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  STUDIO_ROUTES,
  API_ROUTES,
  ROUTE_METADATA,
  getRouteMetadata,
  routeRequiresAuth,
} from "./routes";

// UI constants
export {
  UI_TIMEOUTS,
  POLLING_INTERVALS,
  PAGINATION,
  FORM_LIMITS,
  LAYOUT,
  ANIMATIONS,
  Z_INDEX,
} from "./ui-constants";

// Transaction UI configuration
export {
  TRANSACTION_UI,
  TRANSACTION_ENDPOINTS,
  getTransactionUI,
  getTransactionEndpoint,
  isTransactionType,
  type TransactionType,
  type TransactionUIConfig,
} from "./transaction-ui";

// Transaction validation schemas
export {
  txSchemas,
  validateTxParams,
  getTxSchema,
  parseTxParams,
  // Common schema building blocks
  aliasSchema,
  policyIdSchema,
  hashSchema,
  shortTextSchema,
  walletDataSchema,
  valueSchema,
  type TxParams,
} from "./transaction-schemas";

// Sidebar configuration
export {
  SIDEBAR_LAYOUT,
  SIDEBAR_DESKTOP,
  SIDEBAR_MOBILE,
  WALLET_TRUNCATION,
  SIDEBAR_COLORS,
  truncateWalletAddress,
} from "./sidebar";
