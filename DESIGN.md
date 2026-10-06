# Design System

Generated from: `src/styles/globals.css`, `src/components/andamio/`, `src/app/layout.tsx`

---

## Color Palette

Strategy: **the Record.** Warm paper and ink, with Tracom brand navy as the one strong colour. Status colours are semantic. Depth comes from rules (hairlines) and background steps, never shadows. Every text pair is checked for WCAG AA by `src/styles/tokens.test.ts`; a token change that breaks contrast fails the test suite.

All values in OKLCH.

### Light mode ("paper")

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Background | `--background` | `oklch(0.973 0.007 85)` | Warm paper (~`#F7F5F0`) |
| Foreground | `--foreground` | `oklch(0.21 0.015 260)` | Ink |
| Card | `--card` | `oklch(0.988 0.004 85)` | Slightly lighter paper |
| Primary | `--primary` | `oklch(0.282 0.09 252)` | Brand navy `#1A3D6B` |
| Secondary | `--secondary` | `oklch(0.42 0.1 252)` | Lighter navy |
| Muted | `--muted` | `oklch(0.945 0.011 85)` | Darker paper band |
| Muted text | `--muted-foreground` | `oklch(0.47 0.02 70)` | Warm grey, AA on paper |
| Accent | `--accent` | `oklch(0.93 0.014 85)` | Hover wash |
| Border | `--border` | `oklch(0.87 0.018 85)` | Warm hairline |
| Sidebar | `--sidebar` | `oklch(0.282 0.09 252)` | Navy spine |
| Sidebar marker | `--sidebar-primary` | `oklch(0.71 0.105 88)` | Credential gold rule on the active item |

### Dark mode ("night record")

Navy-charcoal paper (`--background: oklch(0.19 0.02 255)`), warm off-white ink (`oklch(0.93 0.012 85)`), primary navy lightened to `oklch(0.78 0.08 252)` with dark text on it. The spine goes darker than the page (`oklch(0.155 0.03 255)`).

---

## Typography

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Serif (titles, names) | Newsreader | 400, 500 | `--font-newsreader` → `font-serif`. Page titles, people's aliases, course and credential names. Nothing else. |
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

Base: `0.25rem` (4px). Square, like paper. `rounded-sm` (2px) for banners and rows, `rounded-lg` (4px) for cards.

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

Record pages separate content with rules, not boxes or shadows.

No large drop shadows. No glassmorphism. Depth is expressed through background color difference (card vs. muted vs. sidebar), not elevation.

---

## Components

### Record building blocks

The Record redesign (spec: `docs/superpowers/specs/2026-10-06-record-redesign-design.md`) adds:

| Component | Use |
|-----------|-----|
| `AndamioRecordHeader` | Every page heading: small-caps label, serif title, meta line, navy rule |
| `AndamioSectionLabel` | Small-caps navy label for a section |
| `AndamioLedger` / `AndamioLedgerRow` | Ruled lists instead of card grids; `AndamioLedgerEmpty`, `AndamioLedgerSkeleton` for states |
| `AndamioNextStep` | Navy banner with the single next action |
| `AndamioPathTimeline` | Milestones, filled when done, hollow when to come |
| `AndamioRecordLayout` / `AndamioRecordSection` | Main column plus margin column; margin drops below under 1024px |

**Rules for every page:**
- Start with `AndamioRecordHeader`.
- Lists are ledgers, not card grids. Cards only for real objects, such as a credential.
- Secondary information goes in the margin column when the page is wide enough.
- Status is written in words; colour only supports it.
- Serif only for names of people, courses and credentials.
- Semantic tokens only.

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

Sidebar: the navy spine (`--sidebar`), serif wordmark, small-caps index groups (Record, Catalogue, Studio), active item marked by a gold rule. App content area: paper (`--background`). There is no top status bar; phones get a slim paper top bar with the menu.

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
