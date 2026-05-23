# Component Patterns

Established patterns for common UI components.

---

## 1. Selectable List Item

Used in Master-Detail and Wizard layouts for clickable navigation items.

```tsx
<button
  onClick={() => onSelect(item.id)}
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
    <Icon className={cn(
      "h-4 w-4",
      item.isComplete ? "text-success" : isSelected ? "text-primary" : "text-muted-foreground"
    )} />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <span className={cn(
      "text-sm font-medium truncate",
      isSelected ? "text-primary" : "group-hover:text-foreground"
    )}>
      {item.label}
    </span>
    {item.subtitle && (
      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
    )}
  </div>
</button>
```

**Used in**: `CourseListItem`, `StudioOutlinePanel`

---

## 2. Status Icon

Reusable status indicator with semantic colors.

```tsx
import { AndamioStatusIcon, getCourseStatus, getModuleStatus } from "~/components/andamio";

// Course status
<AndamioStatusIcon preset={getCourseStatus(course.status)} />

// Module status
<AndamioStatusIcon preset={getModuleStatus(module.status)} />

// Custom
<AndamioStatusIcon
  icon={Clock}
  color="warning"
  label="Pending"
/>
```

**Presets**:
| Preset | Icon | Color | Meaning |
|--------|------|-------|---------|
| `on-chain` | CheckCircle | success | Published on blockchain |
| `synced` | RefreshCw | success | Synced with chain |
| `pending` | Clock | warning | Transaction pending |
| `draft` | FileEdit | muted | Work in progress |
| `ready` | CheckCircle2 | info | Ready to publish |
| `committed` | Clock | info | Assignment committed |
| `approved` | CheckCircle | success | Assignment approved |
| `denied` | XCircle | destructive | Assignment denied |

---

## 3. Welcome Panel

Empty state shown before selection in Master-Detail layouts.

```tsx
<div className="flex h-full items-center justify-center">
  <div className="text-center max-w-md p-8">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold">Welcome to [Feature]</h2>
    <AndamioText variant="muted" className="mt-2">
      Select an item from the list to view details.
    </AndamioText>
    <div className="mt-6">
      <AndamioButton onClick={onAction}>
        <Plus className="h-4 w-4 mr-2" />
        Create New
      </AndamioButton>
    </div>
  </div>
</div>
```

**Used in**: `CourseStudioWelcome`

---

## 4. Empty State

For lists/sections with no content.

```tsx
import { AndamioEmptyState } from "~/components/andamio";

<AndamioEmptyState
  icon={<FileText className="h-8 w-8" />}
  title="No items yet"
  description="Create your first item to get started."
  action={
    <AndamioButton onClick={onCreate}>
      <Plus className="h-4 w-4 mr-2" />
      Create Item
    </AndamioButton>
  }
/>
```

---

## 5. Loading States

Unified loading skeleton system with context-appropriate variants.

**Source**: `~/components/andamio/andamio-loading.tsx`

### Page Loading

For full-page loading states in standard `(app)` routes:

```tsx
import { AndamioPageLoading } from "~/components/andamio";

// List pages (courses, modules, etc.)
if (isLoading) return <AndamioPageLoading variant="list" itemCount={5} />;

// Detail pages
if (isLoading) return <AndamioPageLoading variant="detail" />;

// Content pages (editor, viewer)
if (isLoading) return <AndamioPageLoading variant="content" />;

// Table pages
if (isLoading) return <AndamioPageLoading variant="table" itemCount={10} />;

// Card grids
if (isLoading) return <AndamioPageLoading variant="cards" itemCount={6} />;
```

### Studio Loading

For studio/workspace layouts with split-pane structure:

```tsx
import { AndamioStudioLoading } from "~/components/andamio";

// Split-pane layout (list + preview)
if (isLoading) return <AndamioStudioLoading variant="split-pane" />;

// Centered loading (full workspace)
if (isLoading) return <AndamioStudioLoading variant="centered" />;

// Editor-focused loading
if (isLoading) return <AndamioStudioLoading variant="editor" />;
```

### Card Loading

For loading states inside cards:

```tsx
import { AndamioCardLoading } from "~/components/andamio";

// Shows card structure with skeleton content
if (isLoading) return <AndamioCardLoading title="Your Progress" lines={4} />;
```

### List Loading

For list item skeletons:

```tsx
import { AndamioListLoading } from "~/components/andamio";

// Shows skeleton list items
if (isLoading) return <AndamioListLoading count={5} showIcon showBadge />;
```

### Section Loading

For section-level loading within a page:

```tsx
import { AndamioSectionLoading } from "~/components/andamio";

// Shows section with skeleton items
if (isLoading) return <AndamioSectionLoading title="Recent Activity" itemCount={3} />;
```

### Inline Loading

Minimal spinner for small areas:

