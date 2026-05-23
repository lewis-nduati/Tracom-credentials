# Visual QA Checklist

Two-tier checklist for pixel-perfect UI. Tier 1 runs on every review (code analysis). Tier 2 runs when the dev server is available (screenshot analysis).

---

## Tier 1: Code Analysis

Applied to every changed component in the diff. No browser required.

### Alignment

| Check | Catches |
|-------|---------|
| All items in a flex row use the same `text-*` size | Baseline misalignment |
| Conditional items use `gap-*` not `justify-between` | Uneven spacing when items are absent |
| Icons in rows have `shrink-0` | Icons compressing under flex pressure |
| Variable-width text has `min-w-0` + `truncate` | Text pushing siblings off-center |
| Fixed-width items (badges, counts) have `shrink-0` | Labels compressing instead of text truncating |

### Grid & Overflow

| Check | Catches |
|-------|---------|
| Cards in a grid use `h-full` on the outer card | Unequal card heights in a row |
| Card footers use `mt-auto` | Footer not pinned to bottom of card |
| Variable text has `truncate` or `line-clamp-*` | Text pushing layout wider than viewport |
| Containers with user-generated content have `min-w-0` | Flex items refusing to shrink |
| Consistent spacing scale (2/3/4/6/8) within a component | Ad-hoc spacing values that break rhythm |
| Grid columns reduce at mobile breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) | Fixed column counts breaking on small screens |
| No `hidden` without a responsive alternative | Content disappearing on mobile with no replacement |

### Minimalism

| Check | Catches |
|-------|---------|
| Every badge has an actionable purpose — if removing it doesn't reduce the user's ability to act, remove it | Decorative badges that add noise |
| Every displayed data point answers "what do I do next?" — if it doesn't, it's clutter | Information shown because it exists, not because it's needed |
| Max 3 clicks from any list view to the next action | Buried actions behind unnecessary navigation layers |
| No wrapper pages that just link to the real page | Dead-end intermediary screens |
| No duplicate information on the same screen (e.g., status in badge AND in text label) | Redundant UI elements |
| Confirm dialogs only for irreversible/destructive actions | Unnecessary friction on safe actions |
| Max 7 primary actions visible per screen — beyond that, the screen is trying to do too much | Cluttered action surfaces |

### Loading & Empty States

| Check | Catches |
|-------|---------|
| Loading skeletons match the real content's dimensions and layout | Skeleton that jumps to a different layout when content loads |
| Empty states use `AndamioEmptyState` with an action | Dead-end empty screens with no next step |
| Loading states use `AndamioPageLoading` or component-level skeletons, not inline spinners | Inconsistent loading patterns |
| Empty state text explains *why* it's empty and *what to do* | Vague empty messages ("Nothing here") |

### Layout Stability

| Check | Catches |
|-------|---------|
| Inline expansions (accordions, form reveals) don't shift the user's viewport anchor — use `scrollIntoView` or fixed-height containers | User loses position when a panel opens |
| Expandable sections taller than the viewport should open in a sheet/dialog instead of inline | Disorienting scroll from large inline expansions |
| Async content reserves space (skeleton height matches content height) | Layout shift when data arrives |
| Toasts and alerts overlay the page — never push content down | Viewport jump from notification insertion |
| After any state change (expand, collapse, save, delete), focus remains on or near the element the user interacted with | "Where am I?" disorientation after an action |

---

## Tier 2: Screenshot Analysis

Runs when the dev server is available (port 3000 responds). Navigate each affected route and capture screenshots at 3 viewports.

### Viewports

| Viewport | Width | Focus |
|----------|-------|-------|
| Mobile | 375px | Touch targets, single-column layout, text overflow |
| Tablet | 768px | Grid breakpoint transitions, sidebar collapse |
| Desktop | 1280px | Max-width behavior, card grid alignment, whitespace |

### Visual Checks

For each screenshot:
- Cards in a row have equal visual heights
- Footer items are horizontally aligned across all cards in a row
- No horizontal scrollbar at any viewport
- Text doesn't overflow its container
- Spacing between sections is visually consistent

### Click Audit

Trace the path from browse to action for the affected flow:
1. Start at the list/browse page
2. Navigate to the target entity
3. Perform the primary action

Count clicks. Flag if >3. Document the path.

### Visual Noise Scan

For each screenshot, identify elements that could be removed without losing the user's ability to:
- Understand the current state
- Take the next action
- Navigate back

If an element fails all three, flag it for removal.
