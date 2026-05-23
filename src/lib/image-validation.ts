/**
 * Shared image upload validation constants and helpers.
 *
 * Used by:
 * - AndamioImageUrlField (client-side pre-validation)
 * - ImageUpload Tiptap extension (client-side pre-validation)
 * - /api/upload route (server-side validation)
 */

/** Maximum file size: 5MB */
export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types */
export const IMAGE_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

/** Comma-separated MIME types for HTML file input `accept` attribute */
export const IMAGE_ACCEPT_STRING = IMAGE_ALLOWED_TYPES.join(",");

/**
 * Validate a file against image upload constraints.
 *
 * @returns Error message string if invalid, null if valid
 */
export function validateImageFile(
  file: { type: string; size: number },
  maxSize: number = IMAGE_MAX_FILE_SIZE,
  allowedTypes: readonly string[] = IMAGE_ALLOWED_TYPES,
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.";
  }
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return `File too large. Maximum size is ${maxMB}MB.`;
  }
  return null;
}
