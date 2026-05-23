/**
 * Sidebar Configuration
 *
 * Centralized styling constants for all sidebar components.
 * Ensures consistency across AppSidebar, StudioSidebar, and MobileNav.
 */

/**
 * Sidebar width and layout constants.
 */
export const SIDEBAR_LAYOUT = {
  /** Desktop sidebar width (224px) */
  width: "w-56",

  /** Standard header height */
  headerHeight: "h-14",

  /** Compact header height (studio variant) */
  compactHeaderHeight: "h-12",
} as const;

/**
 * Desktop sidebar item styling.
 */
export const SIDEBAR_DESKTOP = {
  itemPadding: "py-1.5 px-2",
  iconSize: "h-3.5 w-3.5",
  fontSize: "text-xs",
  gap: "gap-2",
  sectionHeaderSize: "text-[9px]",
} as const;

/**
 * Mobile sidebar item styling (larger touch targets).
 */
export const SIDEBAR_MOBILE = {
  itemPadding: "py-3 px-3",
  iconSize: "h-4 w-4",
  fontSize: "text-sm",
  gap: "gap-3",
  sectionHeaderSize: "text-xs",
} as const;

/**
 * Wallet address display truncation.
 * Shows first 8 and last 4 characters: "addr1q2x...y7z9"
 */
export const WALLET_TRUNCATION = {
  start: 8,
  end: 4,
} as const;

/**
 * Helper to truncate a wallet address consistently.
 */
export function truncateWalletAddress(address: string | undefined): string {
  if (!address) return "";
  const { start, end } = WALLET_TRUNCATION;
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Sidebar color tokens (semantic references to CSS variables).
 * Use these class names for consistent theming.
 */
export const SIDEBAR_COLORS = {
  background: "bg-sidebar",
  foreground: "text-sidebar-foreground",
  border: "border-sidebar-border",
  accent: "bg-sidebar-accent",
  accentForeground: "text-sidebar-accent-foreground",
  accentHover: "hover:bg-sidebar-accent/50",
  muted: "text-muted-foreground",
} as const;
