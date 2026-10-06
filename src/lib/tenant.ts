import { env } from "~/env";

/**
 * Tenant scoping: show only Tracom's courses and projects.
 *
 * Andamio is a shared network, so the public list endpoints return every
 * course and project on it. NEXT_PUBLIC_COURSE_OWNER and
 * NEXT_PUBLIC_PROJECT_OWNER name the owner aliases that belong to this app
 * (comma-separated when more than one alias owns Tracom content).
 *
 * Fails closed: with no owner configured, nothing matches, so a missing env
 * var shows an empty page instead of the whole network.
 */
export function parseOwners(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

export function isOwnedBy(owner: string | null | undefined, owners: string[]): boolean {
  return !!owner && owners.includes(owner);
}

const COURSE_OWNERS = parseOwners(env.NEXT_PUBLIC_COURSE_OWNER);
const PROJECT_OWNERS = parseOwners(env.NEXT_PUBLIC_PROJECT_OWNER);

export const isTracomCourse = (owner: string | null | undefined) => isOwnedBy(owner, COURSE_OWNERS);
export const isTracomProject = (owner: string | null | undefined) => isOwnedBy(owner, PROJECT_OWNERS);
