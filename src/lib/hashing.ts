import { blake2b } from "blakejs";
import type { JSONContent } from "@tiptap/core";

/**
 * Normalize content structure for consistent hashing
 * Sorts object keys and recursively normalizes nested structures
 */
function normalizeContentStructure(content: JSONContent): JSONContent {
  // BASE CASE 1: Handle primitive values (strings, numbers, null, etc.)
  if (!content || typeof content !== "object") {
    return content;
  }

  // BASE CASE 2: Handle arrays
  if (Array.isArray(content)) {
    return content.map(normalizeContentStructure);
  }

  // RECURSIVE CASE: Handle objects
  const normalized: JSONContent = {};
  const sortedKeys = Object.keys(content).sort();

  sortedKeys.forEach((key) => {
    normalized[key] = normalizeContentStructure(content[key] as JSONContent);
  });

  return normalized;
}

/**
 * Hash Tiptap JSON content using blake2b
 * Returns a 64-character hex string (32 bytes)
 */
export function hashNormalizedContent(content: JSONContent): string {
  const normalized = normalizeContentStructure(content);
  const hash = blake2b(Buffer.from(JSON.stringify(normalized)), undefined, 32);
  return Buffer.from(hash).toString("hex");
}
