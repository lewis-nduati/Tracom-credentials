/**
 * Image Upload Hook
 *
 * React Query mutation hook for uploading images to storage.
 * Used by Tiptap editor and cover image forms.
 *
 * @see docs/plans/2026-02-27-feat-tiptap-image-upload-plan.md
 */

import { useMutation } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { parseApiErrorMessage } from "~/lib/api-error-messages";

/**
 * Result from a successful image upload
 */
export interface ImageUploadResult {
  /** Public URL for the uploaded image */
  url: string;
  /** Storage key (for future deletion if needed) */
  key: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the uploaded file */
  contentType: string;
}

/**
 * Hook for uploading images to storage
 *
 * Requires authentication. Returns a React Query mutation.
 *
 * @example
 * ```tsx
 * function ImageUploader() {
 *   const { mutateAsync: upload, isPending, error } = useImageUpload();
 *
 *   const handleFile = async (file: File) => {
 *     try {
 *       const result = await upload(file);
 *       console.log('Uploaded:', result.url);
 *     } catch (err) {
 *       console.error('Upload failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <input
 *       type="file"
 *       accept="image/*"
 *       onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
 *       disabled={isPending}
 *     />
 *   );
 * }
 * ```
 */
export function useImageUpload() {
  const { jwt, isAuthenticated } = useAndamioAuth();

  return useMutation({
    mutationFn: async (file: File): Promise<ImageUploadResult> => {
      // Check authentication
      if (!isAuthenticated || !jwt) {
        throw new Error("You must be signed in to upload images");
      }

      // Build FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to API
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      // Handle errors
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        // Try to parse error code for user-friendly message
        if (data.code) {
          const parsed = parseApiErrorMessage(new Error(data.code));
          if (parsed) {
            throw new Error(parsed.message);
          }
        }

        // Fall back to API error message or generic
        throw new Error(data.error ?? "Upload failed");
      }

      return response.json();
    },
  });
}
