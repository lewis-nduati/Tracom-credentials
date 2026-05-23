# Andamio T3 App Styling Rules

## Goal

Andamio T3 App Template is easily customizable for devs and ready for any viewport.

## Rules

1. **No Custom Styling on Andamio Components**: Top level page components should never apply custom tailwind properties to [Andamio Components](../../../src/components/andamio/). Always use components as they are.

2. **No Raw shadcn/ui**: shadcn/ui primitives should never be used outside of Andamio Components. Always import from `~/components/andamio/`.

3. **Andamio Prefix Convention**: All Andamio wrapper components must export with the `Andamio` prefix for clarity and consistency. Never use non-prefixed shadcn names in page components.

4. **Global Heading Styles**: All heading tags (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`) are styled globally in `src/styles/globals.css`. Never add custom size, margin, or padding classes to heading tags. Only color classes (e.g., `text-muted-foreground`, `text-primary`) are allowed.

5. **Use AndamioText for Paragraphs**: Never use raw `<p className="...">` with text styling. Always use `AndamioText` component with appropriate variant.

6. **Centralized Icon System**: All icons must be imported from `~/components/icons`, not directly from `lucide-react`. Icons have semantic names (e.g., `CredentialIcon` instead of `Award`).

7. **No `<code>` Elements for Inline Monospace**: Never use `<code>` elements for displaying inline monospace text (addresses, hashes, codes). The global `code` styles in `globals.css` apply `text-sm` which overrides Tailwind utility classes. Use `<span className="font-mono">` instead.

## Examples

### Rule 1 - No Custom Styling

```tsx
// ❌ WRONG - Custom className on Andamio component
<AndamioCard className="shadow-xl border-2">

// ✅ CORRECT - Use as-is, or extract to a new component
<AndamioCard>
```

### Rule 2 - No Raw shadcn

```tsx
// ❌ WRONG - Importing from ~/components/ui
import { Button } from "~/components/ui/button";

// ✅ CORRECT - Import from Andamio
import { AndamioButton } from "~/components/andamio";
```

### Rule 3 - Andamio Prefix

```tsx
// ❌ WRONG - Non-prefixed names
import { Sheet, SheetContent } from "~/components/andamio/andamio-sheet";

// ✅ CORRECT - Andamio-prefixed names
import { AndamioSheet, AndamioSheetContent } from "~/components/andamio/andamio-sheet";
```

### Rule 4 - Global Heading Styles

```tsx
// ❌ WRONG - Custom size/margin/padding on headings
<h1 className="text-3xl font-bold mb-4">Page Title</h1>
<h2 className="text-2xl font-semibold mt-8 mb-2">Section</h2>
<h3 className="text-lg font-medium">Subsection</h3>

// ✅ CORRECT - Use global styles, only color classes allowed
<h1>Page Title</h1>
<h2>Section</h2>
<h3 className="text-muted-foreground">Subsection with muted color</h3>
```

### Rule 5 - AndamioText for Paragraphs

```tsx
// ❌ WRONG - Raw p tags with className
<p className="text-muted-foreground">Description text</p>
<p className="text-sm text-muted-foreground">Small helper text</p>
<p className="text-lg text-muted-foreground">Lead paragraph</p>

// ✅ CORRECT - Use AndamioText with variants
<AndamioText variant="muted">Description text</AndamioText>
<AndamioText variant="small">Small helper text</AndamioText>
<AndamioText variant="lead">Lead paragraph</AndamioText>
```

**Available variants**: `default`, `muted`, `small`, `lead`, `overline`

### Rule 6 - Centralized Icon System

```tsx
// ❌ WRONG - Direct lucide-react import
import { Award, Target, BookOpen, AlertCircle } from "lucide-react";
<Award className="h-4 w-4" />

// ✅ CORRECT - Import from centralized icons with semantic names
import { CredentialIcon, SLTIcon, CourseIcon, AlertIcon } from "~/components/icons";
<CredentialIcon className="h-4 w-4" />
```

**Key mappings:**
- `Award` → `CredentialIcon` (credentials, achievements)
- `Target` → `SLTIcon` (Student Learning Targets)
- `BookOpen` → `CourseIcon` (courses)
- `Blocks` → `OnChainIcon` (blockchain)
- `AlertCircle` → `AlertIcon` (warnings)
- `CheckCircle` → `SuccessIcon` (success states)
- `Loader2` → `LoadingIcon` (loading states)

See [icon-system.md](./icon-system.md) for complete icon reference.

### Rule 7 - No `<code>` for Inline Monospace

```tsx
// ❌ WRONG - <code> has global text-sm that overrides text-[10px]
<code className="text-[10px] text-muted-foreground font-mono">
  addr1qx9...abc
</code>

// ✅ CORRECT - Use <span> with font-mono
<span className="text-[10px] font-mono text-muted-foreground">
  addr1qx9...abc
</span>

// ✅ ALSO CORRECT - For code blocks, use the Tiptap editor's CodeBlock
// which has proper styling in the editor extension kit
```

**Why this matters**: `globals.css` applies `@apply text-sm` to all `code` elements. This style has the same specificity as Tailwind utilities, so `text-xs` or `text-[10px]` won't work. Using `<span className="font-mono">` gives you full control over font size.

8. **Content Max-Width**: Content pages (not studio/editor pages) should constrain width for readability on large screens. The `(app)` layout already applies `max-w-6xl mx-auto` (1152px) via `app-layout.tsx`. Studio pages with dense layouts remain full-width.

9. **Vertical Spacing Scale**: Use consistent spacing between elements:

| Context | Spacing | Tailwind | Use For |
|---------|---------|----------|---------|
| Tight | 8px | `space-y-2`, `gap-2` | Studio panels, compact UI |
| Default | 12px | `space-y-3`, `gap-3` | List items, form fields |
| Comfortable | 16px | `space-y-4`, `gap-4` | Cards, content sections |
| Sections | 24px | `space-y-6`, `gap-6` | Page sections |
| Major sections | 32px | `space-y-8`, `gap-8` | Top-level page divisions |

10. **Use AndamioSaveButton for Save Operations**: All save buttons must use `AndamioSaveButton` from `~/components/andamio/andamio-save-button`. Never create ad-hoc save buttons with inline loading states.

11. **Use AndamioBackButton for Back Navigation**: All "Back to X" buttons must use `AndamioBackButton`. Never create ad-hoc back buttons with Link + Button + BackIcon.

12. **Use AndamioAddButton for Create Operations**: All create/add buttons with loading states must use `AndamioAddButton`. Simple add buttons (no loading) may use `AddIcon` directly.

13. **Use AndamioDeleteButton for Destructive Actions**: All delete buttons requiring confirmation must use `AndamioDeleteButton`. Never create ad-hoc ConfirmDialog + DeleteIcon patterns.

14. **Use AndamioErrorAlert for Error Messages**: All error alerts must use `AndamioErrorAlert`. Never create ad-hoc `<AndamioAlert variant="destructive">` patterns.

15. **Use AndamioEditButton for Edit Navigation**: All edit buttons that navigate to an edit page must use `AndamioEditButton`. Never create ad-hoc Link + Button + EditIcon patterns.

16. **Use AndamioRemoveButton for List Item Removal**: All remove/close buttons for list items (acceptance criteria, tags, etc.) must use `AndamioRemoveButton`. Never create ad-hoc ghost buttons with CloseIcon.

17. **Use AndamioRowActions for Table Row Actions**: All table rows with edit/delete actions must use `AndamioRowActions`. Never create ad-hoc row action patterns with separate edit and delete buttons.

18. **Use AndamioCardIconHeader for Card Headers**: All card headers with icon + title must use `AndamioCardIconHeader`. Never create ad-hoc flex containers with icon + AndamioCardTitle.

19. **Use AndamioActionFooter for Button Groups**: All form/card action button groups must use `AndamioActionFooter`. Never create ad-hoc `flex justify-end gap-2` patterns for button rows.

## Examples

### Rule 7 - Content Max-Width

The `(app)` route group layout (`app-layout.tsx`) already applies `max-w-6xl mx-auto` to all content pages. No additional max-width needed on individual pages.

```tsx
// ✅ CORRECT - (app) layout handles max-width automatically
// In src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Content - max-width applied by layout */}
    </div>
  );
}

