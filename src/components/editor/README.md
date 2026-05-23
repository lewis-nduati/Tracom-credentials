# Andamio Editor Components

A robust, extensible Tiptap-based rich text editor system with exactly **two primary components**:

1. **ContentEditor** - For editing content
2. **ContentViewer** - For viewing content

## Design Philosophy

The Andamio Editor is designed to feel **uniquely beautiful and effective**. When editing content on Andamio, users should feel good—the experience is simple and streamlined yet feature-rich. This editor is a key reason people trust Andamio.

### Visual Design Principles

- **Elegant Focus States**: Primary color ring with subtle shadow when focused
- **Smooth Transitions**: 200ms transitions on all interactive elements
- **Professional Typography**: Carefully tuned prose classes for readability
- **Consistent Iconography**: Lucide icons throughout for visual harmony
- **Adaptive Dark Mode**: Full support for light and dark themes
- **Loading Elegance**: Animated skeleton loaders that feel polished

## Features Overview

### Editor Features (ContentEditor)

| Feature | Description | Status |
|---------|-------------|--------|
| **Rich Text Editing** | Bold, italic, underline, strikethrough, inline code | ✅ Included |
| **Headings** | H1, H2, H3 with keyboard shortcuts | ✅ Included |
| **Lists** | Bullet lists, ordered lists, nested lists | ✅ Included |
| **Blockquotes** | Styled quote blocks with left border | ✅ Included |
| **Code Blocks** | Syntax highlighting via lowlight | ✅ Included |
| **Links** | Insert/edit/remove links with URL validation | ✅ Included |
| **Images** | Block-level images with alignment options | ✅ Included |
| **Image Upload** | Paste (Ctrl/Cmd+V) or drag-drop images directly | ✅ Included |
| **Text Alignment** | Left, center, right, justify | ✅ Included |
| **Text Color** | Color picker for text styling | ✅ Included |
| **Markdown Paste** | Paste markdown and auto-convert to rich text | ✅ Included |
| **Focus Mode** | Immersive full-screen editing experience | ✅ Included |
| **Word/Character Count** | Real-time statistics in footer | ✅ Included |
| **Auto-save Ready** | `onContentChange` callback for easy auto-save | ✅ Included |
| **Keyboard Shortcuts** | Standard shortcuts for all formatting | ✅ Included |
| **Undo/Redo** | Full history management | ✅ Included |

### Toolbar Features

| Button Group | Buttons | Preset Availability |
|--------------|---------|---------------------|
| **History** | Undo, Redo | minimal, basic, full |
| **Headings** | H1, H2, H3 | basic, full |
| **Formatting** | Bold, Italic, Underline, Strikethrough, Code | minimal, basic, full |
| **Alignment** | Left, Center, Right, Justify | full |
| **Lists** | Bullet List, Ordered List | basic, full |
| **Blockquote** | Quote block | basic, full |
| **Code Block** | Syntax-highlighted code | full |
| **Link** | Insert/remove link | full |
| **Image** | Insert image by URL or upload | full |
| **Focus Mode** | Full-screen toggle | all (when enabled) |

### Viewer Features (ContentViewer)

| Feature | Description | Status |
|---------|-------------|--------|
| **Format Flexibility** | Handles JSON, HTML, stringified JSON | ✅ Included |
| **Size Variants** | sm, default, lg text sizes | ✅ Included |
| **Auto Doc Wrapper** | Automatically wraps content in doc structure | ✅ Included |
| **Clickable Links** | Links open in new tab | ✅ Included |
| **Code Highlighting** | Syntax highlighting matches editor | ✅ Included |
| **Loading States** | Elegant skeleton animation | ✅ Included |
| **Empty States** | Customizable empty content display | ✅ Included |
| **Hydration Safe** | Proper SSR handling | ✅ Included |

## Quick Start

```tsx
import { ContentEditor, ContentViewer } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";

// For editing
const [content, setContent] = useState<JSONContent | null>(null);

<ContentEditor
  content={content}
  onContentChange={setContent}
  placeholder="Start writing..."
/>

// For viewing
<ContentViewer content={content} />
```

## Components

### ContentEditor

