# Responsive Design Style Guide

This document describes the responsive design patterns and Andamio components used throughout the application to ensure consistent, mobile-first layouts.

## Breakpoint System

All breakpoints are defined in `src/styles/globals.css` using Tailwind CSS v4's `@theme` directive:

```css
@theme {
  --breakpoint-xs: 375px;   /* Extra small phones (iPhone SE, small Android) */
  --breakpoint-sm: 640px;   /* Small tablets, large phones landscape */
  --breakpoint-md: 768px;   /* Tablets, small laptops */
  --breakpoint-lg: 1024px;  /* Laptops, small desktops */
  --breakpoint-xl: 1280px;  /* Large desktops */
  --breakpoint-2xl: 1536px; /* Extra large screens */
}
```

### Device Reference

| Breakpoint | Width | Typical Devices |
|------------|-------|-----------------|
| `xs:` | 375px+ | iPhone SE, small Android phones |
| `sm:` | 640px+ | Large phones (landscape), small tablets |
| `md:` | 768px+ | iPad, tablets, small laptops |
| `lg:` | 1024px+ | Laptops, small desktop monitors |
| `xl:` | 1280px+ | Large desktop monitors |
| `2xl:` | 1536px+ | Ultra-wide monitors |

### Mobile-First Approach

Always design for the smallest screen first, then enhance for larger screens:

```tsx
// ✅ CORRECT - Mobile-first
<div className="text-sm sm:text-base md:text-lg">Content</div>
<div className="flex-col sm:flex-row">Items</div>
<div className="px-4 sm:px-6 lg:px-8">Padded content</div>

// ❌ WRONG - Desktop-first requires overrides
<div className="text-lg md:text-base sm:text-sm">Content</div>
```

---

## Andamio Layout Components

### AndamioPageHeader

**Location**: `src/components/andamio/andamio-page-header.tsx`

**Purpose**: Consistent, responsive page headers (h1) with optional description, badge, and action buttons.

**Import**:
```tsx
import { AndamioPageHeader } from "~/components/andamio";
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page title (h1) - required |
| `description` | `string` | Optional page description |
| `action` | `ReactNode` | Optional action element (button, link) on the right |
| `badge` | `ReactNode` | Optional badge next to the title |
| `centered` | `boolean` | Center-align the header (for landing pages) |
| `className` | `string` | Additional CSS classes |

**Examples**:

```tsx
// Basic page header
<AndamioPageHeader
  title="Dashboard"
  description="Welcome to your personalized dashboard"
/>

// With action button
<AndamioPageHeader
  title="Courses"
  description="Manage your courses"
  action={<AndamioButton>Create Course</AndamioButton>}
/>

// With badge
<AndamioPageHeader
  title="Module Details"
  badge={<AndamioBadge>Published</AndamioBadge>}
/>

// Centered (landing pages, auth screens)
<AndamioPageHeader
  title="Welcome to Andamio"
  description="Connect your wallet to get started"
  centered
/>

// Error states
<AndamioPageHeader title="Course Not Found" />
<AndamioPageHeader title="Something went wrong" />
```

**Responsive Behavior**:
- Title: `text-2xl sm:text-3xl` (centered: `text-2xl xs:text-3xl sm:text-4xl`)
- Description: `text-sm sm:text-base` (centered: `text-base sm:text-lg md:text-xl`)
- Layout: `flex-col sm:flex-row` when action is present
- Action moves below title on mobile

---

### AndamioSectionHeader

**Location**: `src/components/andamio/andamio-section-header.tsx`

**Purpose**: Consistent, responsive section headers (h2/h3) within page content.

**Import**:
```tsx
import { AndamioSectionHeader } from "~/components/andamio";
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section title - required |
| `description` | `string` | Optional section description |
| `action` | `ReactNode` | Optional action element on the right |
| `badge` | `ReactNode` | Optional badge next to the title |
| `icon` | `ReactNode` | Optional icon before the title |
| `as` | `"h2" \| "h3"` | Heading level (default: h2) |
| `className` | `string` | Additional CSS classes |

**Examples**:

