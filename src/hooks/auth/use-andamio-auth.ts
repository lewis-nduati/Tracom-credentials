/**
 * Re-export of useAndamioAuth hook from context
 *
 * Canonical barrel export for the auth hook. The actual implementation
 * uses React Context for global state management.
 */
export { useAndamioAuth } from "~/contexts/andamio-auth-context";
export type { LogoutReason } from "~/lib/andamio-auth";
