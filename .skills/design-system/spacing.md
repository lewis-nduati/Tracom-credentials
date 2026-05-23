# Spacing System

Consistent spacing patterns across the application.

## Core Principle

**Use established spacing values. Never invent custom values.**

---

## Spacing Scale (Tailwind)

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` / `p-1` | 4px | Tight inline spacing |
| `gap-2` / `p-2` | 8px | Compact elements |
| `gap-3` / `p-3` | 12px | List containers, list items |
| `gap-4` / `p-4` | 16px | Content areas, cards |
| `gap-6` / `p-6` | 24px | Section spacing, large cards |
| `gap-8` / `p-8` | 32px | Major section breaks |

---

## Established Patterns

### List Containers
```tsx
// Container for selectable items
<div className="flex flex-col gap-3 p-3">
  {items.map(...)}
</div>
```

### List Items
```tsx
// Selectable list item
<button className="flex items-center gap-3 px-3 py-3 rounded-lg">
  <div className="h-8 w-8">...</div>
  <div className="flex-1">...</div>
</button>
```

### Content Areas
```tsx
// Main content wrapper
<div className="p-4">
  {children}
</div>

// With scroll area
<AndamioScrollArea className="h-full">
  <div className="p-4">
    {children}
  </div>
</AndamioScrollArea>
```

### Page Layout
```tsx
// Standard page spacing
<div className="space-y-6">
  <AndamioPageHeader ... />
  <section>...</section>
  <section>...</section>
</div>
```

### Card Content
```tsx
<AndamioCard>
  <AndamioCardHeader>  {/* p-6 built-in */}
    <AndamioCardTitle>...</AndamioCardTitle>
  </AndamioCardHeader>
  <AndamioCardContent>  {/* p-6 pt-0 built-in */}
    ...
  </AndamioCardContent>
</AndamioCard>
```

### Panel Footer
```tsx
// Footer with border separator
<div className="border-t border-border px-3 py-2 bg-muted/30">
  ...
</div>
```

---

## Horizontal Spacing Patterns

### Icon + Text
```tsx
// Standard icon-text gap
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  <span>Label</span>
</div>

// Larger icon-text gap
<div className="flex items-center gap-3">
  <div className="h-8 w-8">...</div>
  <span>Label</span>
</div>
```

### Button Groups
```tsx
// Action buttons
<div className="flex items-center gap-2">
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioButton>Save</AndamioButton>
</div>
```

### Badge Groups
```tsx
<div className="flex items-center gap-2">
  <AndamioBadge>Tag 1</AndamioBadge>
  <AndamioBadge>Tag 2</AndamioBadge>
</div>
```

---

## Vertical Spacing Patterns

### Section Spacing
```tsx
// Between major sections
<div className="space-y-6">
  <section>...</section>
  <section>...</section>
</div>

// Between related items
<div className="space-y-4">
  <Item />
  <Item />
</div>

// Tight vertical spacing
<div className="space-y-2">
  <Label />
  <Input />
</div>
```

### Form Fields
```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <AndamioLabel>Name</AndamioLabel>
    <AndamioInput />
  </div>
  <div className="space-y-2">
    <AndamioLabel>Description</AndamioLabel>
    <AndamioTextarea />
  </div>
</div>
```

---

## Icon Sizing

| Context | Icon Class | Container |
|---------|------------|-----------|
| Inline text | `h-4 w-4` | - |
| List item status | `h-4 w-4` | `h-8 w-8 rounded-md` |
| Button icon | `h-4 w-4` | - |
| Section header | `h-5 w-5` | - |
| Feature icon | `h-6 w-6` | - |
| Hero icon | `h-8 w-8` | - |

---

## Responsive Spacing

```tsx
// Stack on mobile, row on larger
<div className="flex flex-col sm:flex-row gap-4">

// Tighter on mobile
<div className="p-4 sm:p-6">

// Grid adjustments
<div className="grid gap-4 md:gap-6">
```

---

## Anti-Patterns

**DO NOT**:
```tsx
// Arbitrary values
className="p-[13px]"
className="gap-[7px]"
className="mt-[22px]"

// Mixing patterns
<div className="gap-2 p-5">  // Inconsistent scale

// Over-spacing
<div className="p-8">  // Too much for list items

// Under-spacing
<div className="p-1">  // Too tight for content areas
```

**DO**:
```tsx
// Use the scale
className="p-3"
className="gap-4"
className="mt-6"
```

---

## Quick Reference

| Context | Container | Item | Icon |
|---------|-----------|------|------|
| Selectable list | `gap-3 p-3` | `px-3 py-3` | `h-8 w-8` |
| Content area | `p-4` | - | - |
| Card | built-in `p-6` | - | - |
| Page sections | `space-y-6` | - | - |
| Form fields | `space-y-4` | `space-y-2` | - |
| Button groups | `gap-2` | - | `h-4 w-4` |