A self-contained rich text editor with built-in toolbar, fullscreen mode, and word count.

```tsx
interface ContentEditorProps {
  // Content
  content?: JSONContent | string | null;
  onContentChange?: (content: JSONContent) => void;
  onUpdate?: (editor: Editor) => void;
  onEditorReady?: (editor: Editor) => void;

  // Display
  placeholder?: string;           // Default: "Start writing..."
  minHeight?: string;             // Default: "300px"
  maxHeight?: string;             // For scrollable content
  className?: string;

  // Features
  showToolbar?: boolean;          // Default: true
  toolbarConfig?: ToolbarConfig;  // Default: "full"
  enableFullscreen?: boolean;     // Default: true
  showWordCount?: boolean;        // Default: false
  showCharacterCount?: boolean;   // Default: false

  // State
  disabled?: boolean;             // Default: false
  autoFocus?: boolean;            // Default: false

  // Extras
  footer?: React.ReactNode;       // Custom footer content
}
```

**Usage Examples:**

```tsx
// Basic usage
<ContentEditor
  content={lesson.content_json}
  onContentChange={(json) => setContent(json)}
/>

// Full-featured
<ContentEditor
  content={content}
  onContentChange={handleContentChange}
  placeholder="Write your lesson here..."
  minHeight="500px"
  showWordCount
  showCharacterCount
  footer={<SaveButton onClick={handleSave} />}
/>

// Minimal (no toolbar or fullscreen)
<ContentEditor
  content={content}
  onContentChange={handleContentChange}
  showToolbar={false}
  enableFullscreen={false}
/>
```

### ContentViewer

A read-only display component for Tiptap content.

```tsx
interface ContentViewerProps {
  content: JSONContent | string | null | undefined;
  size?: "sm" | "default" | "lg";
  className?: string;
  withBackground?: boolean;       // Default: false
  withPadding?: boolean;          // Default: true
  loadingContent?: React.ReactNode;
  emptyContent?: React.ReactNode;
}
```

**Usage Examples:**

```tsx
// Basic usage
<ContentViewer content={lesson.content_json} />

// With size variant
<ContentViewer content={content} size="lg" />

// With custom empty state
<ContentViewer
  content={content}
  emptyContent={<p>No content available</p>}
/>

// Compact (no padding/background)
<ContentViewerCompact content={content} />
```

**Convenience Variants:**
- `ContentViewerSm` - Small text size
- `ContentViewerLg` - Large text size
- `ContentViewerCompact` - No padding or background

## Toolbar Configuration

The toolbar supports three presets or custom configuration:

```tsx
// Presets
toolbarConfig="minimal"  // Undo/Redo + formatting
toolbarConfig="basic"    // + headings, lists, blockquote
toolbarConfig="full"     // + alignment, link, image, code block

// Custom configuration
toolbarConfig={{
  history: true,      // Undo/Redo
  headings: true,     // H1, H2, H3
  formatting: true,   // Bold, Italic, Underline, Strikethrough, Code
  lists: true,        // Bullet list, Ordered list
  blockquote: true,   // Blockquote
  alignment: true,    // Left, Center, Right, Justify
  link: true,         // Insert/remove link
  image: true,        // Insert image
  codeBlock: true,    // Code block
}}
```

## Editor Capabilities

### Text Formatting
- **Bold** (`Ctrl/Cmd + B`)
- **Italic** (`Ctrl/Cmd + I`)
- **Underline** (`Ctrl/Cmd + U`)
- **Strikethrough**
- **Inline code**
- **Text color** (via extension)

### Headings
- H1, H2, H3, H4, H5, H6

### Text Alignment
- Left, Center, Right, Justify

### Lists
- Bullet lists
- Ordered lists
- Nested lists supported

### Block Elements
- Blockquotes
- Code blocks with syntax highlighting (via lowlight)
- Images with alignment (left, center, right)

