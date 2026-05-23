# Layout Patterns

This document describes the available layout patterns in the Andamio application.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│  AuthStatusBar (fixed)                                       │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                    │
│ Sidebar │              Content Area                          │
│ (fixed) │           (scrollable)                             │
│         │                                                    │
└─────────┴───────────────────────────────────────────────────┘
```

## Critical: Fixed vs Scrollable

**ONLY the main content area scrolls. Everything else is fixed:**

- `AuthStatusBar` - Fixed at top
- `Sidebar` - Fixed on left, full height
- `StudioHeader` - Fixed below status bar (in studio layout)
- `Main content` - This is the ONLY scrollable area

## Layout CSS Pattern

The fixed layout is achieved with this CSS structure:

```tsx
// Root: Full viewport, no scroll
<div className="flex h-screen w-full flex-col overflow-hidden">

  // Fixed header
  <AuthStatusBar />

  // Main container: fills remaining space, no scroll
  <div className="flex min-h-0 flex-1 overflow-hidden">

    // Sidebar: fixed width, full height
    <div className="hidden md:flex md:flex-shrink-0">
      <Sidebar /> {/* Has h-full internally */}
    </div>

    // Content: fills space, THIS scrolls
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
</div>
```

**Key classes:**
- `h-screen` - Root fills viewport
- `overflow-hidden` - Prevents scroll on containers
- `overscroll-none` - Prevents bounce/rubber-band effect on html/body/root
- `overscroll-contain` - Contains overscroll to the scrollable element only
- `min-h-0` - Allows flex children to shrink below content size
- `flex-shrink-0` - Sidebar doesn't shrink
- `overflow-y-auto` - ONLY on the scrollable content area
- `h-full` - Sidebar fills parent height

**Root layout (src/app/layout.tsx):**
```tsx
<html className="overflow-hidden overscroll-none">
  <body className="overflow-hidden overscroll-none">
```

---

## 1. App Shell Layout

**Route Group**: `(app)/*`
**Components**: `AppLayout`, `AppSidebar`

Standard layout for app pages with sidebar navigation.

```
┌─────────────────────────────────────────────┐
│  AuthStatusBar (fixed)                       │
├─────────┬───────────────────────────────────┤
│         │                                    │
│ Sidebar │    Content (scrollable)            │
│  256px  │    - AndamioPageHeader             │
│ (fixed) │    - Page content...               │
│         │    - max-w-6xl centered            │
│         │                                    │
└─────────┴───────────────────────────────────┘
```

**Usage**: Dashboard, Courses list, Settings, Profile

**Key Components**:
- `AndamioPageHeader` - Page title with optional description and action
- `AndamioSectionHeader` - Section titles within the page
- `AndamioScrollArea` - Consistent scrolling behavior

**Example**: `src/app/(app)/dashboard/page.tsx`

---

## 2. Studio Layout

**Route Group**: `(studio)/*`
**Components**: `StudioLayout`, `StudioSidebar`, `StudioHeader`, `StudioProvider`

Dense layout for content creation and editing with persistent sidebar.

```
┌─────────────────────────────────────────────────────────────┐
│  AuthStatusBar (fixed)                                       │
├─────────┬───────────────────────────────────────────────────┤
│         │  StudioHeader (fixed)                              │
│ Sidebar │  - Breadcrumbs, title, actions                     │
│  256px  ├──────────────────┬────────────────────────────────┤
│ (fixed) │                  │                                 │
│         │  Studio Sidebar  │   Workspace (scrollable)        │
│         │  (15-20%)        │   (80-85%)                      │
│         │  - Courses list  │   - Page content                │
│         │  - Projects list │   - Or resizable panels         │
│         │  - Search filter │                                 │
│         │  - Create CTAs   │                                 │
└─────────┴──────────────────┴────────────────────────────────┘
```

**Usage**: Studio hub, Course Editor, Project Dashboard

**Key Components**:
- `StudioHeader` - Breadcrumbs, title, status badge, contextual actions
- `StudioEditorPane` - Content wrapper with consistent padding
- `StudioProvider` - Context for create mode state sharing
- `studio/layout.tsx` - Persistent sidebar with courses/projects list

**StudioHeader Features**:
- Breadcrumb navigation (links to unified `/studio`)
- Page title (from route or data)
- Status badge (optional)
- Contextual action buttons (right side)

**Studio Sidebar (Persistent)**:
- Courses section with count badge and "Create" button
- Projects section with count badge and "Create" button
- Selection highlights current course/project from URL
- Search bar to filter both lists
- Prerequisites tooltip on project hover
- Hidden in wizard mode (module editing)

---

## 3. Master-Detail Layout

**Pattern**: List panel + Preview panel
**Components**: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`

Split-pane layout for browsing and previewing items.

```
┌──────────────────┬─────────────────────────────┐
│                  │                             │
│   List Panel     │     Preview Panel           │
│   (20-30%)       │     (70-80%)                │
│                  │                             │
│   - Items        │   - Selected item details   │
│   - Selection    │   - Actions                 │
│   - Scrollable   │   - Or welcome state        │
│                  │                             │
└──────────────────┴─────────────────────────────┘
```

**Usage**: Studio hub (welcome + create forms), Course/Project editors

**Key Features**:
- Resizable divider with drag handle
- Collapsible panels
- Full-height divider (no gaps)
- Selection state in list syncs to preview

**Example**: `src/app/(studio)/studio/layout.tsx` (sidebar), `src/app/(studio)/studio/page.tsx` (content)

```tsx
<ResizablePanelGroup direction="horizontal" className="h-full">
  <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
    {/* List content */}
  </ResizablePanel>

  <ResizableHandle withHandle />

  <ResizablePanel defaultSize={75}>
    {/* Preview or welcome state */}
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## 4. Wizard Layout