// ✅ CORRECT - Studio pages stay full-width (different layout)
// In src/app/(studio)/studio/course/page.tsx
<StudioEditorPane>
  <div className="px-6 py-4">
    <DenseStudioContent />
  </div>
</StudioEditorPane>
```

**How max-width is applied:**
- ✅ `(app)` route group: `max-w-6xl mx-auto` via `app-layout.tsx`
- ✅ Landing pages: Apply `max-w-6xl mx-auto` manually if not in `(app)` group
- ❌ `(studio)` route group: Full-width (dense layouts benefit from full width)
- ❌ Editor panels, resizable layouts: Full-width

### Rule 8 - Vertical Spacing

```tsx
// ❌ WRONG - Inconsistent spacing
<div className="space-y-2">  {/* Too tight for list items */}
  {courses.map(c => <CourseCard />)}
</div>

// ✅ CORRECT - Default spacing for lists
<div className="space-y-3">
  {courses.map(c => <CourseCard />)}
</div>

// ✅ CORRECT - Comfortable spacing for card grids
<div className="grid gap-4">
  {items.map(i => <Card />)}
</div>

// ✅ CORRECT - Section spacing
<div className="space-y-6">
  <Section title="Overview" />
  <Section title="Details" />
</div>
```

### Rule 9 - AndamioSaveButton

```tsx
// ❌ WRONG - Ad-hoc save button with inline loading state
<AndamioButton onClick={handleSave} disabled={isSaving}>
  {isSaving ? (
    <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <SaveIcon className="h-4 w-4 mr-2" />
  )}
  {isSaving ? "Saving..." : "Save Changes"}
