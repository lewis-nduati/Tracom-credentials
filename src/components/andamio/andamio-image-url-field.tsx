"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AndamioInput } from "./andamio-input";
import { AndamioLabel } from "./andamio-label";
import { ImagePlaceholderIcon, UploadIcon, LoadingIcon, CloseIcon } from "~/components/icons";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useImageUpload } from "~/hooks/api/use-image-upload";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { validateImageFile, IMAGE_ACCEPT_STRING } from "~/lib/image-validation";

export interface AndamioImageUrlFieldProps {
  /** Current image URL value */
  value: string;
  /** Callback when URL changes (either typed or from upload) */
  onChange: (url: string) => void;
  /** Input field ID */
  id?: string;
  /** Label text */
  label?: string;
  /** Placeholder text for URL input */
  placeholder?: string;
  /** Alt text for image preview */
  alt?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional class name for the wrapper */
  className?: string;
  /** Aspect ratio for the dropzone/preview (default: "16/9") */
  aspectRatio?: string;
  /** Hint text for recommended dimensions (default: "Best at 16:9") */
  dimensionHint?: string;
}

/**
 * AndamioImageUrlField - Combined image URL input with upload support
 *
 * Features:
 * - Drag-and-drop and click-to-upload dropzone
 * - Aspect ratio preview guide (default 16:9)
 * - File size and format hints
 * - Collapsible URL input for manual entry
 * - Client-side validation before upload
 *
 * The upload dropzone only appears when the user is authenticated.
 * Unauthenticated users see a placeholder with the URL input always visible.
 */
export function AndamioImageUrlField({
  value,
  onChange,
  id = "image-url",
  label = "Image",
  placeholder = "https://...",
  alt = "Image preview",
  disabled = false,
  className,
  aspectRatio = "16/9",
  dimensionHint = "Best at 16:9",
}: AndamioImageUrlFieldProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(() => !!value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const { isAuthenticated } = useAndamioAuth();
  const { mutateAsync, isPending: isUploading } = useImageUpload();

  const canUpload = isAuthenticated;
  const hasImage = value && !imageError;

  /** Upload a file and update the value */
  const handleUpload = useCallback(async (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const result = await mutateAsync(file);
      onChange(result.url);
      setImageError(false);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }, [mutateAsync, onChange]);

  /** Handle file input change */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    void handleUpload(file);
  }, [handleUpload]);

  /** Open the native file picker */
  const openFilePicker = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  // -- Drag-and-drop handlers --

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    if (disabled || isUploading) return;

    // Find the first image file in the drop
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      void handleUpload(imageFile);
    }
  }, [disabled, isUploading, handleUpload]);

  const handleClear = useCallback(() => {
    onChange("");
    setImageError(false);
  }, [onChange]);

  /** Handle keyboard activation on the dropzone */
  const handleDropzoneKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  }, [openFilePicker]);

  /** Handle URL input change (shared between both branches) */
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setImageError(false);
  }, [onChange]);

  /** Shared interactive props for the dropzone area */
  const dropzoneInteractionProps = {
    onClick: openFilePicker,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: handleDropzoneKeyDown,
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <AndamioLabel htmlFor={id}>{label}</AndamioLabel>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Main area: dropzone / preview / placeholder */}
      <div className="relative">
        {hasImage ? (
          /* -- With image: aspect-ratio preview -- */
          <div
            className="relative overflow-hidden rounded-sm border bg-muted/30 cursor-pointer"
            style={{ aspectRatio }}
            aria-label="Replace cover image"
            {...dropzoneInteractionProps}
          >
            <Image
              src={value}
              alt={alt}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-background rounded-md shadow-sm transition-colors"
              aria-label="Clear image"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
            {/* Drag-over overlay */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
                <span className="text-sm font-medium text-primary">Drop to replace</span>
              </div>
            )}
          </div>
        ) : canUpload ? (
          /* -- Empty: dropzone with drag-and-drop -- */
          <div
            className={cn(
              "flex w-full items-center justify-center rounded-sm border-2 border-dashed bg-muted/30 transition-colors cursor-pointer",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/50",
              (disabled || isUploading) && "opacity-50 cursor-not-allowed",
            )}
            style={{ aspectRatio }}
            aria-label="Upload cover image"
            {...dropzoneInteractionProps}
          >
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
              <UploadIcon className="h-6 w-6" />
              <span className="text-xs font-medium">
                {isDragOver ? "Drop to upload" : "Drop image here or click to upload"}
              </span>
              <span className="text-[10px] text-muted-foreground/40">
                PNG, JPG, GIF, WebP · Max 5 MB · {dimensionHint}
              </span>
            </div>
          </div>
        ) : (
          /* -- Unauthenticated: static placeholder -- */
          <div
            className="flex items-center justify-center rounded-sm border border-dashed bg-muted/30"
            style={{ aspectRatio }}
          >
            <ImagePlaceholderIcon className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}

        {/* Upload loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoadingIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* URL input toggle (authenticated) or always-visible (unauthenticated) */}
      {canUpload ? (
        <>
          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className={cn(
              "text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2",
              disabled && "hidden",
            )}
          >
            {showUrlInput ? "Hide" : "Or enter URL manually"}
          </button>
          {showUrlInput && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <AndamioInput
                id={id}
                value={value}
                onChange={handleUrlChange}
                placeholder={placeholder}
                disabled={disabled || isUploading}
              />
            </div>
          )}
        </>
      ) : (
        /* Unauthenticated: URL input always visible */
        <AndamioInput
          id={id}
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