**Pattern**: Outline panel + Step content
**Variant of**: Master-Detail

Navigation outline on left, step content on right.

```
┌──────────────────┬─────────────────────────────┐
│                  │                             │
│  Outline Panel   │     Step Content            │
│  (15-20%)        │     (80-85%)                │
│                  │                             │
│  - Steps         │   - Current step UI         │
│  - Progress      │   - Forms, editors          │
│  - Completion    │   - Validation              │
│                  │                             │
│  ────────────    │                             │
│  Progress Bar    │                             │
└──────────────────┴─────────────────────────────┘
```

**Usage**: Module Editor wizard

**Key Components**:
- `StudioOutlinePanel` - Step list with completion indicators
- Step components (`StepCredential`, `StepSLTs`, etc.)
- `WizardContext` - Shared state for navigation

**Example**: `src/app/(studio)/studio/course/[coursenft]/[modulecode]/page.tsx`

---

## 5. Selectable List Pattern

Used in both Master-Detail and Wizard layouts for the left panel.

```tsx
<div className="flex flex-col gap-3 p-3">
  {items.map((item) => (
    <button
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-lg border transition-all duration-150",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70"
      )}
    >
      {/* Status icon */}
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
        item.isComplete ? "bg-success/10" : isSelected ? "bg-primary/10" : "bg-muted"
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{item.label}</span>
        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
      </div>
    </button>
  ))}
</div>
```

**Consistent Styling**:
- Container: `gap-3 p-3`
- Items: `px-3 py-3 rounded-lg border`
- Status icon: `h-8 w-8 rounded-md`
- Selection: `bg-primary/10 border-primary/30 shadow-sm`
- Hover: `hover:bg-muted/50 hover:border-border`

---

## Layout Selection Guide

| Use Case | Layout | Example Route |
|----------|--------|---------------|
| Dashboard/Overview | App Shell | `/dashboard` |
| List with details | App Shell + Cards | `/courses` |
| Content browsing | Master-Detail | `/studio/course` |
| Step-by-step creation | Studio + Wizard | `/studio/course/[id]/[module]` |
| Form editing | Studio + Editor | `/studio/course/[id]` |
| Public pages | Marketing Layout | `/` (landing) |

---

## 6. Centered Content Pattern

**Problem**: When centering text blocks with constrained width (`max-w-md`), using `text-center` alone doesn't work because it only centers the text within the constrained block, not the block itself.

**Solution**: Use flexbox with `items-center` on the parent to center the constrained block.

```tsx
// ✅ CORRECT - Flexbox centers the constrained block
<div className="flex flex-col items-center gap-3">
  <h3 className="text-lg font-semibold">Title</h3>
  <p className="text-sm text-muted-foreground text-center max-w-md">
    This paragraph is constrained to max-w-md width AND centered
    within its parent container.
  </p>
</div>
```

```tsx
// ❌ WRONG - Block is constrained but not centered
<div className="text-center">
  <h3>Title</h3>
  <p className="text-center max-w-md mx-auto">
    This uses mx-auto which centers the block, but can have
    subtle alignment issues with text-center inheritance.
  </p>
</div>
```

**Key Classes**:
- Parent: `flex flex-col items-center` - Centers all children horizontally
- Child: `text-center max-w-md` - Centers text AND constrains width

**Use Cases**:
- Hero sections with centered headlines and descriptions
- Wizard step headers (e.g., Review step in Module Editor)
- Empty states with centered messaging
- Modal/dialog content

**Example**: `src/components/studio/wizard/steps/step-review.tsx`

---

## Anti-Patterns

**DO NOT**:
- Add headers inside panels that duplicate StudioHeader info
- Create gaps at top of dividers (divider should run full height)
- Show redundant navigation (breadcrumbs provide context)
- Mix layout patterns on the same page
- Add custom padding that breaks consistency
- Use `mx-auto` alone for centering constrained text blocks (use flexbox instead)
