---
name: design-system
description: Andamio design system expertise with three modes - review routes for styling compliance, diagnose CSS specificity conflicts, or reference design patterns and guidelines.
---

# Design System

Comprehensive Andamio design system skill with three operational modes.

## Modes

| Mode | Command | Purpose |
|------|---------|---------|
| **Review** | `/design-system review` | Audit a route for styling compliance |
| **Diagnose** | `/design-system diagnose` | Debug CSS specificity conflicts |
| **Reference** | `/design-system` | Query design patterns and guidelines |

---

## Mode 1: Review (Route Audit)

Review a route and its components to confirm styling rules are correctly applied.

### Instructions

#### Step 1: Choose Review Mode

Ask the user which depth they prefer:

**Quick Scan** (recommended for new routes):
- Only checks the page file itself
- Looks at imports and catches ~80% of common issues
- Includes Tier 1 visual QA checks (alignment, grid, minimalism, loading/empty, layout stability)
- Fast, minimal context usage

**Full Review** (recommended for thorough audits):
- Recursively checks all imported components
- Includes Tier 1 + Tier 2 visual QA (screenshots at 3 viewports, click audit, visual noise scan)
- Requires dev server running — auto-escalates from Quick Scan when port 3000 responds
- Best for final review before release

#### Step 2: Identify the Route

Expect route in URL form: `/studio/course/aabbaabb` → `src/app/(app)/studio/course/[coursenft]/page.tsx`

If no route provided, ask for one. Routes are in `/src/app`.

#### Step 3: Collect Components

**Quick Scan**: Skip - only review the page file.

**Full Review**: Create a checklist of all Component import paths. Recursively review each component file until complete.

#### Step 4: Apply Rules

Work through each file. Apply rules from:
- [style-rules.md](./style-rules.md) - Core styling rules (23 rules)
- [visual-qa.md](./visual-qa.md) - Visual QA checklist (alignment, minimalism, stability)
- [semantic-colors.md](./semantic-colors.md) - No hardcoded colors
- [responsive-design.md](./responsive-design.md) - Andamio layout components
- [icon-system.md](./icon-system.md) - Centralized icons with semantic names

**Quick checks for each file:**
- Importing from `~/components/ui/`? → Change to `~/components/andamio/`
- Using raw `<p>` for UI text? → Change to `AndamioText`
- Using raw `<h1>`-`<h6>` without `AndamioHeading`? → Consider using `AndamioHeading`
- Using non-prefixed names (`Sheet` vs `AndamioSheet`)? → Use Andamio prefix
- Hardcoded colors (`text-green-600`)? → Use semantic (`text-success`)
- Inline loading skeletons? → Use `AndamioPageLoading`
- Inline empty states? → Use `AndamioEmptyState`
- Importing from `lucide-react`? → Change to `~/components/icons`

#### Step 5: Look for Extraction Candidates

Check [component-index.md](./component-index.md) for existing components. Only read [extracted-components.md](./extracted-components.md) if you need full usage details for a specific component.

#### Step 6: Run Typecheck

After changes: `npm run typecheck`

#### Step 7: Report

Show summary of changes and extraction recommendations.

---

## Mode 2: Diagnose (CSS Specificity)

Detect CSS specificity issues where global styles in `globals.css` override Tailwind utility classes.

### When to Use

- Tailwind utility classes seem to have no effect
- Unexplained styling issues
- After adding new global styles to `globals.css`

### Instructions

#### Step 1: Identify the Element

When a user reports "the style didn't apply", identify which HTML element is involved.

#### Step 2: Check Against Known Overrides

Review [global-overrides.md](./global-overrides.md) for known conflicts.

**Elements with global styles:**
| Element | Layer | Overridable? | Notes |
|---------|-------|--------------|-------|
| `<h1>`-`<h6>` | `@layer base` | **Yes** — utilities win | No `!important`. Use `AndamioHeading` for decoupled sizing |
| `<p>`, `<ul>`, `<ol>`, `<code>` | `.prose-content` only | N/A | No global styles — only styled inside `.prose-content` |
| Checkbox | Unlayered | **No** | Intentional brand override |
| Active tab | Unlayered | **No** | Intentional brand override |

#### Step 3: Recommend Alternatives

| Element | Situation | Solution |
|---------|-----------|----------|
| Headings | Need different visual size than semantic level | Use `AndamioHeading level={2} size="lg"` |
| `<p>` inside `.prose-content` | `max-width: 70ch` too narrow | Add `max-w-none` to the `<p>`, or move outside `.prose-content` |
| `<code>` inside `.prose-content` | Styled by `.prose-content` scope | Use `<span className="font-mono">` instead |
| `<input>` | No global overrides exist anymore | Use `AndamioInput` for consistency (not because of overrides) |

#### Step 4: Quick Diagnostic Commands