</AndamioButton>

// ❌ WRONG - Manual loading state management
<AndamioButton onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
  <SaveIcon className="h-4 w-4 mr-1" />
  Save
</AndamioButton>

// ✅ CORRECT - Use AndamioSaveButton
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";

<AndamioSaveButton onClick={handleSave} isSaving={isSaving} />

// ✅ CORRECT - Compact variant for toolbars/tight spaces
<AndamioSaveButton onClick={handleSave} isSaving={isSaving} compact />

// ✅ CORRECT - Custom label (e.g., "Save Draft")
<AndamioSaveButton
  onClick={handleSave}
  isSaving={isSaving}
  label="Save Draft"
  savingLabel="Saving..."
/>

// ✅ CORRECT - Outline variant
<AndamioSaveButton variant="outline" onClick={handleSave} isSaving={isSaving} />
```

**Note**: Use `AndamioSaveButton` for **save operations only**. For create/add operations, use `AndamioAddButton`.

### Rule 10 - AndamioBackButton

```tsx
// ❌ WRONG - Ad-hoc back button
<Link href="/courses">
  <AndamioButton variant="ghost" size="sm">
    <BackIcon className="h-4 w-4 mr-1" />
    Back to Courses
  </AndamioButton>
</Link>

// ✅ CORRECT - Use AndamioBackButton
import { AndamioBackButton } from "~/components/andamio";

<AndamioBackButton href="/courses" label="Back to Courses" />
```

### Rule 11 - AndamioAddButton

```tsx
// ❌ WRONG - Ad-hoc create button with loading
<AndamioButton onClick={handleCreate} disabled={isCreating}>
  {isCreating ? <LoadingIcon className="animate-spin" /> : <AddIcon />}
  {isCreating ? "Creating..." : "Create Task"}
</AndamioButton>

// ✅ CORRECT - Use AndamioAddButton
import { AndamioAddButton } from "~/components/andamio";

<AndamioAddButton onClick={handleCreate} isLoading={isCreating} label="Create Task" />

// ✅ ALSO CORRECT - Simple add without loading (no async operation)
<AndamioButton variant="outline" size="sm" onClick={addItem}>
  <AddIcon className="h-4 w-4 mr-1" />
  Add
</AndamioButton>
```

### Rule 12 - AndamioDeleteButton

```tsx
// ❌ WRONG - Ad-hoc delete with ConfirmDialog
<AndamioConfirmDialog
  trigger={<AndamioButton variant="ghost" size="sm">
    <DeleteIcon className="h-4 w-4 text-destructive" />
  </AndamioButton>}
  title="Delete Task"
  description="Are you sure?"
  variant="destructive"
  onConfirm={handleDelete}
/>

// ✅ CORRECT - Use AndamioDeleteButton
import { AndamioDeleteButton } from "~/components/andamio";

<AndamioDeleteButton
  onConfirm={handleDelete}
  itemName="task"
  isLoading={isDeleting}
/>
```

### Rule 13 - AndamioErrorAlert

```tsx
// ❌ WRONG - Ad-hoc error alert
{error && (
  <AndamioAlert variant="destructive">
    <AlertIcon className="h-4 w-4" />
    <AndamioAlertTitle>Error</AndamioAlertTitle>
    <AndamioAlertDescription>{error}</AndamioAlertDescription>
  </AndamioAlert>
)}

// ✅ CORRECT - Use AndamioErrorAlert
import { AndamioErrorAlert } from "~/components/andamio";

{error && <AndamioErrorAlert error={error} />}
```

### Rule 14 - AndamioEditButton

```tsx
// ❌ WRONG - Ad-hoc edit button
<Link href={`/studio/project/${id}/edit`}>
  <AndamioButton variant="ghost" size="sm">
    <EditIcon className="h-4 w-4" />
  </AndamioButton>