### Links
- Auto-linking (URLs automatically become links)
- Manual link insertion
- Links open in new tab (in viewer mode)

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Bold | `Ctrl/Cmd + B` |
| Italic | `Ctrl/Cmd + I` |
| Underline | `Ctrl/Cmd + U` |
| Strikethrough | `Ctrl/Cmd + Shift + X` |
| Code | `Ctrl/Cmd + E` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Bullet List | `Ctrl/Cmd + Shift + 8` |
| Ordered List | `Ctrl/Cmd + Shift + 7` |
| Blockquote | `Ctrl/Cmd + Shift + B` |
| Code Block | `Ctrl/Cmd + Alt + C` |

## Image Upload

The editor supports direct image upload via paste (Ctrl/Cmd+V) and drag-drop. Images are uploaded to Google Cloud Storage and inserted as `imageBlock` nodes.

### Requirements

- User must be authenticated (signed in)
- Storage must be configured (see Environment Variables below)
- Supported formats: PNG, JPEG, GIF, WebP
- Maximum file size: 5MB

### How It Works

1. **Paste**: Copy an image (screenshot, file, from web) and press Ctrl/Cmd+V in the editor
2. **Drag-drop**: Drag an image file from your file manager onto the editor
3. The image uploads automatically with a loading overlay
4. Once complete, the image appears at cursor position

### Environment Variables

```bash
# Required for image upload
STORAGE_PROVIDER=gcs
STORAGE_BUCKET=your-bucket-name
GCS_PROJECT_ID=your-gcp-project

# Optional - uses ADC (Application Default Credentials) if not provided
# ADC is automatic on Cloud Run, GCE, and other GCP environments
GCS_CLIENT_EMAIL=storage@your-project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional
STORAGE_FOLDER=uploads  # Default folder for uploads
```

### Error Handling

| Scenario | User Message |
|----------|--------------|
| Not signed in | "You must be signed in to upload images" |
| Invalid file type | "Only PNG, JPEG, GIF, and WebP images are supported" |
| File too large | "Image is too large. Maximum size is 5MB" |
| Upload failed | "Failed to upload image. Please try again." |
| Storage not configured | "Image upload is not available" |

### Security

- Files are stored with UUID-based names (user-provided filenames are ignored)
- Authentication is required for all uploads
- Files are validated server-side before storage
- Public read access is controlled at the bucket level

## Markdown Support

The editor supports Markdown input via paste and copy:

### Supported Markdown Syntax

| Element | Markdown | Result |
|---------|----------|--------|
| Heading 1 | `# Text` | H1 heading |
| Heading 2 | `## Text` | H2 heading |
| Heading 3 | `### Text` | H3 heading |
| Bold | `**text**` or `__text__` | **bold** |
| Italic | `*text*` or `_text_` | *italic* |
| Strikethrough | `~~text~~` | ~~strikethrough~~ |
| Code | `` `code` `` | `inline code` |
| Link | `[text](url)` | clickable link |
| Image | `![alt](url)` | image block |
| Bullet List | `- item` or `* item` | bullet list |
| Ordered List | `1. item` | numbered list |
| Blockquote | `> text` | blockquote |
| Code Block | ` ```lang ` | syntax-highlighted code |
| Horizontal Rule | `---` or `***` | horizontal line |

### Markdown Paste Behavior

When you paste content from any source (VS Code, Obsidian, Notion, Slack,
GitHub, a terminal `cat README.md`, etc.), the editor auto-detects whether
the `text/plain` payload is Markdown and routes it through
`markdownToTipTap()`:

1. Markdown is converted to structured rich text — headings, lists, code
   blocks with syntax highlighting, GFM tables, blockquotes, links.
2. Pastes that don't look like Markdown fall through to the default HTML
   paste pipeline, preserving web-page fidelity.
3. Pasting inside a code block is verbatim — Markdown syntax stays as
   literal source.
4. Image / file paste continues to be handled by the `ImageUpload`
   extension (Markdown paste explicitly bails on file clipboards).

Detection is provided by the `MarkdownPaste` extension
(`src/components/editor/extensions/MarkdownPaste/`). See
[`docs/solutions/features/tiptap-markdown-paste.md`](../../../docs/solutions/features/tiptap-markdown-paste.md)
for the design rationale and the asymmetric heuristic (strict when HTML is
present, permissive when it isn't).

### HTML Support

The editor also accepts HTML input:
- Pasted HTML is converted to Tiptap nodes
- HTML can be used as initial content
- Export to HTML is available via `editor.getHTML()`

## Content Format

Content is stored as Tiptap JSONContent:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Hello World" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "bold" },
        { "type": "text", "text": " text." }
      ]
    }
  ]
}
```