```tsx
// Basic section header
<AndamioSectionHeader title="Student Learning Targets" />

// With description
<AndamioSectionHeader
  title="Module Assignment"
  description="Complete this to demonstrate your understanding"
/>

// With icon and badge
<AndamioSectionHeader
  title="On-Chain Status"
  icon={<Blocks className="h-5 w-5" />}
  badge={<AndamioBadge>Verified</AndamioBadge>}
/>

// With action button
<AndamioSectionHeader
  title="Available Tasks"
  action={<AndamioButton>Add Task</AndamioButton>}
/>

// As h3 for subsections
<AndamioSectionHeader
  title="Lesson Details"
  as="h3"
/>
```

**Responsive Behavior**:
- h2: `text-xl sm:text-2xl`
- h3: `text-lg sm:text-xl`
- Layout: `flex-col sm:flex-row` when action is present
- Wraps gracefully with `flex-wrap` for long titles

---

### AndamioTableContainer

**Location**: `src/components/andamio/andamio-table-container.tsx`

**Purpose**: Responsive table wrapper with horizontal scrolling on mobile.

**Import**:
```tsx
import { AndamioTableContainer } from "~/components/andamio";
```

**Example**:

```tsx
<AndamioTableContainer>
  <AndamioTable>
    <AndamioTableHeader>
      <AndamioTableRow>
        <AndamioTableHead>Title</AndamioTableHead>
        <AndamioTableHead>Status</AndamioTableHead>
        <AndamioTableHead className="hidden md:table-cell">Details</AndamioTableHead>
      </AndamioTableRow>
    </AndamioTableHeader>
    <AndamioTableBody>
      {items.map((item) => (
        <AndamioTableRow key={item.id}>
          <AndamioTableCell>{item.title}</AndamioTableCell>
          <AndamioTableCell>{item.status}</AndamioTableCell>
          <AndamioTableCell className="hidden md:table-cell">{item.details}</AndamioTableCell>
        </AndamioTableRow>
      ))}
    </AndamioTableBody>
  </AndamioTable>
</AndamioTableContainer>
```

**Responsive Behavior**:
- `overflow-x-auto` for horizontal scrolling
- Use `hidden sm:table-cell` or `hidden md:table-cell` to hide columns on mobile

---

## Common Responsive Patterns

### Text Sizing

```tsx
// Page titles (h1)
className="text-2xl sm:text-3xl font-bold"
className="text-2xl xs:text-3xl sm:text-4xl font-bold"  // larger pages

// Section titles (h2)
className="text-xl sm:text-2xl font-semibold"

// Subsection titles (h3)
className="text-lg sm:text-xl font-semibold"

// Body text
className="text-sm sm:text-base"
className="text-base sm:text-lg"

// Descriptions
className="text-sm sm:text-base text-muted-foreground"

// Small/helper text
className="text-xs sm:text-sm text-muted-foreground"
```

### Flex Layout Stacking

```tsx
// Horizontal on desktop, stacked on mobile
<div className="flex flex-col sm:flex-row gap-4">
  <div>Left content</div>
  <div>Right content</div>
</div>

// With justify-between for header/action layouts
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <h2>Title</h2>
  <button>Action</button>
</div>
```

### Grid Layouts

```tsx
// Responsive grid columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Tabs that wrap
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
  <TabsTrigger>Tab 1</TabsTrigger>
  <TabsTrigger>Tab 2</TabsTrigger>
  <TabsTrigger>Tab 3</TabsTrigger>
  <TabsTrigger>Tab 4</TabsTrigger>
</div>
```

### Spacing

```tsx
// Responsive padding
className="px-4 sm:px-6 lg:px-8"
className="py-4 sm:py-6 lg:py-8"
className="p-4 sm:p-6"

// Responsive gaps
className="gap-2 sm:gap-4"
className="gap-4 sm:gap-6 lg:gap-8"

// Responsive spacing in flow content
className="space-y-4 sm:space-y-6"
```

### Hiding Elements

```tsx
// Hide on mobile, show on larger screens
className="hidden sm:block"
className="hidden md:flex"
className="hidden lg:table-cell"

// Show on mobile, hide on larger screens
className="sm:hidden"
className="md:hidden"

// Hide specific table columns on mobile
<AndamioTableCell className="hidden md:table-cell">
  {content}
</AndamioTableCell>
```