</Link>

// ✅ CORRECT - Use AndamioEditButton (icon-only for tables)
import { AndamioEditButton } from "~/components/andamio";

<AndamioEditButton href={`/studio/project/${id}/edit`} />

// ✅ CORRECT - With label for standalone buttons
<AndamioEditButton href={`/studio/project/${id}/edit`} label="Edit Project" iconOnly={false} />
```

### Rule 15 - AndamioRemoveButton

```tsx
// ❌ WRONG - Ad-hoc remove button for list items
<AndamioButton
  variant="ghost"
  size="sm"
  onClick={() => removeCriterion(index)}
  className="text-muted-foreground hover:text-destructive"
>
  <CloseIcon className="h-4 w-4" />
</AndamioButton>

// ✅ CORRECT - Use AndamioRemoveButton
import { AndamioRemoveButton } from "~/components/andamio";

<AndamioRemoveButton
  onClick={() => removeCriterion(index)}
  ariaLabel={`Remove criterion ${index + 1}`}
/>
```

### Rule 16 - AndamioRowActions

```tsx
// ❌ WRONG - Ad-hoc row actions
<AndamioTableCell className="text-right">
  <div className="flex items-center justify-end gap-1">
    <Link href={`/edit/${id}`}>
      <AndamioButton variant="ghost" size="sm">
        <EditIcon className="h-4 w-4" />
      </AndamioButton>
    </Link>
    <AndamioConfirmDialog onConfirm={() => handleDelete(id)} ...>
      <AndamioButton variant="ghost" size="sm">
        <DeleteIcon className="h-4 w-4 text-destructive" />
      </AndamioButton>
    </AndamioConfirmDialog>
  </div>
</AndamioTableCell>

// ✅ CORRECT - Use AndamioRowActions
import { AndamioRowActions } from "~/components/andamio";

<AndamioTableCell className="text-right">
  <AndamioRowActions
    editHref={`/edit/${id}`}
    onDelete={() => handleDelete(id)}
    itemName="task"
    isDeleting={deletingId === id}
  />
</AndamioTableCell>
```

### Rule 17 - AndamioCardIconHeader

```tsx
// ❌ WRONG - Ad-hoc card icon header
<AndamioCardHeader>
  <div className="flex items-center gap-2">
    <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
    <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
  </div>
</AndamioCardHeader>

// ✅ CORRECT - Use AndamioCardIconHeader
import { AndamioCardIconHeader } from "~/components/andamio";

<AndamioCardHeader>
  <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
</AndamioCardHeader>

// ✅ CORRECT - With right-aligned actions
<AndamioCardHeader>
  <div className="flex items-center justify-between">
    <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
    <AndamioButton variant="ghost" size="icon-sm">
      <RefreshIcon className="h-4 w-4" />
    </AndamioButton>
  </div>
</AndamioCardHeader>
```

### Rule 18 - AndamioActionFooter

```tsx
// ❌ WRONG - Ad-hoc button row
<div className="flex justify-end gap-2 pt-4 border-t">
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioSaveButton onClick={handleSave} isSaving={isSaving} />
</div>

// ✅ CORRECT - Use AndamioActionFooter
import { AndamioActionFooter } from "~/components/andamio";

<AndamioActionFooter showBorder>
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioSaveButton onClick={handleSave} isSaving={isSaving} />
</AndamioActionFooter>

// ✅ CORRECT - Without border (not at bottom of card)
<AndamioActionFooter>
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioButton>Submit</AndamioButton>
</AndamioActionFooter>
```

20. **Production-Quality Alignment**: Every flex row and grid must have pixel-perfect alignment. Mixed font sizes within a row cause baseline misalignment — all sibling items must use the same `text-*` size. Use `gap-*` instead of `justify-between` when items have variable widths or are conditionally rendered. Add `shrink-0` to fixed-width items (icons, badges) and `min-w-0` + `truncate` to variable-width items so they compress gracefully instead of pushing siblings off-center.

### Rule 20 - Production-Quality Alignment

```tsx
// ❌ WRONG - Mixed font sizes cause baseline misalignment
<div className="flex items-center justify-between text-sm">
  <span className="font-mono text-xs">{alias}</span>  {/* text-xs */}
  <span>{count} managers</span>                        {/* text-sm (inherited) */}
</div>

// ❌ WRONG - justify-between with conditional items causes uneven spacing
<div className="flex items-center justify-between w-full">
  {owner && <div>{owner}</div>}
  {managers > 0 && <div>{managers} managers</div>}
  {prereqs > 0 && <div>{prereqs} prerequisites</div>}