The ContentViewer automatically handles:
- JSONContent objects
- Stringified JSON
- HTML strings
- Missing `doc` wrapper (auto-wraps)

## Hook: useContentEditor

For advanced use cases where you need direct editor access:

```tsx
import { useContentEditor } from "~/components/editor";

function MyComponent() {
  const {
    editor,
    getContent,
    setContent,
    getHTML,
    getText,
    isEmpty,
    focus,
    clear,
  } = useContentEditor({
    content: initialContent,
    onContentChange: handleChange,
  });

  const handleSave = () => {
    const json = getContent();
    const html = getHTML();
    const text = getText();
    // Save content...
  };

  return (
    <>
      {editor && <EditorContent editor={editor} />}
      <button onClick={handleSave}>Save</button>
    </>
  );
}
```

## Extension Architecture

Both ContentEditor and ContentViewer use a shared extension configuration to ensure content renders identically:

```
SharedExtensionKit
├── StarterKit (core Tiptap functionality)
├── Markdown (copy-out-as-markdown via transformCopiedText)
├── Underline
├── TextStyle + Color
├── TextAlign
├── Link (openOnClick differs by mode)
├── BulletList + OrderedList + ListItem
├── ImageBlock (custom block-level images)
├── CodeBlockLowlight (syntax highlighting)
├── Table suite (Table, TableRow, TableCell, TableHeader)
├── ImageUpload (editing mode only — paste/drop file uploads)
└── MarkdownPaste (editing mode only — auto-detect markdown on paste)
```

### Custom Extensions

**ImageBlock** - Block-level images with:
- Alignment (left, center, right)
- Width/height attributes
- Alt text
- React NodeView rendering

**ImageUpload** - Paste/drop image file handler. Intercepts file clipboards
and dropped images, uploads via `onUpload` callback, inserts as `imageBlock`.

**MarkdownPaste** - Paste-time markdown auto-detection and conversion.
Hooks `handlePaste` (unlike `tiptap-markdown`'s `transformPastedText` which
only hooks `clipboardTextParser` and silently misses the common case), runs
a strong/weak-signal heuristic on `text/plain`, and routes detected
markdown through `markdownToTiptap()`. Falls through to default HTML paste
for non-markdown content. Skips verbatim inside code blocks and when
`ImageUpload` owns the clipboard.

## Styling

The editor uses semantic CSS classes from `globals.css`:

- `text-primary` - Links
- `bg-muted` / `text-muted-foreground` - Code blocks
- `border-border` - Editor border
- `bg-background` - Editor background
- `ring-ring` - Focus ring

All styles respect light/dark mode automatically.

## Migration from Legacy Components

If you're migrating from the old pattern:

### Before (Old Pattern)
```tsx
import {
  useAndamioEditor,
  ContentEditor,
  AndamioFixedToolbar,
} from "~/components/editor";
import { useFullscreenEditor } from "~/components/editor/hooks/use-fullscreen-editor";
import { FullscreenEditorWrapper } from "~/components/editor/components/FullscreenEditorWrapper";

const editor = useAndamioEditor({ content: data });
const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreenEditor();

// Editing
<FullscreenEditorWrapper isFullscreen={isFullscreen} onExitFullscreen={exitFullscreen} editor={editor}>
  <AndamioFixedToolbar editor={editor} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
  <ContentEditor editor={editor} height="500px" isFullscreen={isFullscreen} />
</FullscreenEditorWrapper>

// Saving
const json = editor?.getJSON();
```

### After (New Pattern)
```tsx
import { ContentEditor, ContentViewer } from "~/components/editor";

const [contentJson, setContentJson] = useState<JSONContent | null>(data.content_json);

// Editing
<ContentEditor
  content={contentJson}
  onContentChange={setContentJson}
  minHeight="500px"
  showWordCount
/>

// Viewing
<ContentViewer content={contentJson} />

// Saving
// Just use contentJson directly - it's already in state
```

