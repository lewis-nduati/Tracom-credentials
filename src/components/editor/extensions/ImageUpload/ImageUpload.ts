/**
 * ImageUpload Tiptap Extension
 *
 * Handles image paste and drag-drop events in the editor.
 * Validates files, triggers upload callback, and inserts imageBlock nodes.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { IMAGE_MAX_FILE_SIZE, IMAGE_ALLOWED_TYPES, validateImageFile } from "~/lib/image-validation";

/**
 * Options for the ImageUpload extension
 */
export interface ImageUploadOptions {
  /**
   * Callback to upload a file and return its public URL.
   * Must return a Promise that resolves to the image URL.
   */
  onUpload: (file: File) => Promise<string>;

  /** Called when upload starts (for loading indicator) */
  onUploadStart?: () => void;

  /** Called when upload ends (success or failure) */
  onUploadEnd?: () => void;

  /** Called when upload fails or validation fails */
  onUploadError?: (error: Error) => void;

  /** Allowed MIME types (default: image/png, image/jpeg, image/gif, image/webp) */
  allowedTypes?: string[];

  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
}

/**
 * ImageUpload Extension
 *
 * Intercepts paste and drop events to handle image uploads.
 * When an image is pasted or dropped:
 * 1. Validates file type and size
 * 2. Calls onUploadStart
 * 3. Calls onUpload with the file
 * 4. Inserts imageBlock with the returned URL
 * 5. Calls onUploadEnd (or onUploadError on failure)
 *
 * @example
 * ```tsx
 * import { ImageUpload } from './extensions/ImageUpload';
 *
 * const editor = useEditor({
 *   extensions: [
 *     // ... other extensions
 *     ImageUpload.configure({
 *       onUpload: async (file) => {
 *         const result = await uploadMutation.mutateAsync(file);
 *         return result.url;
 *       },
 *       onUploadStart: () => setIsUploading(true),
 *       onUploadEnd: () => setIsUploading(false),
 *       onUploadError: (error) => toast.error(error.message),
 *     }),
 *   ],
 * });
 * ```
 */
export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: "imageUpload",

  addOptions() {
    return {
      onUpload: async () => "",
      onUploadStart: undefined,
      onUploadEnd: undefined,
      onUploadError: undefined,
      allowedTypes: [...IMAGE_ALLOWED_TYPES],
      maxSize: IMAGE_MAX_FILE_SIZE,
    };
  },

  addProseMirrorPlugins() {
    const {
      onUpload,
      onUploadStart,
      onUploadEnd,
      onUploadError,
      allowedTypes,
      maxSize,
    } = this.options;
    const editor = this.editor;

    /** Validate a file against type and size constraints */
    const validateFile = (file: File): string | null =>
      validateImageFile(file, maxSize, allowedTypes);

    /**
     * Handle file upload and insert image into editor
     */
    const handleUpload = async (file: File) => {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(new Error(validationError));
        return;
      }

      // Start upload
      onUploadStart?.();

      try {
        // Upload and get URL
        const url = await onUpload(file);

        // Insert image at current cursor position
        editor.chain().focus().setImageBlock({ src: url }).run();
      } catch (err) {
        // Handle upload error
        onUploadError?.(err instanceof Error ? err : new Error("Upload failed"));
      } finally {
        // Always call onUploadEnd
        onUploadEnd?.();
      }
    };

    return [
      new Plugin({
        key: new PluginKey("imageUpload"),
        props: {
          /**
           * Handle paste events
           * Intercepts image data from clipboard
           */
          handlePaste(view, event) {
            // Get clipboard items
            const items = Array.from(event.clipboardData?.items ?? []);

            // Find an image item
            const imageItem = items.find((item) =>
              item.type.startsWith("image/")
            );

            // If no image, let default paste handling continue
            if (!imageItem) {
              return false;
            }

            // Prevent default paste behavior
            event.preventDefault();

            // Get file from clipboard item
            const file = imageItem.getAsFile();
            if (file) {
              // Handle the upload
              void handleUpload(file);
            }

            // Return true to indicate we handled the event
            return true;
          },

          /**
           * Handle drop events
           * Intercepts image files dropped onto the editor
           */
          handleDrop(view, event) {
            // Get dropped files
            const files = Array.from(event.dataTransfer?.files ?? []);

            // Find an image file
            const imageFile = files.find((file) =>
              file.type.startsWith("image/")
            );

            // If no image, let default drop handling continue
            if (!imageFile) {
              return false;
            }

            // Prevent default drop behavior
            event.preventDefault();

            // Handle the upload
            void handleUpload(imageFile);

            // Return true to indicate we handled the event
            return true;
          },
        },
      }),
    ];
  },
});