</div>

// ✅ CORRECT - Same font size, gap-based spacing, proper shrink behavior
<div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
  {owner && (
    <div className="flex items-center gap-1.5 min-w-0">
      <UserIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate font-mono">{owner}</span>
    </div>
  )}
  {managers > 0 && (
    <div className="flex items-center gap-1.5 shrink-0">
      <ManagerIcon className="h-3.5 w-3.5" />
      <span>{managers} managers</span>
    </div>
  )}
</div>
```

**Checklist for every flex/grid row:**
- [ ] All text items use the same `text-*` size
- [ ] Icons use `shrink-0` so they don't compress
- [ ] Variable-width text uses `min-w-0` + `truncate`
- [ ] Conditional items use `gap-*`, not `justify-between`
- [ ] Row wraps gracefully on narrow viewports (`flex-wrap`)

21. **Minimalism — Remove What Doesn't Serve Action**: Every UI element must earn its place. If a badge, label, or data point doesn't help the user understand state or take the next action, remove it. Max 3 clicks from list view to action. Max 7 primary actions per screen. No confirm dialogs for safe operations. See [visual-qa.md](./visual-qa.md) for the full minimalism checklist.

22. **Loading & Empty States Must Match Layout**: Loading skeletons must match the real content's dimensions. Empty states must use `AndamioEmptyState` with an action and explain *why* it's empty and *what to do*. No inline spinners — use `AndamioPageLoading` or component-level skeletons. See [visual-qa.md](./visual-qa.md) for the full checklist.

23. **Layout Stability — Don't Shift the User's Viewport**: Inline expansions must not lose the user's scroll position. If an expandable section grows taller than the viewport, use a sheet/dialog instead. Async content must reserve space with skeletons. Toasts overlay — never push content. After any state change, focus stays near the element the user interacted with. See [visual-qa.md](./visual-qa.md) for the full checklist.

## Wrapper Convention

Every Andamio wrapper file in `src/components/andamio/` must:

1. Export all component parts with `Andamio` prefix
2. Optionally re-export base names for backwards compatibility
3. Use consistent naming: `ComponentName` → `AndamioComponentName`

Example wrapper pattern:
```tsx
// src/components/andamio/andamio-sheet.tsx
export {
  Sheet as AndamioSheet,
  SheetContent as AndamioSheetContent,
  SheetHeader as AndamioSheetHeader,
  // ... etc
} from "~/components/ui/sheet";
```

---

## Future Automation (ESLint)

These ESLint rules can be added to automatically catch styling violations:

### Rule 2: No Raw shadcn/ui Imports

Add to `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['~/components/ui/*'],
            message: 'Import from ~/components/andamio instead of ~/components/ui. See Rule 2 in style-rules.md.',
          },
        ],
      },
    ],
  },
};
```

### Hardcoded Colors

Add a custom rule or use `eslint-plugin-tailwindcss`:

```javascript
// In eslint config
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/(?:text|bg|border|ring)-(?:red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|amber|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]/]",
        "message": "Use semantic color variables (text-success, text-warning, etc.) instead of hardcoded Tailwind colors."
      }
    ]
  }
}
```

### Quick Grep Commands

Until ESLint rules are implemented, use these commands to find violations:

```bash
# Find raw shadcn imports in pages
grep -r "from ['\"]~/components/ui" src/app/

# Find hardcoded colors
grep -rE "text-(red|green|blue|yellow)-[0-9]" src/app/
grep -rE "bg-(red|green|blue|yellow)-[0-9]" src/app/

# Find non-prefixed component names from andamio wrappers
grep -rE "import \{[^}]*\b(Sheet|Popover|Avatar|DropdownMenu)\b" src/app/

# Find heading tags with custom size/margin/padding classes
grep -rE "<h[1-6][^>]*(text-(xs|sm|base|lg|xl|[2-9]xl)|font-(normal|medium|semibold|bold)|m[tby]-|mb-|mt-|p[tby]-)" src/

# Find raw p tags with className (should use AndamioText)
grep -rE "<p className=" src/app/ src/components/

# Find direct lucide-react imports (should use ~/components/icons)
grep -r "from \"lucide-react\"" src/app src/components --include="*.tsx" | grep -v "src/components/icons/" | grep -v "src/components/ui/"

# Find mixed font sizes in flex rows (potential alignment issues)
grep -rn "justify-between" src/app/ src/components/ --include="*.tsx" | grep -v node_modules
```