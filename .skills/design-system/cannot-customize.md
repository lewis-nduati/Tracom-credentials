# What You CANNOT Customize

This document lists things that are NOT allowed in the Andamio design system.

---

## Absolute Rules

### 1. No Page-Level Scroll

**The page itself NEVER scrolls. Only the main content area scrolls.**

```tsx
// ❌ FORBIDDEN - Adding scroll to page wrapper
<div className="overflow-y-auto"> {/* NO! */}
  <AppLayout>...</AppLayout>
</div>

// ❌ FORBIDDEN - Breaking the fixed layout
<div className="h-auto"> {/* NO! Don't change h-screen */}

// ✅ REQUIRED - Scroll only in content area
// This is handled by AppLayout/StudioLayout automatically
<main className="flex-1 overflow-y-auto">
  {children}
</main>
```

**Why?** The sidebar and header must stay anchored. Only content scrolls.

---

### 2. No Hardcoded Colors (see also semantic-colors.md)

**NEVER use Tailwind color classes directly.**

```tsx
// ❌ FORBIDDEN
className="text-green-600"
className="bg-blue-500"
className="border-red-400"
className="text-gray-500"
style={{ color: '#22c55e' }}
style={{ backgroundColor: 'rgb(59, 130, 246)' }}

// ✅ REQUIRED
className="text-success"
className="bg-primary"
className="border-destructive"
className="text-muted-foreground"
```

---

### 3. No Custom className on Andamio Components

**Don't add styling props to Andamio components. Extract a new component instead.**

```tsx
// ❌ FORBIDDEN
<AndamioButton className="my-custom-style">
<AndamioCard className="border-2 border-blue-500">
<AndamioBadge className="uppercase tracking-wide">

// ✅ REQUIRED - Extract to new component
// In ~/components/andamio/andamio-custom-badge.tsx
export function AndamioCustomBadge({ children }) {
  return (
    <AndamioBadge className="uppercase tracking-wide">
      {children}
    </AndamioBadge>
  );
}
```

---

### 4. No Raw shadcn/ui Imports

**Always use Andamio-prefixed wrappers.**

```tsx
// ❌ FORBIDDEN
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

// ✅ REQUIRED
import { AndamioButton } from "~/components/andamio";
import { AndamioCard } from "~/components/andamio";
import { AndamioBadge } from "~/components/andamio";
```

---

### 5. No Arbitrary Spacing Values

**Use the Tailwind spacing scale.**

```tsx
// ❌ FORBIDDEN
className="p-[13px]"
className="gap-[7px]"
className="mt-[22px]"
className="w-[347px]"

// ✅ REQUIRED
className="p-3"
className="gap-2"
className="mt-6"
className="w-full max-w-sm"
```

---

### 6. No Inline Styles

**CSS-in-JS is not used. Avoid inline styles.**

```tsx
// ❌ FORBIDDEN
style={{ padding: '20px' }}
style={{ color: 'blue' }}
style={{ display: 'flex' }}

// ✅ REQUIRED
className="p-5"
className="text-primary"
className="flex"

// Exception: Dynamic values that can't be Tailwind classes
style={{ width: `${percentage}%` }}  // ✅ OK for dynamic values
```

---

### 7. No CSS Modules

**No `.module.css` files.**

```tsx
// ❌ FORBIDDEN
import styles from './Component.module.css';
<div className={styles.container}>

// ✅ REQUIRED
<div className="flex items-center gap-4">
```

---

### 8. No One-Off Components

**Don't create inline loading states, empty states, or status icons.**

```tsx
// ❌ FORBIDDEN - Inline loading
{isLoading && (
  <div className="flex items-center justify-center">
    <div className="animate-spin ...">...</div>
  </div>
)}

// ✅ REQUIRED
import { AndamioPageLoading } from "~/components/andamio";
{isLoading && <AndamioPageLoading />}

// ❌ FORBIDDEN - Inline empty state
{items.length === 0 && (
  <div className="text-center p-8">
    <p>No items found</p>
  </div>
)}

// ✅ REQUIRED
import { AndamioEmptyState } from "~/components/andamio";
{items.length === 0 && (
  <AndamioEmptyState
    icon={<FileText />}
    title="No items"
    description="Create your first item."
  />
)}
```

