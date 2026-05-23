# Global Style Overrides Reference

This document catalogs the CSS cascade layer architecture in `src/styles/globals.css` and explains how global styles interact with Tailwind utility classes.

**Last Updated**: February 19, 2026

---

## CSS Cascade Layer Order

Tailwind v4 uses cascade layers. Lower layers lose to higher layers. Unlayered CSS beats all layers.

```
@layer base        → Heading defaults, body reset (LOWEST priority)
@layer components  → .prose-content, card/table augmentation
@layer utilities   → .focus-ring, .hover-lift, etc.
(unlayered)        → Brand overrides: tabs, checkbox (HIGHEST priority)
```

**Key implication:** Tailwind utility classes (in `@layer utilities`) override everything in `@layer base` and `@layer components` without needing `!important`.

---

## `@layer base` — Heading Defaults

**Location**: `globals.css` lines 200-313

Headings h1-h6 have base defaults. These are **freely overridable** by Tailwind utilities — no `!important` is used.

```css
h1 {
  font-size: 1.875rem;   /* overridable with text-* */
  line-height: 2.25rem;  /* overridable with leading-* */
  font-weight: 700;      /* overridable with font-* */
  letter-spacing: -0.025em;
  color: var(--foreground);
  margin-bottom: 1.5rem;
  margin-top: 0;
}
/* Similar patterns for h2-h6, all without !important */
```

**Responsive sizes**: h1 scales up at `sm:` (2.25rem) and `md:` (3rem) breakpoints. h2 scales up at `sm:`.

**Override with utilities:**
```tsx
// ✅ These all work — utilities beat @layer base
<h1 className="text-sm">Small heading</h1>
<h2 className="mb-0 mt-0">No margins</h2>
<h3 className="font-normal">Light weight</h3>
```

**Or use AndamioHeading** to decouple semantic level from visual size:
```tsx
import { AndamioHeading } from "~/components/andamio";

// Semantic h2, visually sized as xl
<AndamioHeading level={2} size="xl">Section Title</AndamioHeading>
```

---

## `@layer components` — Scoped Content Styles

### `.prose-content` — Typography Scope

**Location**: `globals.css` lines 329-366

Rich text styles (paragraphs, lists, blockquotes, code) are **scoped inside `.prose-content`** and do NOT apply globally.

```css
.prose-content {
  & p    { text-base, leading-relaxed, max-width: 70ch, mb-4 }
  & ul   { list-disc, ml-6, mb-4, space-y-1.5 }
  & ol   { list-decimal, ml-6, mb-4, space-y-1.5 }
  & li   { leading-relaxed }
  & blockquote { border-l-2, italic, text-muted-foreground }
  & code { bg-muted, px-1.5, py-0.5, text-sm, font-mono, rounded-md }
  & pre  { bg-muted, p-4, rounded-lg, border }
}
```

**When to use `.prose-content`:**
- Content-heavy sections with multiple paragraphs
- Rendered markdown/editor output
- Help text, descriptions, documentation sections

**When NOT to use `.prose-content`:**
- UI components (buttons, cards, forms)
- Single labels or descriptions — use `AndamioText` instead
- Anywhere you want precise control over spacing

```tsx
// ✅ Content section with styled paragraphs and lists
<div className="prose-content">
  <p>This paragraph gets max-width: 70ch and proper spacing.</p>
  <ul>
    <li>Styled list with markers and indent.</li>
  </ul>
</div>

// ✅ UI text — use AndamioText, NOT prose-content
<AndamioText variant="muted">Helper text for a form field</AndamioText>
```

### Card & Table Augmentation

**Location**: `globals.css` lines 611-663

shadcn cards and tables get augmented styles via `[data-slot]` selectors:

| Selector | Effect |
|----------|--------|
| `[data-slot="card"]` | Subtle box-shadow |
| `[data-slot="card-content"]` | `flex-col gap-4` |
| `[data-slot="card-title"]` | `text-lg font-semibold tracking-tight` |
| `[data-slot="table-head"]` | Uppercase, smaller text, muted bg |
| `[data-slot="table-cell"]` | Standard padding, border-bottom |

These are all in `@layer components`, so Tailwind utilities can override them.

---

## `@layer utilities` — Custom Utility Classes

**Location**: `globals.css` lines 669-685

| Class | Effect | Use For |
|-------|--------|---------|
| `.focus-ring` | `ring-2 ring-ring ring-offset-2` | Custom focus indicators |
| `.hover-lift` | `hover:-translate-y-0.5` | Subtle hover lift effect |
| `.hover-glow` | `hover:shadow-md` | Shadow on hover |
| `.touch-target` | `min-h-[2.75rem] min-w-[2.75rem]` (mobile only) | Mobile tap targets |

```tsx
// ✅ Use these utility classes
<button className="hover-lift hover-glow">Hoverable button</button>
<a className="focus-ring">Focusable link</a>
<button className="touch-target">Mobile-friendly tap target</button>
```

---

## Unlayered — Brand Overrides

**Location**: `globals.css` lines 694-713

These are intentionally outside `@layer` so they override shadcn defaults. No `!important` needed — unlayered CSS beats all `@layer` rules.

| Selector | Effect | Purpose |
|----------|--------|---------|
| `[data-slot="checkbox"]` | `border: 1px solid var(--foreground)` | High-contrast checkbox border for accessibility |
| `[data-slot="tabs-trigger"][data-state="active"]` | Foreground bg, background text, shadow | Brand-styled active tab |

**These cannot be overridden** with Tailwind utilities (unlayered beats utilities layer).

---

## Scoped Editor Styles

### `.editor-content` — Rendered Tiptap Output

**Location**: `globals.css` lines 372-398

Uses `@tailwindcss/typography` prose classes for rendered editor content. Only affects elements inside `.editor-content`.

### `.ProseMirror` — Live Editor

**Location**: `globals.css` lines 430-602

Comprehensive styles for the live Tiptap editor. Only affects the editor itself — no impact on the rest of the app.

---

## Quick Reference Card

| Element | Has Global Styles? | Overridable? | Notes |
|---------|-------------------|--------------|-------|
| `<h1>`-`<h6>` | Yes (`@layer base`) | **Yes** — utilities win | Or use `AndamioHeading` |
| `<p>`, `<ul>`, `<ol>`, `<li>` | **Only inside `.prose-content`** | Yes | No global styles outside `.prose-content` |
| `<blockquote>`, `<code>`, `<pre>` | **Only inside `.prose-content`** | Yes | No global styles outside `.prose-content` |
| `<input>`, `<textarea>`, `<select>` | **None** | N/A | Use `AndamioInput`, `AndamioTextarea`, etc. |
| `<form>`, `<label>`, `<section>` | **None** | N/A | No global styles |
| Cards (`[data-slot="card"]`) | Yes (`@layer components`) | **Yes** — utilities win | Subtle shadow, content gap |
| Tables (`[data-slot="table"]`) | Yes (`@layer components`) | **Yes** — utilities win | Border, header styling |
| Checkbox | Yes (unlayered) | **No** | Intentional brand override |
| Active tab | Yes (unlayered) | **No** | Intentional brand override |

---

## Adding New Global Styles

Before adding new global styles to `globals.css`:

1. **Consider scope**: Can this be a component instead?
2. **Use the right layer**: `@layer base` for element defaults, `@layer components` for class-based augmentation, `@layer utilities` for reusable utilities
3. **Never use `!important`**: Layer ordering handles specificity
4. **Prefer scoping**: Use class selectors (`.prose-content`) over element selectors
5. **Document the addition**: Update this file
