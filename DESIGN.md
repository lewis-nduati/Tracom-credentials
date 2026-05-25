# Design System

Generated from: `src/styles/globals.css`, `src/components/andamio/`, `src/app/layout.tsx`

---

## Color Palette

Strategy: **Restrained** — tinted neutrals with one saturated primary (blue). Status colors used semantically. The navy `#1A3D6B` from the Tracom brand logo should be mapped to CSS variables, not hardcoded.

All values in OKLCH. Do not add chroma at extreme lightness.

### Light Mode

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Background | `--background` | `oklch(1 0 0)` | Pure white — could benefit from subtle warm tint (chroma ~0.005) |
| Foreground | `--foreground` | `oklch(0.145 0 0)` | Near-black — currently untinted |
| Card | `--card` | `oklch(1 0 0)` | Same as background |
| Primary | `--primary` | `oklch(0.546 0.211 255)` | Tracom blue |
| Secondary | `--secondary` | `oklch(0.387 0.134 250.505)` | Deep blue |
| Muted | `--muted` | `oklch(0.985 0.002 106.423)` | Warm-tinted surface |
| Accent | `--accent` | `oklch(0.988 0.008 79.439)` | Warm cream — sidebar, highlights |
| Sidebar | `--sidebar` | `oklch(0.988 0.008 79.439)` | Warm cream — matches accent |
| Border | `--border` | `oklch(0.922 0.003 106.423)` | Subtle, warm-tinted |
| Success | `--success` | `oklch(0.52 0.15 160)` | Green |
| Warning | `--warning` | `oklch(0.75 0.16 70)` | Amber |
| Destructive | `--destructive` | `oklch(0.608 0.227 27.325)` | Red |
| Info | `--info` | `oklch(0.55 0.15 250)` | Info blue |

**Brand navy** (Tracom logo color): `#1A3D6B` ≈ `oklch(0.282 0.09 252)`. Not yet a CSS token. Avoid hardcoding — add as `--brand-navy` or map to `--secondary`.

### Dark Mode

Background: `oklch(0.188 0.013 257.128)` — deep blue-dark. This is well-tinted toward the brand.

Primary shifts from `0.546` to `0.68` in dark mode — correct lightness boost.

---

## Typography

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Sans (body, UI) | Inter | 300, 400, 500, 600, 700, 800 | `--font-inter` via Next.js |
| Mono (code, addresses, hashes) | Geist Mono | default | `--font-geist-mono` |

**Scale** (heading defaults from globals.css):
| Level | Size | Weight | Letter-spacing |
|-------|------|--------|---------------|
| h1 | 1.875rem → 2.25rem → 3rem | 700 | -0.025em |
| h2 | 1.5rem → 1.875rem | 700 | -0.025em |
| h3 | 1.125rem | 600 | -0.025em |
| h4 | 1rem | 500 | none |
| h5 | 0.875rem | 500 | none |
| h6 | 0.75rem | 500 | 0.05em uppercase |

Body text: 1rem (16px), leading-relaxed. Max-width in prose: 70ch.

Mono is used for: wallet addresses, transaction hashes, policy IDs, network indicator, the `PREPROD` badge.

---

## Spacing

Base unit: `0.25rem` (4px). All spacing follows Tailwind scale.

| Pattern | Value | Usage |
|---------|-------|-------|
| `gap-3` / `p-3` | 12px | List containers, compact rows |
| `p-4` | 16px | Content areas, standard card padding |
| `p-6` | 24px | Section padding, prominent cards |
| `space-y-6` | 24px | Top-level page section stacking |
| `space-y-4` | 16px | Sub-section stacking |
| `gap-6` | 24px | Grid gaps |

---

## Radius

Base: `0.5rem` (8px).

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Tags, badges |
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Cards (default) |
| `rounded-xl` | 12px | Large feature cards |

---

## Motion

