"use client";

import { useState, useRef } from "react";
import { type Editor } from "@tiptap/core";
import { AndamioToggle } from "~/components/andamio/andamio-toggle";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  UnderlineIcon,
  Maximize2,
  Minimize2,
  Link,
  Unlink,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  RemoveFormatting,
  Table,
  TableCellsMerge,
  TableCellsSplit,
  Rows3,
  Columns3,
  MoreHorizontal,
} from "lucide-react";
import { EditIcon, DeleteIcon, ImagePlaceholderIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * Toolbar configuration presets
 */
export type ToolbarConfig = "minimal" | "basic" | "full" | ToolbarButtons;

/**
 * Individual toolbar button groups that can be enabled/disabled
 */
export interface ToolbarButtons {
  /** Undo/Redo buttons */
  history?: boolean;
  /** H1, H2, H3 buttons */
  headings?: boolean;
  /** Bold, Italic, Underline, Strikethrough, Code */
  formatting?: boolean;
  /** Clear formatting button */
  clearFormatting?: boolean;
  /** Bullet list, Ordered list */
  lists?: boolean;
  /** Blockquote */
  blockquote?: boolean;
  /** Horizontal rule */
  horizontalRule?: boolean;
  /** Text alignment */
  alignment?: boolean;
  /** Link insertion */
  link?: boolean;
  /** Image insertion */
  image?: boolean;
  /** Code block */
  codeBlock?: boolean;
  /** Table insertion and manipulation */
  table?: boolean;
}

/**
 * Preset configurations
 */
const PRESETS: Record<"minimal" | "basic" | "full", ToolbarButtons> = {
  minimal: {
    history: true,
    formatting: true,
  },
  basic: {
    history: true,
    headings: true,
    formatting: true,
    clearFormatting: true,
    lists: true,
    blockquote: true,
  },
  full: {
    history: true,
    headings: true,
    formatting: true,
    clearFormatting: true,
    lists: true,
    blockquote: true,
    horizontalRule: true,
    alignment: true,
    link: true,
    image: true,
    codeBlock: true,
    table: true,
  },
};

interface EditorToolbarProps {
  editor: Editor;
  config?: ToolbarConfig;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

/**
 * ToolbarDivider - Subtle visual separator between button groups
 */
function ToolbarDivider() {
  return <div className="w-px h-6 bg-border/60 mx-1.5 flex-shrink-0" />;
}

/**
 * ToolbarGroup - Wrapper for related buttons
 */
function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 flex-shrink-0">{children}</div>;
}

/**
 * ToolbarButton - Button with tooltip wrapper
 */
function ToolbarButton({
  tooltip,
  shortcut,
  pressed,
  disabled,
  onPressedChange,
  children,
}: {
  tooltip: string;
  shortcut?: string;
  pressed: boolean;
  disabled?: boolean;
  onPressedChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AndamioToggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
          aria-label={tooltip}
          className={cn(
            "h-8 w-8 p-0",
            "hover:bg-accent hover:text-accent-foreground",
            "data-[state=on]:bg-primary/15 data-[state=on]:text-primary",
            "transition-colors duration-150",
          )}
        >
          {children}
        </AndamioToggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <span>{tooltip}</span>
        {shortcut && (
          <kbd className="ml-2 text-[10px] opacity-60 font-mono">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * LinkDialog - Modal for inserting/editing links
 */
function LinkDialog({
  open,
  onOpenChange,
  onSubmit,
  onRemove,
  initialUrl = "",
  selectedText = "",
  isEditing = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  onRemove?: () => void;
  initialUrl?: string;
  selectedText?: string;
  isEditing?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl);

  // Reset URL when dialog opens with new initialUrl
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setUrl(initialUrl);
    } else {
      setUrl("");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl("");
      onOpenChange(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      setUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Link" : "Insert Link"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the URL or remove the link."
              : "Enter the URL you want to link to."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {selectedText && (
              <div className="space-y-2">
                <AndamioLabel className="text-muted-foreground text-xs">
                  Link text
                </AndamioLabel>
                <div className="px-3 py-2 rounded-md bg-muted/50 text-sm font-medium truncate">
                  {selectedText}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <AndamioLabel htmlFor="url">URL</AndamioLabel>
              <AndamioInput
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && onRemove && (
              <AndamioButton
                type="button"
                variant="destructive"
                onClick={handleRemove}
                className="sm:mr-auto"
              >
                Remove Link
              </AndamioButton>
            )}
            <AndamioButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </AndamioButton>
            <AndamioButton type="submit" disabled={!url.trim()}>
              {isEditing ? "Update Link" : "Insert Link"}
            </AndamioButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ImageDialog - Modal for inserting images
 */
function ImageDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Enter the URL of the image you want to insert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <AndamioLabel htmlFor="image-url">Image URL</AndamioLabel>
              <AndamioInput
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <AndamioButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </AndamioButton>
            <AndamioButton type="submit" disabled={!url.trim()}>
              Insert Image
            </AndamioButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * DropdownMenuItem with icon - styled consistently with toolbar buttons
 */
function ToolbarDropdownItem({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        active && "bg-primary/10 text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="text-[10px] opacity-60 font-mono ml-2">{shortcut}</kbd>
      )}
    </DropdownMenuItem>
  );
}

/**
 * EditorToolbar - Configurable toolbar for ContentEditor
 *
 * A beautifully designed toolbar with intuitive groupings,
 * tooltips with keyboard shortcuts, and smooth interactions.
 * Supports three preset configurations or custom button selection.
 *
 * Features responsive design: when space is limited, secondary items
 * collapse into an overflow "More" menu to keep the toolbar on one line.
 */
export function EditorToolbar({
  editor,
  config = "full",
  className,
  isFullscreen = false,
  onToggleFullscreen,
}: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Always use compact mode - full toolbar available in fullscreen mode
  const isCompact = true;

  // Resolve config to buttons
  const buttons: ToolbarButtons =
    typeof config === "string" ? PRESETS[config] : config;

  // Get current link state
  const isOnLink = editor.isActive("link");
  const currentLinkUrl = isOnLink
    ? (editor.getAttributes("link").href as string) || ""
    : "";

  // Get selected text for link dialog
  const getSelectedText = (): string => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  };

  // Handle link insertion/update
  const handleLinkSubmit = (url: string) => {
    editor.chain().focus().setLink({ href: url }).run();
  };

  // Handle link removal
  const handleLinkRemove = () => {
    editor.chain().focus().unsetLink().run();
  };

  // Handle image insertion
  const handleImageSubmit = (url: string) => {
    editor.chain().focus().setImageBlock({ src: url }).run();
  };

  // Handle clear formatting
  const handleClearFormatting = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  // Check if we have any secondary items to show in overflow
  const hasSecondaryItems = buttons.lists || buttons.blockquote ||
    buttons.horizontalRule || buttons.codeBlock || buttons.link || buttons.image || buttons.table;

  // Render primary toolbar items (always visible)
  const renderPrimaryItems = () => (
    <>
      {/* History - Undo/Redo */}
      {buttons.history && (
        <>
          <ToolbarGroup>
            <ToolbarButton
              tooltip="Undo"
              shortcut="⌘Z"
              pressed={false}
              disabled={!editor.can().undo()}
              onPressedChange={() => editor.chain().focus().undo().run()}
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Redo"
              shortcut="⌘⇧Z"
              pressed={false}
              disabled={!editor.can().redo()}
              onPressedChange={() => editor.chain().focus().redo().run()}
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}

      {/* Headings - Always visible */}
      {buttons.headings && (
        <>
          <ToolbarGroup>
            <ToolbarButton
              tooltip="Heading 1"
              shortcut="⌘⌥1"
              pressed={editor.isActive("heading", { level: 1 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Heading 2"
              shortcut="⌘⌥2"
              pressed={editor.isActive("heading", { level: 2 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Heading 3"
              shortcut="⌘⌥3"
              pressed={editor.isActive("heading", { level: 3 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}

      {/* Core formatting - Always visible */}
      {buttons.formatting && (
        <>
          <ToolbarGroup>
            <ToolbarButton
              tooltip="Bold"
              shortcut="⌘B"
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Italic"
              shortcut="⌘I"
              pressed={editor.isActive("italic")}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Underline"
              shortcut="⌘U"
              pressed={editor.isActive("underline")}
              onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            {/* Strikethrough, Code, Clear Formatting move to compact menu when space limited */}
            {!isCompact && (
              <>
                <ToolbarButton
                  tooltip="Strikethrough"
                  shortcut="⌘⇧X"
                  pressed={editor.isActive("strike")}
                  onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                >
                  <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Inline Code"
                  shortcut="⌘E"
                  pressed={editor.isActive("code")}
                  onPressedChange={() => editor.chain().focus().toggleCode().run()}
                >
                  <Code className="h-4 w-4" />
                </ToolbarButton>
                {buttons.clearFormatting && (
                  <ToolbarButton
                    tooltip="Clear Formatting"
                    shortcut="⌘\\"
                    pressed={false}
                    onPressedChange={handleClearFormatting}
                  >
                    <RemoveFormatting className="h-4 w-4" />
                  </ToolbarButton>
                )}
              </>
            )}
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}

      {/* Alignment - Always visible */}
      {buttons.alignment && (
        <>
          <ToolbarGroup>
            <ToolbarButton
              tooltip="Align Left"
              pressed={editor.isActive({ textAlign: "left" })}
              onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Align Center"
              pressed={editor.isActive({ textAlign: "center" })}
              onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Align Right"
              pressed={editor.isActive({ textAlign: "right" })}
              onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              tooltip="Justify"
              pressed={editor.isActive({ textAlign: "justify" })}
              onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}
    </>
  );

  // Render secondary toolbar items (visible when not compact)
  const renderSecondaryItems = () => (
    <>
      {/* Lists and Blocks */}
      {(buttons.lists || buttons.blockquote || buttons.horizontalRule || buttons.codeBlock) && (
        <>
          <ToolbarGroup>
            {buttons.lists && (
              <>
                <ToolbarButton
                  tooltip="Bullet List"
                  shortcut="⌘⇧8"
                  pressed={editor.isActive("bulletList")}
                  onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                >
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Numbered List"
                  shortcut="⌘⇧7"
                  pressed={editor.isActive("orderedList")}
                  onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}
            {buttons.blockquote && (
              <ToolbarButton
                tooltip="Blockquote"
                shortcut="⌘⇧B"
                pressed={editor.isActive("blockquote")}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
            )}
            {buttons.horizontalRule && (
              <ToolbarButton
                tooltip="Horizontal Rule"
                pressed={false}
                onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>
            )}
            {buttons.codeBlock && (
              <ToolbarButton
                tooltip="Code Block"
                shortcut="⌘⌥C"
                pressed={editor.isActive("codeBlock")}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code2 className="h-4 w-4" />
              </ToolbarButton>
            )}
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}

      {/* Link & Image */}
      {(buttons.link || buttons.image) && (
        <>
          <ToolbarGroup>
            {buttons.link && (
              <>
                {isOnLink ? (
                  <>
                    <ToolbarButton
                      tooltip="Edit Link"
                      pressed={false}
                      onPressedChange={() => setLinkDialogOpen(true)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      tooltip="Remove Link"
                      pressed={false}
                      onPressedChange={handleLinkRemove}
                    >
                      <Unlink className="h-4 w-4" />
                    </ToolbarButton>
                  </>
                ) : (
                  <ToolbarButton
                    tooltip="Insert Link"
                    shortcut="⌘K"
                    pressed={false}
                    onPressedChange={() => setLinkDialogOpen(true)}
                  >
                    <Link className="h-4 w-4" />
                  </ToolbarButton>
                )}
              </>
            )}
            {buttons.image && (
              <ToolbarButton
                tooltip="Insert Image"
                pressed={false}
                onPressedChange={() => setImageDialogOpen(true)}
              >
                <ImagePlaceholderIcon className="h-4 w-4" />
              </ToolbarButton>
            )}
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}

      {/* Table */}
      {buttons.table && (
        <ToolbarGroup>
          <ToolbarButton
            tooltip="Insert Table"
            pressed={false}
            onPressedChange={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table className="h-4 w-4" />
          </ToolbarButton>
          {editor.isActive("table") && (
            <>
              <ToolbarButton
                tooltip="Add Column"
                pressed={false}
                onPressedChange={() =>
                  editor.chain().focus().addColumnAfter().run()
                }
              >
                <Columns3 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                tooltip="Add Row"
                pressed={false}
                onPressedChange={() =>
                  editor.chain().focus().addRowAfter().run()
                }
              >
                <Rows3 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                tooltip="Merge Cells"
                pressed={false}
                disabled={!editor.can().mergeCells()}
                onPressedChange={() =>
                  editor.chain().focus().mergeCells().run()
                }
              >
                <TableCellsMerge className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                tooltip="Split Cell"
                pressed={false}
                disabled={!editor.can().splitCell()}
                onPressedChange={() =>
                  editor.chain().focus().splitCell().run()
                }
              >
                <TableCellsSplit className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                tooltip="Delete Table"
                pressed={false}
                onPressedChange={() =>
                  editor.chain().focus().deleteTable().run()
                }
              >
                <DeleteIcon className="h-4 w-4" />
              </ToolbarButton>
            </>
          )}
        </ToolbarGroup>
      )}
    </>
  );

  // Render overflow dropdown menu content
  const renderOverflowMenu = () => (
    <DropdownMenuContent align="end" className="w-56">
      {/* Formatting extras when compact */}
      {buttons.formatting && (
        <>
          <ToolbarDropdownItem
            icon={Strikethrough}
            label="Strikethrough"
            shortcut="⌘⇧X"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarDropdownItem
            icon={Code}
            label="Inline Code"
            shortcut="⌘E"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
          {buttons.clearFormatting && (
            <ToolbarDropdownItem
              icon={RemoveFormatting}
              label="Clear Formatting"
              shortcut="⌘\\"
              onClick={handleClearFormatting}
            />
          )}
          <DropdownMenuSeparator />
        </>
      )}

      {/* Lists */}
      {buttons.lists && (
        <>
          <ToolbarDropdownItem
            icon={List}
            label="Bullet List"
            shortcut="⌘⇧8"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarDropdownItem
            icon={ListOrdered}
            label="Numbered List"
            shortcut="⌘⇧7"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </>
      )}

      {/* Blockquote */}
      {buttons.blockquote && (
        <ToolbarDropdownItem
          icon={Quote}
          label="Blockquote"
          shortcut="⌘⇧B"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
      )}

      {/* Horizontal Rule */}
      {buttons.horizontalRule && (
        <ToolbarDropdownItem
          icon={Minus}
          label="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      )}

      {/* Code Block */}
      {buttons.codeBlock && (
        <ToolbarDropdownItem
          icon={Code2}
          label="Code Block"
          shortcut="⌘⌥C"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      )}

      {(buttons.lists || buttons.blockquote || buttons.horizontalRule || buttons.codeBlock) &&
       (buttons.link || buttons.image || buttons.table) && (
        <DropdownMenuSeparator />
      )}

      {/* Link */}
      {buttons.link && (
        <>
          {isOnLink ? (
            <>
              <ToolbarDropdownItem
                icon={EditIcon}
                label="Edit Link"
                onClick={() => setLinkDialogOpen(true)}
              />
              <ToolbarDropdownItem
                icon={Unlink}
                label="Remove Link"
                onClick={handleLinkRemove}
              />
            </>
          ) : (
            <ToolbarDropdownItem
              icon={Link}
              label="Insert Link"
              shortcut="⌘K"
              onClick={() => setLinkDialogOpen(true)}
            />
          )}
        </>
      )}

      {/* Image */}
      {buttons.image && (
        <ToolbarDropdownItem
          icon={ImagePlaceholderIcon}
          label="Insert Image"
          onClick={() => setImageDialogOpen(true)}
        />
      )}

      {(buttons.link || buttons.image) && buttons.table && (
        <DropdownMenuSeparator />
      )}

      {/* Table */}
      {buttons.table && (
        <>
          <ToolbarDropdownItem
            icon={Table}
            label="Insert Table"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          />
          {editor.isActive("table") && (
            <>
              <ToolbarDropdownItem
                icon={Columns3}
                label="Add Column"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              />
              <ToolbarDropdownItem
                icon={Rows3}
                label="Add Row"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              />
              <ToolbarDropdownItem
                icon={TableCellsMerge}
                label="Merge Cells"
                disabled={!editor.can().mergeCells()}
                onClick={() => editor.chain().focus().mergeCells().run()}
              />
              <ToolbarDropdownItem
                icon={TableCellsSplit}
                label="Split Cell"
                disabled={!editor.can().splitCell()}
                onClick={() => editor.chain().focus().splitCell().run()}
              />
              <ToolbarDropdownItem
                icon={DeleteIcon}
                label="Delete Table"
                onClick={() => editor.chain().focus().deleteTable().run()}
              />
            </>
          )}
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <TooltipProvider delayDuration={300}>
      {/* Toolbar container - strictly constrained to parent width */}
      <div
        ref={toolbarRef}
        style={{ maxWidth: '100%', width: '100%' }}
        className={cn(
          "flex items-center gap-0.5",
          "rounded-sm border border-border/80 bg-muted/30 p-1.5",
          "shadow-sm overflow-hidden",
          "box-border",
          className,
        )}
      >
        {/* Primary items - always visible */}
        {renderPrimaryItems()}

        {/* Secondary items - visible when not compact */}
        {!isCompact && renderSecondaryItems()}

        {/* Overflow menu - visible when compact */}
        {isCompact && hasSecondaryItems && (
          <>
            <ToolbarDivider />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AndamioButton
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-150",
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </AndamioButton>
              </DropdownMenuTrigger>
              {renderOverflowMenu()}
            </DropdownMenu>
          </>
        )}

        {/* Full-screen toggle - always at the end */}
        {onToggleFullscreen && (
          <>
            <div className="flex-1 min-w-2" /> {/* Spacer to push fullscreen to the right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <AndamioToggle
                  size="sm"
                  pressed={isFullscreen}
                  onPressedChange={onToggleFullscreen}
                  aria-label={isFullscreen ? "Exit focus mode" : "Enter focus mode"}
                  className={cn(
                    "h-8 px-3 gap-1.5 shrink-0",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[state=on]:bg-primary/15 data-[state=on]:text-primary",
                    "transition-colors duration-150",
                  )}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium hidden sm:inline">
                    {isFullscreen ? "Exit" : "Focus"}
                  </span>
                </AndamioToggle>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                {isFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
                <kbd className="ml-2 text-[10px] opacity-60 font-mono">Esc</kbd>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Dialogs */}
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSubmit={handleLinkSubmit}
        onRemove={handleLinkRemove}
        initialUrl={currentLinkUrl}
        selectedText={getSelectedText()}
        isEditing={isOnLink}
      />
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSubmit={handleImageSubmit}
      />
    </TooltipProvider>
  );
}

export default EditorToolbar;
