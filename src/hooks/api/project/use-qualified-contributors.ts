/**
 * React Query hook for the qualified-contributors endpoint.
 *
 * GET /api/v2/project/manager/contributors/get-qualified?project_id={id}
 *
 * Returns the alias list eligible to commit to a managed project's tasks —
 * anyone holding all the project's required (course_id, slt_hash) prerequisites,
 * regardless of whether they have already enrolled. Powers the pre-assign
 * dropdown on the task creation/edit form (issue #515).
 *
 * Hard cap: 500 aliases. When `truncated === true`, the underlying intersection
 * exceeded the cap and the UI should surface a "refine search" hint.
 *
 * Manager-only — non-managers receive 403.
 */

import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { projectManagerKeys } from "./use-project-manager";

// =============================================================================
// App-Level Types
// =============================================================================

export interface QualifiedContributors {
  aliases: string[];
  totalCount: number;
  truncated: boolean;
}

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query key for the qualified-contributors list, scoped under projectManagerKeys
 * so manager-cache invalidations sweep this too.
 */
export const qualifiedContributorsKey = (projectId: string) =>
  [...projectManagerKeys.all, "qualified-contributors", projectId] as const;

/**
 * Stable sentinel key used while the hook is mounted without a projectId.
 * Never fetched (the `enabled` gate blocks queryFn) but kept distinct so
 * disabled mounts don't pollute the cache under an empty-string entry.
 */
const QUALIFIED_CONTRIBUTORS_DISABLED_KEY = [
  ...projectManagerKeys.all,
  "qualified-contributors",
  "__disabled__",
] as const;

// =============================================================================
// Validation
// =============================================================================

/**
 * Distinct, human-readable error messages by status. Surfaces auth/permission
 * issues separately from transient downstream failures so callers can render
 * appropriate UI without re-mapping. Exported for testing.
 */
export function messageForStatus(status: number, statusText: string): string {
  switch (status) {
    case 401:
      return "Sign in to manage this project";
    case 403:
      return "You are not a manager of this project";
    case 404:
      return "Project not found";
    case 502:
      return "Scan temporarily unavailable, retry later";
    case 504:
      return "Scan timed out, retry later";
    default:
      return `Failed to fetch qualified contributors: ${statusText}`;
  }
}

/**
 * Coerce an arbitrary JSON value into a `QualifiedContributors` object.
 * Tolerates a malformed envelope (missing fields, wrong types, non-string
 * entries in `aliases`) by falling back to safe defaults rather than crashing
 * the picker. Exported for testing.
 */
export function parseQualifiedContributorsResponse(
  raw: unknown,
): QualifiedContributors {
  if (!raw || typeof raw !== "object") {
    return { aliases: [], totalCount: 0, truncated: false };
  }
  const envelope = raw as { data?: unknown };
  const data = envelope.data;
  if (!data || typeof data !== "object") {
    return { aliases: [], totalCount: 0, truncated: false };
  }
  const d = data as Record<string, unknown>;
  const aliases = Array.isArray(d.aliases)
    ? d.aliases.filter((a): a is string => typeof a === "string")
    : [];
  const totalCount =
    typeof d.total_count === "number" ? d.total_count : aliases.length;
  const truncated = typeof d.truncated === "boolean" ? d.truncated : false;
  return { aliases, totalCount, truncated };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch aliases qualified to be pre-assigned to tasks in a managed project.
 *
 * @param projectId - Project ID. Hook is disabled until non-empty.
 * @param options.enabled - Optional override (e.g. only enable when popover is open).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQualifiedContributors(projectId);
 * const aliases = data?.aliases ?? [];
 * ```
 */
export function useQualifiedContributors(
  projectId: string | undefined,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectId
      ? qualifiedContributorsKey(projectId)
      : QUALIFIED_CONTRIBUTORS_DISABLED_KEY,
    queryFn: async ({ signal }): Promise<QualifiedContributors> => {
      if (!projectId) {
        // The `enabled` gate below should prevent this branch from ever
        // executing; defensive guard avoids a runtime crash if a caller
        // overrides `options.enabled` while projectId is still falsy.
        throw new Error("projectId is required");
      }
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/manager/contributors/get-qualified?project_id=${encodeURIComponent(projectId)}`,
        { signal },
      );

      if (!response.ok) {
        throw new Error(messageForStatus(response.status, response.statusText));
      }

      const raw = (await response.json()) as unknown;
      return parseQualifiedContributorsResponse(raw);
    },
    enabled: !!projectId && isAuthenticated && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