### Button/Badge Wrapping

```tsx
// Badges that wrap gracefully
<div className="flex flex-wrap gap-2">
  <AndamioBadge>Tag 1</AndamioBadge>
  <AndamioBadge>Tag 2</AndamioBadge>
  <AndamioBadge>Tag 3</AndamioBadge>
</div>

// Responsive button sizing
<AndamioButton className="w-full sm:w-auto">
  Action
</AndamioButton>
```

---

## Page Layout Patterns

### Standard Page Layout

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Page Title"
        description="Page description text"
      />

      <AndamioSectionHeader title="First Section" />
      <div>Section content...</div>

      <AndamioSectionHeader title="Second Section" />
      <div>Section content...</div>
    </div>
  );
}
```

### Page with Action Header

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Course Management"
        description="Manage your course content"
        action={
          <Link href="/studio/course/new">
            <AndamioButton>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </AndamioButton>
          </Link>
        }
      />

      {/* Content */}
    </div>
  );
}
```

### Unauthenticated State (Centered)

```tsx
if (!isAuthenticated) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <AndamioPageHeader
        title="Welcome to Andamio"
        description="Connect your wallet to access this feature"
        centered
      />
      <div className="w-full max-w-md">
        <AndamioAuthButton />
      </div>
    </div>
  );
}
```

### Error State

```tsx
if (error || !data) {
  return (
    <div className="space-y-6">
      <AndamioPageHeader title="Not Found" />

      <AndamioAlert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>
          {error ?? "Resource not found"}
        </AndamioAlertDescription>
      </AndamioAlert>
    </div>
  );
}
```

### Table Page

```tsx
export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Items"
        action={<AndamioButton>Add Item</AndamioButton>}
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Name</AndamioTableHead>
              <AndamioTableHead className="hidden sm:table-cell">Status</AndamioTableHead>
              <AndamioTableHead className="hidden md:table-cell">Details</AndamioTableHead>
              <AndamioTableHead className="w-24">Actions</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {items.map((item) => (
              <AndamioTableRow key={item.id}>
                <AndamioTableCell className="font-medium">{item.name}</AndamioTableCell>
                <AndamioTableCell className="hidden sm:table-cell">
                  <AndamioBadge>{item.status}</AndamioBadge>
                </AndamioTableCell>
                <AndamioTableCell className="hidden md:table-cell max-w-xs truncate">
                  {item.details}
                </AndamioTableCell>
                <AndamioTableCell>
                  <AndamioButton variant="ghost" size="sm">Edit</AndamioButton>
                </AndamioTableCell>
              </AndamioTableRow>
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
  );
}
```

---

## Customizing Breakpoints

To adjust breakpoints for your project, modify the values in `src/styles/globals.css`:

```css
@theme {
  /* Example: Larger mobile breakpoint */
  --breakpoint-xs: 420px;

  /* Example: Custom tablet size */
  --breakpoint-md: 800px;
}
```

Changes apply globally to all responsive utilities (`xs:`, `sm:`, `md:`, `lg:`, `xl:`, `2xl:`).

---

## Testing Responsive Layouts

1. **Browser DevTools**: Use responsive mode to test all breakpoints
2. **Real Devices**: Test on actual iPhone SE (375px) and tablets
3. **Key Checkpoints**:
   - 375px (xs) - Smallest supported width
   - 640px (sm) - Phone landscape / small tablet
   - 768px (md) - Tablet
   - 1024px (lg) - Laptop
   - 1280px (xl) - Desktop

---

## Checklist for New Pages

- [ ] Use `AndamioPageHeader` for the main page title
- [ ] Use `AndamioSectionHeader` for section titles (h2/h3)
- [ ] Wrap tables with `AndamioTableContainer`
- [ ] Hide non-essential table columns on mobile with `hidden sm:table-cell`
- [ ] Use `flex-col sm:flex-row` for side-by-side layouts
- [ ] Add responsive text sizing (`text-sm sm:text-base`)
- [ ] Test at 375px (minimum supported width)
- [ ] Test at all major breakpoints
