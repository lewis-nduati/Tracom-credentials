import type { JSONContent } from "@tiptap/core";

/**
 * Metadata embedded in contentJson._metadata
 * Tiptap ignores unknown top-level keys, so this is safe.
 */
interface TaskMetadata {
  preAssignment?: {
    alias: string;
  };
}

/**
 * Extract pre-assigned alias from a task's contentJson.
 * Returns null if not pre-assigned or if metadata is malformed.
 * Uses runtime type checks — contentJson comes from external API as unknown.
 */
export function getPreAssignedAlias(contentJson: unknown): string | null {
  if (!contentJson || typeof contentJson !== "object") return null;
  const metadata = (contentJson as Record<string, unknown>)._metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const preAssignment = (metadata as Record<string, unknown>).preAssignment;
  if (!preAssignment || typeof preAssignment !== "object") return null;
  const alias = (preAssignment as Record<string, unknown>).alias;
  if (typeof alias !== "string") return null;
  return alias || null;
}

/**
 * Set or remove pre-assignment on contentJson.
 * - If alias is provided: embeds _metadata.preAssignment
 * - If alias is null/empty: removes _metadata.preAssignment
 * - If contentJson is null: creates a minimal doc wrapper
 */
export function setPreAssignment(
  contentJson: JSONContent | null,
  alias: string | null,
): JSONContent | null {
  const trimmed = alias?.trim() || null;

  // If no alias AND no existing content, return null (no contentJson needed)
  if (!trimmed && !contentJson) return null;

  // Start from existing content or create minimal doc
  const doc: JSONContent & { _metadata?: TaskMetadata } = contentJson
    ? { ...contentJson }
    : { type: "doc", content: [] };

  if (trimmed) {
    doc._metadata = {
      ...(doc._metadata),
      preAssignment: { alias: trimmed },
    };
  } else {
    // Remove pre-assignment (only metadata key today — delete entire _metadata)
    delete doc._metadata;
    // If the doc was only created for metadata and has no content, return null
    if (!contentJson && (!doc.content || doc.content.length === 0)) {
      return null;
    }
  }

  return doc;
}