```bash
# Find headings with inline styles that may conflict with @layer base defaults
grep -n '<h[1-6].*style=' path/to/file.tsx

# Find raw <p> tags that should use AndamioText
grep -n '<p ' path/to/file.tsx | grep -v 'AndamioText'

# Find prose-content usage
grep -rn 'prose-content' path/to/file.tsx
```

### Output Format

```
## Global Style Conflict Detected

**Element**: `<code>`
**Applied class**: `text-[10px]`
**Overriding rule**: `globals.css` line 234-236

**Why it fails**: Global `text-sm` has higher specificity than Tailwind utilities.

**Solution**: Replace `<code className="text-[10px]">` with `<span className="font-mono text-[10px]">`
```

---

## Mode 3: Reference (Design System Knowledge)

Provide guidance about Andamio's design system, layout patterns, and theme rules.

### When to Use

- Designing new pages or components
- Understanding what can/cannot be customized
- Ensuring visual consistency
- Choosing the right layout pattern

### Key Principles

**Read [philosophy.md](./philosophy.md) first** — it defines the vision and six principles that guide every design decision.

| # | Principle | One-Liner |
|---|-----------|-----------|
| 1 | Invisible Infrastructure | The blockchain is the engine, never the dashboard |
| 2 | Clarity Over Cleverness | Every element answers "what is this?" and "what do I do next?" instantly |
| 3 | Earned Progression | The UI reflects demonstrated competence, not navigation skill |
| 4 | Moments of Commitment | The wallet appears only at genuine decision points |
| 5 | Breathing Room | Space creates hierarchy, separates ideas, and signals confidence |
| 6 | Accessibility is Not Optional | WCAG 2.1 AA minimum. No exceptions. |

### Documentation Files

| File | Contents |
|------|----------|
| [philosophy.md](./philosophy.md) | **Start here.** Design vision, six principles, accessibility standards |
| [layouts.md](./layouts.md) | Layout patterns (app shell, studio, master-detail, wizard) |
| [semantic-colors.md](./semantic-colors.md) | Color system and usage guidelines |
| [spacing.md](./spacing.md) | Spacing scales and consistent patterns |
| [components.md](./components.md) | Common component patterns |
| [cannot-customize.md](./cannot-customize.md) | What you CANNOT do |
| [responsive-design.md](./responsive-design.md) | Responsive layout components |
| [icon-system.md](./icon-system.md) | Centralized icon system |
| [component-index.md](./component-index.md) | Component quick reference (read first) |
| [extracted-components.md](./extracted-components.md) | Full component docs (read on-demand) |
| [route-reference.md](./route-reference.md) | Route patterns and examples |

### Quick Reference

**Layout Patterns**:
- App Shell: Sidebar + content area (standard app pages)
- Studio Layout: StudioHeader + workspace (creation/editing pages)
- Master-Detail: List panel + preview panel (Course Studio)
- Wizard: Outline panel + step content (Module Editor)

**Semantic Colors**:
| Color | Use For |
|-------|---------|
| `primary` | Links, active states, brand |
| `success` | Completed, on-chain, active |
| `warning` | Pending, caution |
| `info` | Informational, neutral |
| `destructive` | Errors, delete actions |
| `muted` | Secondary text, disabled |

**Spacing Scale**:
| Pattern | Use |
|---------|-----|
| `p-3` / `gap-3` | List containers |
| `p-4` | Content areas |
| `p-6` | Cards, sections |
| `px-3 py-3` | List items |

### Output Format

Provide clear, actionable guidance with:
1. Which pattern to use and why
2. Code examples from the codebase
3. Links to relevant documentation files
4. What NOT to do (anti-patterns)

---

## All Documentation Files

| File | Purpose |
|------|---------|
| [philosophy.md](./philosophy.md) | **Foundation.** Design vision, principles, accessibility |
| [style-rules.md](./style-rules.md) | Core styling rules (no custom styling, Andamio prefix) |
| [semantic-colors.md](./semantic-colors.md) | Color system and usage |
| [responsive-design.md](./responsive-design.md) | Responsive layout components |
| [icon-system.md](./icon-system.md) | Centralized icon imports |
| [component-index.md](./component-index.md) | Component quick reference |
| [extracted-components.md](./extracted-components.md) | Full component docs (on-demand) |
| [global-overrides.md](./global-overrides.md) | CSS specificity conflicts |
| [layouts.md](./layouts.md) | Layout patterns |
| [spacing.md](./spacing.md) | Spacing scale |
| [components.md](./components.md) | Component patterns |
| [cannot-customize.md](./cannot-customize.md) | Customization restrictions |
| [route-reference.md](./route-reference.md) | Route examples |

---

## Compound Engineering

CSS specificity bugs, hydration mismatches, and layout edge cases can eat hours. When you solve a styling problem, document it:

```bash
/workflows:compound
```

This captures the issue so others don't repeat the investigation.