## File Structure

```
src/components/editor/
├── index.ts                          # Main exports
├── README.md                         # This documentation
├── components/
│   ├── ContentEditor/
│   │   ├── index.tsx                 # Main editor component
│   │   └── EditorToolbar.tsx         # Toolbar component
│   ├── ContentViewer/
│   │   └── index.tsx                 # Viewer component
│   ├── FullscreenEditorWrapper/      # [DEPRECATED - built into ContentEditor]
│   └── menus/
│       ├── AndamioFixedToolbar/      # [DEPRECATED - use EditorToolbar]
│       └── AndamioBubbleMenus/       # [DEPRECATED]
├── extension-kits/
│   ├── index.ts
│   ├── shared.ts                     # NEW: Unified extension config
│   ├── base.ts                       # [DEPRECATED]
│   ├── basic.ts                      # [DEPRECATED]
│   ├── full.ts                       # [DEPRECATED]
│   └── read-only.ts                  # [DEPRECATED]
├── extensions/
│   ├── Image/
│   │   └── Image.ts
│   ├── ImageBlock/
│   │   ├── ImageBlock.ts
│   │   └── components/
│   │       └── ImageBlockView.tsx
│   └── ImageUpload/
│       └── ImageUpload.ts              # Paste/drop upload extension
├── hooks/
│   ├── index.ts
│   ├── use-andamio-editor.ts         # [DEPRECATED - use useContentEditor]
│   └── use-fullscreen-editor.ts      # [DEPRECATED - built into ContentEditor]
└── utils/
    └── index.ts                      # Utility functions
```

## Best Practices

1. **Always use ContentEditor for editing** - Don't try to make ContentViewer editable
2. **Store content in React state** - Use `onContentChange` to capture changes
3. **Use ContentViewer for display** - It handles all content formats automatically
4. **Leverage built-in features** - Toolbar, fullscreen, and word count are all built-in
5. **Use toolbar presets** - Start with "full" and customize if needed
6. **Handle empty content gracefully** - Use `emptyContent` prop in ContentViewer

## Dependencies

- `@tiptap/core` - Core Tiptap library
- `@tiptap/react` - React bindings
- `@tiptap/starter-kit` - Essential extensions
- `@tiptap/extension-*` - Individual extensions
- `tiptap-markdown` - Markdown support
- `lowlight` - Syntax highlighting for code blocks

---

## Roadmap: Recommended Future Extensions

The following features and Tiptap extensions are recommended for future implementation to enhance the Andamio Editor experience.

### High Priority Recommendations

#### 1. Tables (`@tiptap/extension-table`)
**Why**: Essential for course content, comparison charts, and structured data presentation.

```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
```

**Features to add**:
- Insert table with row/column count
- Add/remove rows and columns
- Merge/split cells
- Table header styling
- Responsive table display

#### 2. Task Lists / Checkboxes (`@tiptap/extension-task-list`)
**Why**: Perfect for assignment requirements, learning objectives, and to-do items.

```bash
npm install @tiptap/extension-task-list @tiptap/extension-task-item
```

**Features to add**:
- Interactive checkboxes
- Progress tracking visualization
- Nested task lists

#### 3. ~~File Uploads / Drag & Drop Images~~ ✅ IMPLEMENTED
**Status**: Completed in PR #XXX (2026-02-27)