```tsx
import { AndamioInlineLoading } from "~/components/andamio";

// Small spinner
{isLoading && <AndamioInlineLoading size="sm" />}
```

### Choosing the Right Loading Component

| Context | Component | Variant |
|---------|-----------|---------|
| Standard page (list) | `AndamioPageLoading` | `list` |
| Standard page (detail) | `AndamioPageLoading` | `detail` |
| Studio split-pane | `AndamioStudioLoading` | `split-pane` |
| Studio full workspace | `AndamioStudioLoading` | `centered` |
| Inside a card | `AndamioCardLoading` | - |
| List items | `AndamioListLoading` | - |
| Section within page | `AndamioSectionLoading` | - |
| Small inline indicator | `AndamioInlineLoading` | - |

### Migration from LoadingState

`LoadingState` from `andamio-states.tsx` is deprecated:

```tsx
// ❌ Old (deprecated)
import { LoadingState } from "~/components/andamio";
<LoadingState variant="list" rows={5} />

// ✅ New
import { AndamioPageLoading } from "~/components/andamio";
<AndamioPageLoading variant="list" itemCount={5} />
```

---

## 6. Page Header

Consistent page titles with optional actions.

```tsx
import { AndamioPageHeader } from "~/components/andamio";

<AndamioPageHeader
  title="Page Title"
  description="Optional description text"
  action={
    <AndamioButton>
      <Plus className="h-4 w-4 mr-2" />
      Add New
    </AndamioButton>
  }
/>
```

---

## 7. Section Header

For sections within a page.

```tsx
import { AndamioSectionHeader } from "~/components/andamio";

<AndamioSectionHeader
  title="Section Title"
  icon={<Settings className="h-5 w-5" />}
  action={
    <AndamioButton variant="outline" size="sm">
      View All
    </AndamioButton>
  }
/>
```

---

## 8. Stat Card

Metric display for dashboards.

```tsx
import { AndamioStatCard } from "~/components/andamio";
import { CourseIcon, CredentialIcon } from "~/components/icons";

// Basic stat
<AndamioStatCard
  icon={CourseIcon}
  value={42}
  label="Total Courses"
/>

// With semantic color
<AndamioStatCard
  icon={CredentialIcon}
  value={5}
  label="Credentials"
  iconColor="warning"
/>
```

**Note**: `icon` accepts an `IconComponent` (the constructor), NOT a JSX element like `<BookOpen />`. The component does NOT support `trend`, `trendDirection`, or `description` props.

---

## 9. Preview Panel Header

Header for detail/preview panels (when needed).

```tsx
<div className="flex items-center justify-between border-b border-border px-4 py-3">
  <h3 className="text-sm font-medium">{title}</h3>
  <div className="flex items-center gap-2">
    {actions}
  </div>
</div>
```

**Note**: Prefer putting actions in StudioHeader when possible.

---

## 10. Progress Bar Footer

For wizard/multi-step panels.

```tsx
<div className="border-t border-border px-3 py-2 bg-muted/30">
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span>Progress</span>
    <span>{completed}/{total}</span>
  </div>
  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
    <div
      className="h-full bg-success transition-all duration-300"
      style={{ width: `${(completed / total) * 100}%` }}
    />
  </div>
</div>
```

---

## 11. Breadcrumb Navigation

For nested routes.

```tsx
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";

<CourseBreadcrumb
  course={course}
  module={module}
  lesson={lesson}
/>
```

Or in StudioHeader (automatic):
```tsx
setBreadcrumbs([
  { label: "Course Studio", href: "/studio/course" },
  { label: course.title, href: `/studio/course/${course.id}` },
  { label: module.title },
]);
```

---

## 12. Card with Link

Clickable card for navigation.

```tsx
<Link href={href}>
  <AndamioCard className="hover:border-primary/50 transition-colors cursor-pointer">
    <AndamioCardHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <AndamioCardTitle className="text-base">{title}</AndamioCardTitle>
          <AndamioCardDescription>{description}</AndamioCardDescription>
        </div>
      </div>
    </AndamioCardHeader>
  </AndamioCard>
</Link>
```

**Used in**: `StudioHubCard`

---

## Anti-Patterns

**DO NOT**:
- Create one-off loading spinners (use `AndamioPageLoading`, `AndamioStudioLoading`, etc.)
- Create inline skeleton layouts (use the unified loading system)
- Import `LoadingState` from andamio-states (deprecated - use `AndamioPageLoading`)
- Create inline empty states (use `AndamioEmptyState`)
- Create custom status badges (use `AndamioStatusIcon`)
- Add headers inside panels that duplicate StudioHeader

**DO**:
- Use established components from `~/components/andamio`
- Match loading skeleton to the actual content being loaded
- Use `AndamioStudioLoading` for studio layouts, `AndamioPageLoading` for standard pages
- Follow the patterns exactly as documented
- Extract new patterns to reusable components
