/**
 * Type Helper Utilities
 *
 * Functions for handling Andamio API types that use NullableString pattern
 * (returns object type for nullable strings in generated types).
 */

/**
 * Extracts string value from NullableString API fields.
 * The API generates NullableString as 'object' type which cannot be used directly.
 *
 * @param value - The field value which may be string, object, undefined, or null
 * @returns The string value or empty string if not a valid string
 *
 * @example
 * const title = getString(course.title);  // Returns string or ""
 * const desc = getString(project.description) || undefined;  // Returns string or undefined
 */
export function getString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

/**
 * Extracts optional string value from NullableString API fields.
 * Returns undefined instead of empty string when the value is not a string.
 *
 * @param value - The field value which may be string, object, undefined, or null
 * @returns The string value or undefined
 */
export function getOptionalString(value: string | object | undefined | null): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}