See [Image Upload](#image-upload) section above for usage and configuration.

#### 4. Bubble Menu for Text Selection
**Why**: Contextual formatting toolbar that appears on text selection—more intuitive than fixed toolbar.

```bash
# Already available in @tiptap/react
import { BubbleMenu } from '@tiptap/react';
```

**Features to add**:
- Quick formatting (bold, italic, link)
- Appears on text selection
- Smart positioning

### Medium Priority Recommendations

#### 5. Highlight / Text Background Color (`@tiptap/extension-highlight`)
**Why**: Useful for emphasizing key terms, definitions, and important concepts.

```bash
npm install @tiptap/extension-highlight
```

#### 6. Subscript & Superscript
**Why**: Essential for mathematical notation, chemical formulas, and footnotes.

```bash
npm install @tiptap/extension-subscript @tiptap/extension-superscript
```

#### 7. Placeholder Extension Improvements
**Why**: Show different placeholders for different block types (e.g., "Add a heading..." for H1).

```bash
npm install @tiptap/extension-placeholder
```

#### 8. Typography Smart Quotes (`@tiptap/extension-typography`)
**Why**: Auto-converts straight quotes to curly quotes, -- to em-dash, etc.

```bash
npm install @tiptap/extension-typography
```

#### 9. Character Count with Limit (`@tiptap/extension-character-count`)
**Why**: Enforce content length limits for assignments, descriptions, etc.

```bash
npm install @tiptap/extension-character-count
```

### Nice-to-Have Recommendations

#### 10. Collaboration / Real-time Editing
**Why**: Multiple users editing the same document simultaneously.

```bash
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor yjs y-websocket
```

**Complexity**: High - requires WebSocket server setup.

#### 11. Mention / @-references (`@tiptap/extension-mention`)
**Why**: Reference other users, courses, or resources inline.

```bash
npm install @tiptap/extension-mention
```

#### 12. Emoji Picker
**Why**: Easy emoji insertion for more expressive content.

**Options**:
- `@tiptap-pro/extension-emoji` (Pro, paid)
- Custom implementation with emoji-mart or similar

#### 13. YouTube / Video Embeds (`@tiptap/extension-youtube`)
**Why**: Embed educational videos directly in content.

```bash
npm install @tiptap/extension-youtube
```

#### 14. Drawing / Diagrams
**Why**: Create diagrams, flowcharts, and sketches inline.

**Options**:
- Integration with Excalidraw
- Mermaid diagram support
- tldraw integration

#### 15. Comments / Annotations
**Why**: Allow reviewers to add inline comments for feedback.

**Complexity**: High - requires backend support for storing comments.

### Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Tables | High | Medium | 🔴 High |
| Task Lists | High | Low | 🔴 High |
| ~~File Upload~~ | ~~High~~ | ~~High~~ | ✅ Done |
| Bubble Menu | Medium | Low | 🔴 High |
| Highlight | Medium | Low | 🟡 Medium |
| Sub/Superscript | Medium | Low | 🟡 Medium |
| Smart Typography | Low | Low | 🟡 Medium |
| Character Limit | Medium | Low | 🟡 Medium |
| Collaboration | High | Very High | 🟢 Future |
| Mentions | Medium | Medium | 🟢 Future |
| Video Embeds | Medium | Low | 🟢 Future |
| Diagrams | Medium | High | 🟢 Future |

### Adding a New Extension

To add a new extension to the shared configuration:

1. **Install the package**:
   ```bash
   npm install @tiptap/extension-name
   ```

2. **Update `extension-kits/shared.ts`**:
   ```typescript
   import NewExtension from '@tiptap/extension-name';

   export function SharedExtensionKit(config: ExtensionConfig = {}): Extensions {
     return [
       // ... existing extensions
       NewExtension.configure({
         // extension options
       }),
     ];
   }
   ```

3. **Add toolbar button** (if needed) in `ContentEditor/EditorToolbar.tsx`:
   ```typescript
   // Add to ToolbarButtons interface
   newFeature?: boolean;

   // Add to PRESETS
   full: {
     // ...existing
     newFeature: true,
   },

   // Add button JSX in the component
   {buttons.newFeature && (
     <AndamioToggle
       pressed={editor.isActive('newFeature')}
       onPressedChange={() => editor.chain().focus().toggleNewFeature().run()}
       aria-label="New Feature"
     >
       <NewIcon className="h-4 w-4" />
     </AndamioToggle>
   )}
   ```

4. **Test in both Editor and Viewer** to ensure consistent rendering.

5. **Update this documentation** with the new feature.

### Contributing Guidelines

When adding new editor features:

1. **Consistency**: Match existing styling patterns (focus states, transitions, colors)
2. **Accessibility**: Include proper ARIA labels and keyboard navigation
3. **Dark Mode**: Test in both light and dark themes
4. **Documentation**: Update README with new features and usage examples
5. **Backwards Compatibility**: Ensure existing content renders correctly