---

### 9. No Duplicate Headers

**Don't add headers inside panels that duplicate StudioHeader information.**

```tsx
// ❌ FORBIDDEN - Redundant header in panel
<ResizablePanel>
  <div className="border-b p-4">
    <h2>Your Courses</h2>  {/* Duplicates breadcrumb context */}
  </div>
  <CourseList />
</ResizablePanel>

// ✅ REQUIRED - No header, breadcrumbs provide context
<ResizablePanel>
  <CourseList />
</ResizablePanel>
```

---

### 10. No Gaps at Panel Edges

**Dividers should run full height.**

```tsx
// ❌ FORBIDDEN - Gap at top of divider
<ResizablePanelGroup>
  <ResizablePanel>
    <div className="p-4">  {/* Creates gap */}
      <List />
    </div>
  </ResizablePanel>
  <ResizableHandle />
  ...
</ResizablePanelGroup>

// ✅ REQUIRED - Full-height content
<ResizablePanelGroup>
  <ResizablePanel>
    <div className="flex h-full flex-col">
      <AndamioScrollArea className="flex-1">
        <div className="p-3">
          <List />
        </div>
      </AndamioScrollArea>
    </div>
  </ResizablePanel>
  <ResizableHandle />
  ...
</ResizablePanelGroup>
```

---

### 11. No Mixed Layout Patterns

**Each page uses ONE primary layout pattern.**

```tsx
// ❌ FORBIDDEN - Mixing patterns
<div>
  <MasterDetailLayout>...</MasterDetailLayout>
  <CardGrid>...</CardGrid>  {/* Don't mix on same page */}
</div>

// ✅ REQUIRED - One pattern per page
// Master-Detail page
<MasterDetailLayout>
  <List />
  <Preview />
</MasterDetailLayout>

// OR Card Grid page
<CardGrid>
  <Card />
  <Card />
</CardGrid>
```

---

### 12. No Raw `<p>` Tags with className

**Use AndamioText for paragraph text.**

```tsx
// ❌ FORBIDDEN
<p className="text-muted-foreground">Description</p>
<p className="text-sm text-muted-foreground">Helper text</p>

// ✅ REQUIRED
<AndamioText variant="muted">Description</AndamioText>
<AndamioText variant="small">Helper text</AndamioText>
```

---

### 13. No Custom Focus Rings

**Use the built-in focus system.**

```tsx
// ❌ FORBIDDEN
className="focus:ring-2 focus:ring-blue-500 focus:outline-none"

// ✅ REQUIRED - Use built-in component focus
<AndamioButton>  {/* Has built-in focus ring */}
<AndamioInput>   {/* Has built-in focus ring */}
```

---

### 14. No `module` as Variable Name

**Use descriptive names to avoid conflicts.**

```tsx
// ❌ FORBIDDEN
const [module, setModule] = useState();

// ✅ REQUIRED
const [courseModule, setCourseModule] = useState();
```

---

## Summary Checklist

Before submitting code, verify:

- [ ] No hardcoded colors (text-green-600, bg-blue-500, etc.)
- [ ] No custom className on Andamio components
- [ ] No imports from `~/components/ui/` (use `~/components/andamio/`)
- [ ] No arbitrary spacing values ([13px], [7px], etc.)
- [ ] No inline styles (except dynamic values)
- [ ] No one-off loading/empty states
- [ ] No duplicate headers in panels
- [ ] No gaps at panel edges
- [ ] Using AndamioText instead of styled `<p>` tags
- [ ] Descriptive variable names (not `module`)

---

## When You Think You Need an Exception

1. **Check existing components** - There's probably already a pattern
2. **Ask if it's truly necessary** - Most "exceptions" are over-engineering
3. **Extract to reusable component** - If it's new, make it reusable
4. **Document in extracted-components.md** - So others can use it