| Token | Timing | Duration | Usage |
|-------|--------|----------|-------|
| `--ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | 300ms | General transitions |
| `--ease-emphasized` | cubic-bezier(0.83, 0, 0.17, 1) | 500ms | Deliberate reveals |
| `--ease-decelerated` | cubic-bezier(0, 0, 0.2, 1) | 300ms | Elements entering |
| `--ease-accelerated` | cubic-bezier(0.4, 0, 1, 1) | 150ms | Elements leaving |

Utility classes: `.transition-standard`, `.transition-emphasized`, `.animate-in-fade`, `.animate-in-slide-up`.

Reduced motion is handled globally via `@media (prefers-reduced-motion: reduce)` — preserve this in all animation work.

---

## Elevation / Shadows

Cards use a minimal double shadow: `0 1px 3px / 0 1px 2px -1px` at 4% opacity (nearly invisible, just enough depth).

No large drop shadows. No glassmorphism. Depth is expressed through background color difference (card vs. muted vs. sidebar), not elevation.

---

## Components

### Button

`AndamioButton` — wraps shadcn `Button`. Always `font-semibold`. Loading state with spinner. Left/right icon slots.

Variants: `default` (primary fill), `secondary`, `outline`, `ghost`, `destructive`, `link`.

### Card

`AndamioCard` — wraps shadcn `Card`. Optional `hoverable` prop adds `hover-lift hover-glow`. Card content uses flex-col gap.

Do not nest cards. Cards are for standalone content units only.

### Typography

`AndamioHeading` — semantic heading with visual size decoupled. `AndamioText` — paragraph/body text. Never use raw `<h1>`-`<h6>` or `<p>` for UI text (only inside `.prose-content` or `.editor-content`).

### Status / Feedback

`AndamioAlert` — success/warning/destructive/info variants using semantic colors. `AndamioEmptyState` — centralized empty state with icon, title, description, optional action.

### Table

Headers: `text-muted-foreground`, `bg-muted/50`, `uppercase`, `text-xs`, `tracking-wider`. Cells: `text-sm`, `px-4 py-3`.

### Tabs

Active tab: `bg-foreground text-background` (inverted). Inactive: `text-muted-foreground`. This is an unlayered brand override — do not add hover states that conflict with this.

---

## Layout Patterns

Four patterns used in this app:

| Pattern | Where | Key characteristic |
|---------|-------|-------------------|
| App Shell | `/(app)/*` | Sidebar + scrollable content area |
| Studio Layout | `/(studio)/*` | `StudioHeader` + workspace |
| Master-Detail | Course Studio | List panel + preview panel |
| Wizard | Module Editor | Outline panel + step content |

Sidebar background: warm cream (`--sidebar`). App content area: white (`--background`).

---

## Resolved Issues

1. ~~**Landing page uses hardcoded values**~~ — Fixed: all `bg-[#1A3D6B]`, `bg-white`, `bg-slate-50`, `text-slate-*`, `border-slate-*` replaced with semantic tokens.
2. ~~**No brand-navy token**~~ — Fixed: `--brand-navy: oklch(0.282 0.09 252)` added to `:root`, `.dark`, and `@theme inline`.
3. ~~**Raw HTML elements in landing**~~ — Fixed: hero `<h1>` → `AndamioHeading level={1} size="5xl"`, proof card `<h3>` → `AndamioHeading level={3} size="base"`, proof cards → `AndamioCard`.
4. ~~**Dashboard h2 section labels with custom classes**~~ — Fixed: replaced with `AndamioText variant="overline"`.
5. ~~**Raw `Button` import in project page**~~ — Fixed: replaced with `AndamioButton`.

## Remaining Issues

1. **Background tinting**: `--background` is pure `oklch(1 0 0)`. A very subtle warm tint (chroma ~0.005) would add warmth consistent with muted/accent/sidebar surfaces. Intentionally deferred — affects all pages.
2. **Raw shadcn imports in complex auth/layout components**: `connect-wallet-button.tsx`, `mobile-nav.tsx`, `sidebar-user-section.tsx` import directly from `~/components/ui/`. These are complex multi-primitive components requiring dedicated migration.
3. **Lucide-react imports in editor components**: `EditorToolbar.tsx`, `AndamioBubbleMenus/index.tsx`, `AndamioFixedToolbar/index.tsx` import from `lucide-react` directly. Editor components are a separate migration scope.
4. **Raw `<p>` in `connect-wallet-button.tsx`** and some studio pages — low priority, not in primary user flows.
