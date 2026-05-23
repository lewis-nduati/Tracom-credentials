"use client";

import { cn } from "~/lib/utils";
import { type Node } from "@tiptap/pm/model";
import {
  type Editor,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  AndamioToggleGroup,
  AndamioToggleGroupItem,
} from "~/components/andamio";

// Size presets for image resize
const SIZE_PRESETS = {
  small: "300",
  medium: "600",
  large: "900",
} as const;

type SizePreset = keyof typeof SIZE_PRESETS;

interface ImageBlockViewProps extends NodeViewProps {
  editor: Editor;
  getPos: () => number | undefined;
  node: Node & {
    attrs: Partial<{
      src: string;
      width: string;
      height: string;
      align: string;
      alt: string;
    }>;
  };
  updateAttributes: (attrs: Record<string, string>) => void;
}

export const ImageBlockView = (props: ImageBlockViewProps) => {
  const { editor, getPos, node, updateAttributes } = props;
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);

  const src = node.attrs.src ?? "";
  const width = parseInt(node.attrs.width ?? "600");
  const height = parseInt(node.attrs.height ?? "600");
  const alt = node.attrs.alt ?? "";

  // Determine current size preset from width
  const currentSize: SizePreset =
    (Object.entries(SIZE_PRESETS).find(
      ([, w]) => w === String(width)
    )?.[0] as SizePreset) ?? "medium";

  const wrapperClassName = cn(
    node.attrs.align === "left" ? "ml-0" : "ml-auto",
    node.attrs.align === "right" ? "mr-0" : "mr-auto",
    node.attrs.align === "center" && "mx-auto",
  );

  const onClick = useCallback(() => {
    const pos = getPos();
    if (pos !== undefined) {
      editor.commands.setNodeSelection(pos);
    }
  }, [getPos, editor.commands]);

  const handleSizeChange = useCallback(
    (size: string) => {
      const newWidth = SIZE_PRESETS[size as SizePreset];
      if (newWidth) {
        updateAttributes({ width: newWidth, height: newWidth });
      }
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper>
      <div
        className={cn("relative", wrapperClassName)}
        style={{ width: `${width}px` }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div contentEditable={false} ref={imageWrapperRef}>
          {src ? (
            <Image
              width={width}
              height={height}
              className="block rounded-lg shadow-lg"
              src={src}
              alt={alt}
              onClick={onClick}
            />
          ) : (
            <div
              className="bg-muted rounded-lg shadow-lg flex items-center justify-center text-muted-foreground"
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              No image source
            </div>
          )}

          {/* Size controls - show on hover when editable */}
          {showControls && editor.isEditable && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-md p-1 shadow-md border">
              <AndamioToggleGroup
                type="single"
                value={currentSize}
                onValueChange={handleSizeChange}
                size="sm"
              >
                <AndamioToggleGroupItem
                  value="small"
                  aria-label="Small size"
                  className="px-2 text-xs"
                >
                  S
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem
                  value="medium"
                  aria-label="Medium size"
                  className="px-2 text-xs"
                >
                  M
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem
                  value="large"
                  aria-label="Large size"
                  className="px-2 text-xs"
                >
                  L
                </AndamioToggleGroupItem>
              </AndamioToggleGroup>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default ImageBlockView;
