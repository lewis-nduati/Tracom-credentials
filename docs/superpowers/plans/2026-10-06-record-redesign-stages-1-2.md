# Record Redesign, Stages 1–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the signed-in app the "Record" look (paper and navy, Newsreader serif, ruled ledgers, a navy sidebar spine, no blue status bar) and rebuild the dashboard as a record with a next step and a path, without losing any feature.

**Architecture:** Stage 1 retunes the global design tokens in `globals.css` so every existing component changes at once, adds six presentational `Andamio*` building blocks, and rebuilds the shell (sidebar, mobile bar, status-bar removal). Stage 2 adds two pure, tested functions (`getNextStep`, `getCoursePaths`) and recomposes the dashboard from new section components that read the existing `useDashboardData()` context.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS v4 (CSS-first `@theme`), shadcn/ui via `~/components/andamio`, `next/font/google`, `node:test` + `tsx` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-06-record-redesign-design.md`

---

## Repo rules the engineer must follow (from AGENTS.md and the design-system skill)

- Icons only from `~/components/icons`. Never `lucide-react`.
- UI only from `~/components/andamio` (never `~/components/ui` in pages). New shared components get the `Andamio` prefix and are exported from `src/components/andamio/index.ts`.
- Semantic colour tokens only (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-sidebar`…). No `text-blue-600`, no hex in components.
- No raw `<p className=…>`: use `AndamioText`. Headings through `AndamioHeading`.
- Never name a variable `module`.
- Copy: sentence case, no exclamation marks, no jargon (PRODUCT.md).
- Commits go straight to `main`, ending with the two attribution lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_018Cxv2eNxcKHYPq1cJBuTPz
  ```
- Checks: `npm run typecheck`, `npx eslint <changed paths>`, `npm run test:unit` (runs every `src/**/*.test.ts` with `node:test`).

## File map

Stage 1
- Modify `src/app/layout.tsx`: load Newsreader as `--font-newsreader`.
- Modify `src/styles/globals.css`: `--font-serif` in `@theme`; new light and dark token values; radius.
- Create `src/lib/oklch.ts` + `src/lib/oklch.test.ts`: OKLCH → sRGB contrast maths.
- Create `src/styles/tokens.test.ts`: reads `globals.css`, asserts AA for the key pairs.
- Create `src/components/andamio/andamio-section-label.tsx`
- Create `src/components/andamio/andamio-record-header.tsx`
- Create `src/components/andamio/andamio-ledger.tsx`
- Create `src/components/andamio/andamio-next-step.tsx`
- Create `src/components/andamio/andamio-path-timeline.tsx`
- Create `src/components/andamio/andamio-record-layout.tsx`
- Modify `src/components/andamio/index.ts`: export the six.
- Create `src/hooks/auth/use-session-expiry.ts`: countdown logic moved out of the status bar.
- Create `src/components/layout/theme-toggle.tsx`
- Create `src/components/layout/auth-notice.tsx`: auth error / popup-blocked retry, moved out of the status bar.
- Create `src/components/layout/mobile-top-bar.tsx`
- Modify `src/components/layout/sidebar-header.tsx`: serif wordmark.
- Modify `src/components/layout/sidebar-nav-section.tsx`: index-style items.
- Modify `src/components/layout/sidebar-user-section.tsx`: theme toggle + auth notice in the spine footer.
- Modify `src/components/layout/mobile-nav.tsx`: trigger styling, drawer header.
- Modify `src/components/layout/app-layout.tsx` and `studio-layout.tsx`: drop `AuthStatusBar`, add `MobileTopBar`, paper main area.
- Modify `src/config/navigation.ts`: section titles Record / Catalogue / Studio.
- Delete `src/components/layout/auth-status-bar.tsx`.
- Modify `DESIGN.md`.

Stage 2
- Create `src/lib/course-path.ts` + `src/lib/course-path.test.ts`
- Create `src/lib/next-step.ts` + `src/lib/next-step.test.ts`
- Create `src/components/dashboard/record/admission.tsx`
- Create `src/components/dashboard/record/courses-ledger.tsx`
- Create `src/components/dashboard/record/projects-unlocking.tsx`
- Create `src/components/dashboard/record/duties-ledger.tsx`
- Create `src/components/dashboard/record/contributing-ledger.tsx`
- Create `src/components/dashboard/record/path-panel.tsx`
- Create `src/components/dashboard/record/accomplishments-panel.tsx`
- Create `src/components/dashboard/record/record-details.tsx`
- Create `src/components/dashboard/record/dashboard-next-step.tsx`
- Modify `src/app/(app)/dashboard/page.tsx`
- Delete replaced widgets once nothing imports them (Task 21).

---

# Stage 1: Foundation and shell

### Task 1: Load Newsreader

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/styles/globals.css` (the `@theme` block, top of file)

- [ ] **Step 1: Add the font in `src/app/layout.tsx`**

Change the import line and add the font next to `inter`:

```tsx
import { Inter, Geist_Mono, Newsreader } from "next/font/google";
```

```tsx
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500"],
  display: "swap",
});
```

And add it to the `<html>` className:

```tsx
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
```

- [ ] **Step 2: Expose `font-serif` in `src/styles/globals.css`**

Inside `@theme { … }`, after `--font-mono`, add:

```css
  --font-serif:
    var(--font-newsreader), ui-serif, Georgia, "Times New Roman", serif;
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no output after `tsc --noEmit` (success).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/styles/globals.css
git commit -m "feat: load Newsreader as the serif face"
```

### Task 2: Contrast maths (OKLCH → sRGB)

**Files:**
- Create: `src/lib/oklch.ts`
- Test: `src/lib/oklch.test.ts`

- [ ] **Step 1: Write the failing test** (`src/lib/oklch.test.ts`)

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseOklch, contrastRatio } from "./oklch";

describe("parseOklch", () => {
  it("reads lightness, chroma and hue", () => {
    assert.deepEqual(parseOklch("oklch(0.282 0.09 252)"), { l: 0.282, c: 0.09, h: 252 });
  });

  it("rejects anything that is not oklch", () => {
    assert.throws(() => parseOklch("#ffffff"));
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    const ratio = contrastRatio("oklch(0 0 0)", "oklch(1 0 0)");
    assert.ok(Math.abs(ratio - 21) < 0.1, `got ${ratio}`);
  });

  it("is 1 for a colour against itself", () => {
    const ratio = contrastRatio("oklch(0.5 0.1 250)", "oklch(0.5 0.1 250)");
    assert.ok(Math.abs(ratio - 1) < 0.01, `got ${ratio}`);
  });

  it("puts brand navy on white well above AA", () => {
    assert.ok(contrastRatio("oklch(0.282 0.09 252)", "oklch(1 0 0)") > 10);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/oklch.test.ts`
Expected: FAIL, cannot find module `./oklch`.

- [ ] **Step 3: Implement** (`src/lib/oklch.ts`)

```ts
/**
 * OKLCH colour maths, used only by tests to check that design tokens meet
 * WCAG 2.1 AA contrast. Converts OKLCH → OKLab → linear sRGB (clamped) and
 * applies the WCAG relative-luminance formula.
 */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export function parseOklch(value: string): Oklch {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!match) throw new Error(`Not an oklch() colour: ${value}`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

function toLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    clamp(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    clamp(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
}

export function relativeLuminance(value: string): number {
  const [r, g, b] = toLinearSrgb(parseOklch(value));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/oklch.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/oklch.ts src/lib/oklch.test.ts
git commit -m "test: add OKLCH contrast maths for token checks"
```

### Task 3: Paper and night-record tokens (with an AA test)

**Files:**
- Create: `src/styles/tokens.test.ts`
- Modify: `src/styles/globals.css` (the `:root` block and the `.dark` block)

- [ ] **Step 1: Write the failing test** (`src/styles/tokens.test.ts`)

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio } from "~/lib/oklch";

const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

/** Last value of a custom property inside the first `selector { … }` block. */
function token(selector: ":root" | ".dark", name: string): string {
  const start = css.indexOf(`\n${selector} {`);
  assert.ok(start >= 0, `${selector} block not found`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const matches = [...block.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))];
  assert.ok(matches.length > 0, `--${name} not set in ${selector}`);
  return matches[matches.length - 1]![1]!.trim();
}

const AA = 4.5;
const pairs: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["secondary-foreground", "secondary"],
  ["sidebar-foreground", "sidebar"],
];

for (const theme of [":root", ".dark"] as const) {
  describe(`tokens in ${theme}`, () => {
    for (const [fg, bg] of pairs) {
      it(`${fg} on ${bg} meets AA`, () => {
        const ratio = contrastRatio(token(theme, fg), token(theme, bg));
        assert.ok(ratio >= AA, `${fg} on ${bg}: ${ratio.toFixed(2)} < ${AA}`);
      });
    }
  });
}

describe("paper look", () => {
  it("light background is warm paper, not pure white", () => {
    assert.notEqual(token(":root", "background"), "oklch(1 0 0)");
  });

  it("light primary is brand navy", () => {
    assert.equal(token(":root", "primary"), "oklch(0.282 0.09 252)");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/styles/tokens.test.ts`
Expected: FAIL on "paper look" (background is still `oklch(1 0 0)`, primary is still bright blue).

- [ ] **Step 3: Replace the light tokens**

In `src/styles/globals.css`, in the `:root` block, set `--radius` and replace every value from `--background` down to `--sidebar-ring` with:

```css
  --radius: 0.25rem;

  /* Base: warm paper and ink */
  --background: oklch(0.973 0.007 85);
  --foreground: oklch(0.21 0.015 260);

  /* Cards: slightly lighter paper */
  --card: oklch(0.988 0.004 85);
  --card-foreground: oklch(0.21 0.015 260);

  --popover: oklch(0.988 0.004 85);
  --popover-foreground: oklch(0.21 0.015 260);

  /* Primary: Tracom brand navy */
  --primary: oklch(0.282 0.09 252);
  --primary-foreground: oklch(0.985 0.004 85);

  /* Secondary: a lighter navy */
  --secondary: oklch(0.42 0.1 252);
  --secondary-foreground: oklch(0.985 0.004 85);

  /* Muted: a slightly darker paper band */
  --muted: oklch(0.945 0.011 85);
  --muted-foreground: oklch(0.47 0.02 70);

  /* Accent: hover wash on paper */
  --accent: oklch(0.93 0.014 85);
  --accent-foreground: oklch(0.21 0.015 260);

  /* Status colours */
  --destructive: oklch(0.52 0.19 27);
  --success: oklch(0.47 0.12 155);
  --success-foreground: oklch(0.985 0.004 85);
  --warning: oklch(0.75 0.15 75);
  --warning-foreground: oklch(0.25 0.05 70);
  --info: oklch(0.45 0.1 245);
  --info-foreground: oklch(0.985 0.004 85);

  /* Rules */
  --border: oklch(0.87 0.018 85);
  --input: oklch(0.85 0.018 85);
  --ring: oklch(0.282 0.09 252);

  /* Charts */
  --chart-1: oklch(0.282 0.09 252);
  --chart-2: oklch(0.42 0.1 252);
  --chart-3: oklch(0.55 0.08 200);
  --chart-4: oklch(0.71 0.105 88);
  --chart-5: oklch(0.6 0.05 252);

  /* Sidebar: the navy spine */
  --sidebar: oklch(0.282 0.09 252);
  --sidebar-foreground: oklch(0.95 0.008 85);
  --sidebar-primary: oklch(0.71 0.105 88);
  --sidebar-primary-foreground: oklch(0.21 0.015 260);
  --sidebar-accent: oklch(0.33 0.085 252);
  --sidebar-accent-foreground: oklch(0.97 0.006 85);
  --sidebar-border: oklch(0.36 0.07 252);
  --sidebar-ring: oklch(0.71 0.105 88);
```

Keep the existing `--brand-navy` and `--brand-gold` lines.

- [ ] **Step 4: Replace the dark tokens**

In the `.dark` block, keep `--brand-navy` and `--brand-gold`, and replace every other value with:

```css
  /* Night record: navy-charcoal paper, warm ink */
  --background: oklch(0.19 0.02 255);
  --foreground: oklch(0.93 0.012 85);

  --card: oklch(0.225 0.022 255);
  --card-foreground: oklch(0.93 0.012 85);

  --popover: oklch(0.225 0.022 255);
  --popover-foreground: oklch(0.93 0.012 85);

  --primary: oklch(0.78 0.08 252);
  --primary-foreground: oklch(0.17 0.03 255);

  --secondary: oklch(0.7 0.09 252);
  --secondary-foreground: oklch(0.17 0.03 255);

  --muted: oklch(0.25 0.02 255);
  --muted-foreground: oklch(0.74 0.015 85);

  --accent: oklch(0.28 0.025 255);
  --accent-foreground: oklch(0.93 0.012 85);

  --destructive: oklch(0.7 0.17 25);
  --success: oklch(0.72 0.13 155);
  --success-foreground: oklch(0.17 0.03 255);
  --warning: oklch(0.8 0.14 75);
  --warning-foreground: oklch(0.2 0.04 70);
  --info: oklch(0.75 0.1 245);
  --info-foreground: oklch(0.17 0.03 255);

  --border: oklch(0.32 0.02 255);
  --input: oklch(0.34 0.02 255);
  --ring: oklch(0.78 0.08 252);

  --chart-1: oklch(0.78 0.08 252);
  --chart-2: oklch(0.7 0.09 252);
  --chart-3: oklch(0.72 0.08 200);
  --chart-4: oklch(0.71 0.105 88);
  --chart-5: oklch(0.6 0.05 252);

  --sidebar: oklch(0.155 0.03 255);
  --sidebar-foreground: oklch(0.93 0.012 85);
  --sidebar-primary: oklch(0.71 0.105 88);
  --sidebar-primary-foreground: oklch(0.17 0.03 255);
  --sidebar-accent: oklch(0.22 0.03 255);
  --sidebar-accent-foreground: oklch(0.95 0.008 85);
  --sidebar-border: oklch(0.26 0.03 255);
  --sidebar-ring: oklch(0.71 0.105 88);
```

- [ ] **Step 5: Run the token test**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/styles/tokens.test.ts`
Expected: PASS (20 tests). If a pair fails, adjust only the **lightness** of the failing foreground (darker in light mode, lighter in dark mode) in steps of 0.02 until it passes. Do not change hue.

- [ ] **Step 6: Full checks**

Run: `npm run typecheck && npm run test:unit 2>&1 | grep -E "^# (pass|fail)"`
Expected: typecheck silent; `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add src/styles/globals.css src/styles/tokens.test.ts
git commit -m "feat: paper and night-record design tokens"
```

### Task 4: `AndamioSectionLabel` and `AndamioRecordHeader`

**Files:**
- Create: `src/components/andamio/andamio-section-label.tsx`
- Create: `src/components/andamio/andamio-record-header.tsx`
- Modify: `src/components/andamio/index.ts`

- [ ] **Step 1: Section label** (`andamio-section-label.tsx`)

```tsx
import * as React from "react";
import { cn } from "~/lib/utils";

export interface AndamioSectionLabelProps {
  children: React.ReactNode;
  /** Rendered element. Use "h2" when the label titles a page section. */
  as?: "div" | "h2" | "h3";
  className?: string;
}

/**
 * Small-caps navy label that titles a section of a record page
 * ("Courses", "Path", "Record details").
 */
export function AndamioSectionLabel({ children, as: Tag = "div", className }: AndamioSectionLabelProps) {
  return (
    <Tag
      className={cn(
        "m-0 font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-primary",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Record header** (`andamio-record-header.tsx`)

```tsx
import * as React from "react";
import { AndamioHeading } from "./andamio-heading";
import { AndamioSectionLabel } from "./andamio-section-label";

export interface AndamioRecordHeaderProps {
  /** Small-caps label above the title, e.g. "Academic record". */
  label: string;
  /** Serif title: a person's alias, a course name, a page name. */
  title: React.ReactNode;
  /** One quiet line under the title. */
  meta?: React.ReactNode;
  /** Optional actions on the right (stacked under the title on phones). */
  actions?: React.ReactNode;
}

/**
 * The heading of every record page: label, serif title, meta line, and a
 * navy rule underneath.
 */
export function AndamioRecordHeader({ label, title, meta, actions }: AndamioRecordHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b-2 border-primary pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <AndamioSectionLabel>{label}</AndamioSectionLabel>
        <AndamioHeading level={1} size="3xl" className="break-words font-serif font-medium">
          {title}
        </AndamioHeading>
        {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
```

- [ ] **Step 3: Export both** from `src/components/andamio/index.ts`, under `// Composite/Pattern components`:

```ts
export * from "./andamio-section-label";
export * from "./andamio-record-header";
```

- [ ] **Step 4: Check**

Run: `npm run typecheck && npx eslint src/components/andamio/andamio-section-label.tsx src/components/andamio/andamio-record-header.tsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/andamio/andamio-section-label.tsx src/components/andamio/andamio-record-header.tsx src/components/andamio/index.ts
git commit -m "feat: add record header and section label"
```

### Task 5: `AndamioLedger`

**Files:**
- Create: `src/components/andamio/andamio-ledger.tsx`
- Modify: `src/components/andamio/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import * as React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { AndamioSkeleton } from "./andamio-skeleton";
import { AndamioText } from "./andamio-text";

/**
 * Ruled list for records: rows separated by hairlines, no box.
 * On phones each row stacks (title, detail, status); from 640px the status
 * sits on the right.
 */
export function AndamioLedger({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <ul role="list" aria-label={label} className="divide-y divide-border border-y border-border">
      {children}
    </ul>
  );
}

export interface AndamioLedgerRowProps {
  title: React.ReactNode;
  detail?: React.ReactNode;
  status?: React.ReactNode;
  /** Makes the whole row a link. */
  href?: string;
  /** Serif title for names of courses, credentials, people. Default true. */
  serif?: boolean;
}

export function AndamioLedgerRow({ title, detail, status, href, serif = true }: AndamioLedgerRowProps) {
  const body = (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className={cn("truncate text-base text-foreground", serif ? "font-serif font-medium" : "font-medium")}>
          {title}
        </div>
        {detail && <div className="line-clamp-1 text-sm text-muted-foreground">{detail}</div>}
      </div>
      {status && <div className="shrink-0 text-sm font-medium text-foreground">{status}</div>}
    </div>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="-mx-2 block min-h-11 rounded-sm px-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/** Empty ledger: a sentence in the rows' place, plus an optional action. */
export function AndamioLedgerEmpty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
      <AndamioText variant="small">{children}</AndamioText>
      {action}
    </div>
  );
}

/** Loading ledger: ruled skeleton rows. */
export function AndamioLedgerSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border border-y border-border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-3.5">
          <AndamioSkeleton className="h-4 w-1/2" />
          <AndamioSkeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Export** in `index.ts`: `export * from "./andamio-ledger";`

- [ ] **Step 3: Check**

Run: `npm run typecheck && npx eslint src/components/andamio/andamio-ledger.tsx`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/andamio/andamio-ledger.tsx src/components/andamio/index.ts
git commit -m "feat: add ruled ledger rows"
```

### Task 6: `AndamioNextStep`, `AndamioPathTimeline`, `AndamioRecordLayout`

**Files:**
- Create: `src/components/andamio/andamio-next-step.tsx`
- Create: `src/components/andamio/andamio-path-timeline.tsx`
- Create: `src/components/andamio/andamio-record-layout.tsx`
- Modify: `src/components/andamio/index.ts`

- [ ] **Step 1: Next step banner** (`andamio-next-step.tsx`)

```tsx
import * as React from "react";
import Link from "next/link";
import { ForwardIcon } from "~/components/icons";

export interface AndamioNextStepProps {
  /** One sentence: what to do next. */
  title: string;
  /** Optional context line, e.g. the course name. */
  detail?: React.ReactNode;
  /** Button that takes the learner there. Omit for a status-only step. */
  action?: { label: string; href: string };
  /** Extra content inside the banner (e.g. the access-token form). */
  children?: React.ReactNode;
}

/** The navy banner holding the single next action on a record page. */
export function AndamioNextStep({ title, detail, action, children }: AndamioNextStepProps) {
  return (
    <section
      aria-label="Next step"
      className="rounded-sm bg-primary px-5 py-5 text-primary-foreground sm:px-6"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">Next step</div>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-serif text-xl font-medium leading-snug sm:text-2xl">{title}</div>
          {detail && <div className="mt-1 text-sm opacity-80">{detail}</div>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary-foreground px-4 text-sm font-semibold text-primary outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {action.label}
            <ForwardIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children && <div className="mt-5 rounded-sm bg-card p-4 text-card-foreground sm:p-5">{children}</div>}
    </section>
  );
}
```

- [ ] **Step 2: Path timeline** (`andamio-path-timeline.tsx`)

```tsx
import * as React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";

export interface PathMilestone {
  id: string;
  label: string;
  done: boolean;
  /** Optional link, e.g. "Explore courses" → /course. */
  href?: string;
}

/**
 * Vertical line of milestones: filled dot when done, hollow when to come.
 * Done/not-done is also written for screen readers.
 */
export function AndamioPathTimeline({ milestones, label }: { milestones: PathMilestone[]; label?: string }) {
  return (
    <ol aria-label={label} className="relative ml-1.5 space-y-3 border-l-2 border-border pl-5">
      {milestones.map((m) => {
        const text = m.href && !m.done ? (
          <Link href={m.href} className="underline underline-offset-4 hover:text-primary">
            {m.label}
          </Link>
        ) : (
          m.label
        );
        return (
          <li key={m.id} className="relative text-sm">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2",
                m.done ? "border-primary bg-primary" : "border-border bg-background",
              )}
            />
            <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{text}</span>
            <span className="sr-only">{m.done ? " (done)" : " (to do)"}</span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 3: Record layout** (`andamio-record-layout.tsx`)

```tsx
import * as React from "react";

/**
 * Main column plus a margin column, like a ledger with notes in the margin.
 * Under 1024px the margin follows the main column.
 */
export function AndamioRecordLayout({ main, margin }: { main: React.ReactNode; margin: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
      <div className="min-w-0 space-y-10">{main}</div>
      <aside className="min-w-0 space-y-8 lg:border-l lg:border-border lg:pl-8">{margin}</aside>
    </div>
  );
}

/** A titled section inside either column. */
export function AndamioRecordSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="m-0 font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-primary">
        {label}
      </h2>
      {children}
    </section>
  );
}
```

(`AndamioRecordSection` renders its label as an `h2` for document structure, with the same look as `AndamioSectionLabel`.)

- [ ] **Step 4: Export** in `index.ts`:

```ts
export * from "./andamio-next-step";
export * from "./andamio-path-timeline";
export * from "./andamio-record-layout";
```

- [ ] **Step 5: Check**

Run: `npm run typecheck && npx eslint src/components/andamio/andamio-next-step.tsx src/components/andamio/andamio-path-timeline.tsx src/components/andamio/andamio-record-layout.tsx`
Expected: no errors. If `ForwardIcon` is missing, check `src/components/icons/index.ts` for the export name used by `welcome-hero.tsx` (it imports `ForwardIcon`), which confirms it exists.

- [ ] **Step 6: Commit**

```bash
git add src/components/andamio/andamio-next-step.tsx src/components/andamio/andamio-path-timeline.tsx src/components/andamio/andamio-record-layout.tsx src/components/andamio/index.ts
git commit -m "feat: add next step, path timeline and record layout"
```

### Task 7: Move session expiry out of the status bar

**Files:**
- Create: `src/hooks/auth/use-session-expiry.ts`

- [ ] **Step 1: Write the hook** (logic copied from `auth-status-bar.tsx`, same behaviour)

```ts
"use client";

import { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { getStoredJWT } from "~/lib/andamio-auth";

export interface SessionExpiry {
  /** "3h 12m", "4m 05s", "12s", "Expired", or null when unknown. */
  label: string | null;
  /** True within five minutes of expiry, or after it. */
  isExpiringSoon: boolean;
  expiresAt: Date | null;
}

/** Live countdown to the stored JWT's expiry, updated every second. */
export function useSessionExpiry(): SessionExpiry {
  const { isAuthenticated } = useAndamioAuth();
  const [state, setState] = useState<SessionExpiry>({ label: null, isExpiringSoon: false, expiresAt: null });

  useEffect(() => {
    if (!isAuthenticated) {
      setState({ label: null, isExpiringSoon: false, expiresAt: null });
      return;
    }

    const update = () => {
      const jwt = getStoredJWT();
      if (!jwt) return setState({ label: null, isExpiringSoon: false, expiresAt: null });
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
        if (!payload.exp) return setState({ label: null, isExpiringSoon: false, expiresAt: null });
        const expiresAt = new Date(payload.exp * 1000);
        const diff = expiresAt.getTime() - Date.now();
        if (diff <= 0) return setState({ label: "Expired", isExpiringSoon: true, expiresAt });
        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1000);
        const label =
          hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
        setState({ label, isExpiringSoon: diff < 5 * 60_000, expiresAt });
      } catch {
        setState({ label: null, isExpiringSoon: false, expiresAt: null });
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return state;
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npx eslint src/hooks/auth/use-session-expiry.ts`
Expected: no errors. (`useAndamioAuth` is exported from `~/hooks/auth/use-andamio-auth`, as used by `sidebar-user-section.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/auth/use-session-expiry.ts
git commit -m "refactor: extract the session expiry countdown into a hook"
```

### Task 8: Theme toggle and auth notice for the spine

**Files:**
- Create: `src/components/layout/theme-toggle.tsx`
- Create: `src/components/layout/auth-notice.tsx`

- [ ] **Step 1: Theme toggle** (`theme-toggle.tsx`)

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DarkModeIcon, LightModeIcon } from "~/components/icons";

/** Light/dark switch for the sidebar spine. Renders nothing until mounted. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex min-h-11 w-full items-center gap-2 rounded-sm px-2 text-xs text-sidebar-foreground/70 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      {isDark ? <LightModeIcon className="h-3.5 w-3.5" /> : <DarkModeIcon className="h-3.5 w-3.5" />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
```

- [ ] **Step 2: Auth notice** (`auth-notice.tsx`), carrying the status bar's error and popup-blocked retry

```tsx
"use client";

import React from "react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { SecurityAlertIcon } from "~/components/icons";

/**
 * Shown in the spine when sign-in failed or the wallet popup was blocked.
 * Replaces the error/retry that lived in the old status bar.
 */
export function AuthNotice() {
  const { isAuthenticated, authError, popupBlocked, authenticate } = useAndamioAuth();
  if (isAuthenticated || (!authError && !popupBlocked)) return null;

  return (
    <div role="alert" className="flex items-start gap-2 rounded-sm bg-sidebar-accent px-2 py-2 text-xs text-sidebar-foreground">
      <SecurityAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      {popupBlocked ? (
        <button type="button" onClick={() => void authenticate()} className="text-left underline underline-offset-2">
          The wallet popup was blocked. Sign in again.
        </button>
      ) : (
        <span>Sign-in failed. Try connecting your wallet again.</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Check**

Run: `npm run typecheck && npx eslint src/components/layout/theme-toggle.tsx src/components/layout/auth-notice.tsx`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/theme-toggle.tsx src/components/layout/auth-notice.tsx
git commit -m "feat: theme toggle and auth notice for the sidebar"
```

### Task 9: The navy spine

**Files:**
- Modify: `src/config/navigation.ts` (section titles)
- Modify: `src/components/layout/sidebar-header.tsx` (logo variant)
- Modify: `src/components/layout/sidebar-nav-section.tsx` (`SidebarNavSection` header + `SidebarNavItem`)
- Modify: `src/components/layout/sidebar-user-section.tsx`

- [ ] **Step 1: Rename the sections** in `src/config/navigation.ts`: `title: "Overview"` → `title: "Record"`, `title: "Discover"` → `title: "Catalogue"`. Also rename the items `"Browse Courses"` → `"Courses"` and `"Browse Projects"` → `"Projects"`. Leave hrefs untouched.

- [ ] **Step 2: Serif wordmark.** In `sidebar-header.tsx`, replace the final `return` (the logo variant) with:

```tsx
  return (
    <div className={cn("flex items-center border-b border-sidebar-border px-4", headerHeight, className)}>
      <Link href={linkHref} className="flex flex-col leading-none outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <span className="font-serif text-xl font-medium text-sidebar-foreground">Tracom</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
          Credentials
        </span>
      </Link>
    </div>
  );
```

Then delete the now-unused `Image` import.

- [ ] **Step 3: Index-style section headers.** In `SidebarNavSection`, replace the `<AndamioHeading …>{section.title}</AndamioHeading>` element with:

```tsx
      <div
        className={cn(
          "mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em]",
          section.muted ? "text-sidebar-foreground/30" : "text-sidebar-foreground/50",
        )}
      >
        {section.title}
      </div>
```

Remove the `AndamioHeading` import if nothing else in the file uses it.

- [ ] **Step 4: Rule-marked active item.** In `SidebarNavItem`, replace the `className={cn(…)}` of the outer `div` in `content` with:

```tsx
      className={cn(
        "group flex min-h-9 cursor-pointer select-none items-center border-l-2 transition-colors",
        styles.itemPadding,
        styles.fontSize,
        styles.gap,
        isActive
          ? "border-sidebar-primary font-semibold text-sidebar-foreground"
          : "border-transparent text-sidebar-foreground/65 hover:border-sidebar-foreground/30 hover:text-sidebar-foreground",
        muted && !isActive && "opacity-60",
      )}
```

Replace the icon's active class `"text-sidebar-primary"` with `"text-sidebar-foreground"`, and delete the trailing `{isActive && (<NextIcon … />)}` block and the `NextIcon` import.

- [ ] **Step 5: Spine footer.** In `sidebar-user-section.tsx`:
  - Add imports: `import { ThemeToggle } from "./theme-toggle";` and `import { AuthNotice } from "./auth-notice";`
  - In the unauthenticated return, render `<AuthNotice />` above the `ConnectWalletButton` and `<ThemeToggle />` below it, inside a `div className="space-y-2"`.
  - In the authenticated return, render `<ThemeToggle />` directly above the Sign Out `ConfirmDialog`.
  - Show the alias in the serif: change the alias `div` classes to `"font-serif font-medium text-sidebar-foreground truncate"` plus the existing size switch.

- [ ] **Step 6: Check**

Run: `npm run typecheck && npx eslint src/config/navigation.ts src/components/layout/`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/config/navigation.ts src/components/layout/sidebar-header.tsx src/components/layout/sidebar-nav-section.tsx src/components/layout/sidebar-user-section.tsx
git commit -m "feat: navy spine sidebar with serif wordmark and index labels"
```

### Task 10: Remove the status bar; add the mobile top bar

**Files:**
- Create: `src/components/layout/mobile-top-bar.tsx`
- Modify: `src/components/layout/mobile-nav.tsx`
- Modify: `src/components/layout/app-layout.tsx`
- Modify: `src/components/layout/studio-layout.tsx`
- Delete: `src/components/layout/auth-status-bar.tsx`

- [ ] **Step 1: Mobile top bar** (`mobile-top-bar.tsx`)

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";

/** Slim paper bar for phones: menu button and wordmark. Hidden from md up. */
export function MobileTopBar() {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
      <MobileNav />
      <Link href="/" className="font-serif text-lg font-medium text-primary">
        Tracom
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Restyle the drawer trigger and header** in `mobile-nav.tsx`:
  - Trigger button classes → `"h-11 w-11 p-0 text-foreground hover:bg-accent md:hidden"`.
  - Replace the `SheetHeader` contents (the ModuleIcon badge block) with:

```tsx
          <div className="flex flex-col px-4 leading-none">
            <SheetTitle className="font-serif text-xl font-medium text-sidebar-foreground">Tracom</SheetTitle>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Credentials
            </span>
          </div>
```

  - Remove the `ModuleIcon` and `BRANDING` imports if unused.

- [ ] **Step 3: App layout.** In `app-layout.tsx`: replace `import { AuthStatusBar } from "./auth-status-bar";` with `import { MobileTopBar } from "./mobile-top-bar";`, replace `<AuthStatusBar />` with `<MobileTopBar />`, and change the `<main>` class `bg-muted/30` to `bg-background`. Update the doc comment's "Minimal status bar at top" line to "Mobile: slim top bar with the menu".

- [ ] **Step 4: Studio layout.** In `studio-layout.tsx`: same swap (`AuthStatusBar` → `MobileTopBar`), and update its doc comment line "AuthStatusBar at top (same as main app)" to "MobileTopBar on phones (same as main app)".

- [ ] **Step 5: Delete the status bar**

Run: `git rm src/components/layout/auth-status-bar.tsx && grep -rn "auth-status-bar\|AuthStatusBar" src | grep -v "^src/.*\.md"`
Expected: no code imports left (comments in hooks may mention it; update any that say it renders the timer to say "Record details on the dashboard").

- [ ] **Step 6: Check**

Run: `npm run typecheck && npx eslint src/components/layout/ && npm run test:unit 2>&1 | grep -E "^# (pass|fail)"`
Expected: no errors; `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add -A src/components/layout/
git commit -m "feat: replace the status bar with a mobile top bar"
```

### Task 11: Stage 1 visual check, DESIGN.md, deploy

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Run the app and look at it**

Run: `npm run dev` and open, at 375px and at desktop width, in light and dark: `/`, `/about`, `/verify` (any id), `/dashboard`, `/course`, `/credentials`, `/studio/course`, a course editor page, and trigger a dialog (Sign Out confirm).
Expected: paper/navy look everywhere; nothing unreadable; the editor toolbar and dialogs legible; the spine footer shows the theme toggle and Sign Out; on phones the top bar opens the drawer. Fix any contrast or broken element before continuing (tokens first, never per-page hex).

- [ ] **Step 2: Update DESIGN.md**

Replace the "Color Palette" section's strategy line and light/dark tables with the new token values from Task 3; under Typography add Newsreader (`--font-serif`, 400/500, titles and names only); set Radius to `0.25rem`; under Components add the six new `Andamio*` blocks with one line each; add a "Rules for every page" list copied from the spec.

- [ ] **Step 3: Commit and push**

```bash
git add DESIGN.md
git commit -m "docs: document the Record design system"
git push origin main
```

- [ ] **Step 4: Check the deploy**

Run: `vercel ls --prod | head -3` until the newest deployment is Ready, then `curl -s -o /dev/null -w "%{http_code}\n" https://tracom-credentials.vercel.app/dashboard`
Expected: `200`.

---

# Stage 2: Dashboard

### Task 12: Course status and path milestones (`course-path.ts`)

**Files:**
- Create: `src/lib/course-path.ts`
- Test: `src/lib/course-path.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { DashboardStudent } from "~/hooks/api/use-dashboard";
import { getCoursePaths } from "./course-path";

const course = (courseId: string, title = courseId) => ({ courseId, title, description: "", imageUrl: "" });

function student(over: Partial<DashboardStudent>): DashboardStudent {
  return {
    enrolledCourses: [],
    completedCourses: [],
    totalCredentials: 0,
    credentialsByCourse: [],
    commitments: [],
    ...over,
  };
}

describe("getCoursePaths", () => {
  it("marks a fresh enrolment as in progress with only the first milestone done", () => {
    const [p] = getCoursePaths(student({ enrolledCourses: [course("c1", "Payments")] }));
    assert.equal(p!.status, "in_progress");
    assert.equal(p!.statusLabel, "In progress");
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, false, false, false]);
  });

  it("reports a submission waiting for review", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "PENDING_APPROVAL" }],
      }),
    );
    assert.equal(p!.status, "with_assessor");
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, false, false]);
  });

  it("asks for a revision when an assignment was refused", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_DENIED" }],
      }),
    );
    assert.equal(p!.status, "revision_requested");
    assert.equal(p!.statusLabel, "Revision requested");
  });

  it("offers a claim when accepted but not yet claimed", () => {
    const [p] = getCoursePaths(
      student({
        enrolledCourses: [course("c1")],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.equal(p!.status, "ready_to_claim");
    assert.equal(p!.claimableCount, 1);
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, true, false]);
  });

  it("treats a claimed credential as issued", () => {
    const [p] = getCoursePaths(
      student({
        completedCourses: [course("c1")],
        credentialsByCourse: [{ courseId: "c1", courseTitle: "c1", credentials: ["h1"] }],
        commitments: [{ courseId: "c1", sltHash: "h1", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.equal(p!.status, "credential_issued");
    assert.equal(p!.credentialCount, 1);
    assert.equal(p!.claimableCount, 0);
    assert.deepEqual(p!.milestones.map((m) => m.done), [true, true, true, true]);
  });

  it("lists claimable courses first, then in progress, then issued", () => {
    const paths = getCoursePaths(
      student({
        enrolledCourses: [course("a"), course("b")],
        completedCourses: [course("c")],
        credentialsByCourse: [{ courseId: "c", courseTitle: "c", credentials: ["x"] }],
        commitments: [{ courseId: "b", sltHash: "y", status: "ASSIGNMENT_ACCEPTED" }],
      }),
    );
    assert.deepEqual(paths.map((p) => p.courseId), ["b", "a", "c"]);
  });

  it("falls back to a short id when a course has no title", () => {
    const [p] = getCoursePaths(student({ enrolledCourses: [course("0123456789abcdef", "")] }));
    assert.equal(p!.title, "Course 01234567…");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/course-path.test.ts`
Expected: FAIL, cannot find module `./course-path`.

- [ ] **Step 3: Implement** (`src/lib/course-path.ts`)

```ts
import type { DashboardStudent } from "~/hooks/api/use-dashboard";
import type { PathMilestone } from "~/components/andamio/andamio-path-timeline";
import { normalizeAssignmentStatus } from "~/lib/assignment-status";

export type CourseStatus =
  | "revision_requested"
  | "ready_to_claim"
  | "with_assessor"
  | "in_progress"
  | "credential_issued";

export interface CoursePath {
  courseId: string;
  title: string;
  status: CourseStatus;
  statusLabel: string;
  /** Accepted assignments whose credential hasn't been claimed. */
  claimableCount: number;
  credentialCount: number;
  milestones: PathMilestone[];
}

const LABELS: Record<CourseStatus, string> = {
  revision_requested: "Revision requested",
  ready_to_claim: "Credential ready to claim",
  with_assessor: "With the assessor",
  in_progress: "In progress",
  credential_issued: "Credential issued",
};

const ORDER: Record<CourseStatus, number> = {
  ready_to_claim: 0,
  revision_requested: 1,
  with_assessor: 2,
  in_progress: 3,
  credential_issued: 4,
};

/**
 * One entry per course the learner is enrolled in or has completed, with a
 * status in words and four milestones (enrolled, submitted, accepted,
 * credential claimed) worked out from the dashboard's commitment statuses.
 */
export function getCoursePaths(student: DashboardStudent): CoursePath[] {
  const claimed = new Set(student.credentialsByCourse.flatMap((c) => c.credentials));
  const completedIds = new Set(student.completedCourses.map((c) => c.courseId));
  const courses = [...student.enrolledCourses, ...student.completedCourses];
  const seen = new Set<string>();

  const paths: CoursePath[] = [];
  for (const c of courses) {
    if (seen.has(c.courseId)) continue;
    seen.add(c.courseId);

    const statuses = student.commitments
      .filter((m) => m.courseId === c.courseId)
      .map((m) => ({ hash: m.sltHash, status: normalizeAssignmentStatus(m.status) }));
    const credentialCount =
      student.credentialsByCourse.find((x) => x.courseId === c.courseId)?.credentials.length ?? 0;
    const claimableCount = statuses.filter((s) => s.status === "ASSIGNMENT_ACCEPTED" && !claimed.has(s.hash)).length;

    const anySubmitted = statuses.some((s) =>
      ["PENDING_APPROVAL", "ASSIGNMENT_ACCEPTED", "ASSIGNMENT_DENIED", "CREDENTIAL_CLAIMED"].includes(s.status),
    );
    const anyAccepted = statuses.some((s) => s.status === "ASSIGNMENT_ACCEPTED" || s.status === "CREDENTIAL_CLAIMED");
    const issued = credentialCount > 0 || completedIds.has(c.courseId);

    const status: CourseStatus = statuses.some((s) => s.status === "ASSIGNMENT_DENIED")
      ? "revision_requested"
      : claimableCount > 0
        ? "ready_to_claim"
        : statuses.some((s) => s.status === "PENDING_APPROVAL")
          ? "with_assessor"
          : issued
            ? "credential_issued"
            : "in_progress";

    paths.push({
      courseId: c.courseId,
      title: c.title || `Course ${c.courseId.slice(0, 8)}…`,
      status,
      statusLabel: LABELS[status],
      claimableCount,
      credentialCount,
      milestones: [
        { id: "enrolled", label: "Enrolled", done: true },
        { id: "submitted", label: "Assignment submitted", done: anySubmitted || issued },
        { id: "accepted", label: "Assignment accepted", done: anyAccepted || issued },
        { id: "claimed", label: "Credential claimed", done: issued },
      ],
    });
  }

  return paths.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/course-path.test.ts`
Expected: PASS (7 tests). Note the sort test expects `["b", "a", "c"]`: b ready to claim, a in progress, c issued.

- [ ] **Step 5: Commit**

```bash
git add src/lib/course-path.ts src/lib/course-path.test.ts
git commit -m "feat: course status and path milestones from dashboard data"
```

### Task 13: Next step rule (`next-step.ts`)

**Files:**
- Create: `src/lib/next-step.ts`
- Test: `src/lib/next-step.test.ts`

Note on the spec: rule 1 links to the course page, not the assignment page, because the dashboard data has no module code to build the assignment URL.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { CoursePath } from "./course-path";
import { getNextStep } from "./next-step";

const path = (courseId: string, status: CoursePath["status"], claimableCount = 0): CoursePath => ({
  courseId,
  title: `Course ${courseId}`,
  status,
  statusLabel: "",
  claimableCount,
  credentialCount: 0,
  milestones: [],
});

const noReviews = { pendingReviews: [] };

describe("getNextStep", () => {
  it("1. asks for a revision first", () => {
    const step = getNextStep([path("a", "ready_to_claim", 1), path("b", "revision_requested")], noReviews);
    assert.equal(step.title, "Revise your assignment for Course b");
    assert.deepEqual(step.action, { label: "Open course", href: "/course/b" });
  });

  it("2. then a credential to claim", () => {
    const step = getNextStep([path("a", "in_progress"), path("b", "ready_to_claim", 1)], noReviews);
    assert.equal(step.title, "Claim your credential for Course b");
    assert.equal(step.action?.href, "/course/b");
  });

  it("3. then reviews waiting for a teacher, most first", () => {
    const step = getNextStep([path("a", "in_progress")], {
      pendingReviews: [
        { courseId: "t1", courseTitle: "Teach One", count: 1 },
        { courseId: "t2", courseTitle: "Teach Two", count: 3 },
      ],
    });
    assert.equal(step.title, "Review 3 submissions in Teach Two");
    assert.equal(step.action?.href, "/studio/course/t2/teacher");
  });

  it("3. uses the singular for one submission", () => {
    const step = getNextStep([], { pendingReviews: [{ courseId: "t1", courseTitle: "Teach One", count: 1 }] });
    assert.equal(step.title, "Review 1 submission in Teach One");
  });

  it("4. then continuing a course in progress", () => {
    const step = getNextStep([path("a", "with_assessor"), path("b", "in_progress")], noReviews);
    assert.equal(step.title, "Continue Course b");
    assert.equal(step.action?.label, "Continue");
  });

  it("5. then a status with no button while the assessor reviews", () => {
    const step = getNextStep([path("a", "with_assessor"), path("c", "credential_issued")], noReviews);
    assert.equal(step.title, "Your assignment for Course a is with the assessor");
    assert.equal(step.action, undefined);
  });

  it("6. otherwise browse courses", () => {
    const step = getNextStep([path("c", "credential_issued")], noReviews);
    assert.equal(step.title, "Browse courses");
    assert.equal(step.action?.href, "/course");
  });

  it("ignores reviews with a zero count", () => {
    const step = getNextStep([], { pendingReviews: [{ courseId: "t1", courseTitle: "T", count: 0 }] });
    assert.equal(step.title, "Browse courses");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/next-step.test.ts`
Expected: FAIL, cannot find module `./next-step`.

- [ ] **Step 3: Implement** (`src/lib/next-step.ts`)

```ts
import type { DashboardPendingReview } from "~/hooks/api/use-dashboard";
import type { CoursePath } from "./course-path";

export interface NextStep {
  title: string;
  detail?: string;
  action?: { label: string; href: string };
}

/**
 * The single next action for the dashboard banner. First matching rule wins:
 * revision → claim → review (teachers) → continue → waiting → browse.
 */
export function getNextStep(
  paths: CoursePath[],
  teacher: { pendingReviews: DashboardPendingReview[] },
): NextStep {
  const find = (status: CoursePath["status"]) => paths.find((p) => p.status === status);

  const revision = find("revision_requested");
  if (revision) {
    return {
      title: `Revise your assignment for ${revision.title}`,
      detail: "Your assessor asked for changes.",
      action: { label: "Open course", href: `/course/${revision.courseId}` },
    };
  }

  const claim = find("ready_to_claim");
  if (claim) {
    return {
      title: `Claim your credential for ${claim.title}`,
      detail: "Your assignment was accepted.",
      action: { label: "Claim credential", href: `/course/${claim.courseId}` },
    };
  }

  const review = [...teacher.pendingReviews].filter((r) => r.count > 0).sort((a, b) => b.count - a.count)[0];
  if (review) {
    const noun = review.count === 1 ? "submission" : "submissions";
    return {
      title: `Review ${review.count} ${noun} in ${review.courseTitle || "your course"}`,
      action: { label: "Review", href: `/studio/course/${review.courseId}/teacher` },
    };
  }

  const active = find("in_progress");
  if (active) {
    return {
      title: `Continue ${active.title}`,
      action: { label: "Continue", href: `/course/${active.courseId}` },
    };
  }

  const waiting = find("with_assessor");
  if (waiting) {
    return {
      title: `Your assignment for ${waiting.title} is with the assessor`,
      detail: "You'll see the result here once it has been reviewed.",
    };
  }

  return {
    title: "Browse courses",
    detail: "Choose a course to start earning a credential.",
    action: { label: "Browse courses", href: "/course" },
  };
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `SKIP_ENV_VALIDATION=true npx tsx --test src/lib/next-step.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/next-step.ts src/lib/next-step.test.ts
git commit -m "feat: pick the dashboard's single next step"
```

### Task 14: Before-token "Admission" view

**Files:**
- Create: `src/components/dashboard/record/admission.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import React from "react";
import {
  AndamioRecordHeader,
  AndamioRecordLayout,
  AndamioRecordSection,
  AndamioNextStep,
  AndamioPathTimeline,
} from "~/components/andamio";
import { MintAccessToken } from "~/components/tx";
import { truncateWalletAddress } from "~/config";

/**
 * Dashboard for a signed-in wallet with no access token yet. Replaces
 * GettingStarted + MintAccessToken with the same steps and the same form.
 */
export function Admission({
  walletAddress,
  onMinted,
}: {
  walletAddress: string | null | undefined;
  onMinted: () => void;
}) {
  return (
    <>
      <AndamioRecordHeader
        label="Admission"
        title="Welcome to Tracom"
        meta={walletAddress ? `Wallet ${truncateWalletAddress(walletAddress)}` : undefined}
      />
      <AndamioRecordLayout
        main={
          <AndamioNextStep
            title="Choose your alias"
            detail="Your alias is your name on every credential you earn."
          >
            <MintAccessToken onSuccess={onMinted} />
          </AndamioNextStep>
        }
        margin={
          <AndamioRecordSection label="Path">
            <AndamioPathTimeline
              label="Getting started"
              milestones={[
                { id: "connect", label: "Connect wallet", done: true },
                { id: "alias", label: "Choose your alias", done: false },
                { id: "explore", label: "Explore courses", done: false, href: "/course" },
              ]}
            />
          </AndamioRecordSection>
        }
      />
    </>
  );
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npx eslint src/components/dashboard/record/admission.tsx`
Expected: no errors. (`truncateWalletAddress` is exported from `~/config`, used by `sidebar-user-section.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/record/admission.tsx
git commit -m "feat: admission view for wallets without an alias"
```

### Task 15: Next step + Courses ledger + Path panel

**Files:**
- Create: `src/components/dashboard/record/dashboard-next-step.tsx`
- Create: `src/components/dashboard/record/courses-ledger.tsx`
- Create: `src/components/dashboard/record/path-panel.tsx`

- [ ] **Step 1: Dashboard next step** (`dashboard-next-step.tsx`)

```tsx
"use client";

import React, { useMemo } from "react";
import { AndamioNextStep, AndamioSkeleton } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";
import { getNextStep } from "~/lib/next-step";

export function DashboardNextStep() {
  const { student, teacher, isLoading } = useDashboardData();
  const step = useMemo(
    () =>
      student
        ? getNextStep(getCoursePaths(student), { pendingReviews: teacher?.pendingReviews ?? [] })
        : null,
    [student, teacher?.pendingReviews],
  );

  if (isLoading) return <AndamioSkeleton className="h-28 w-full rounded-sm" />;
  if (!step) return null;
  return <AndamioNextStep title={step.title} detail={step.detail} action={step.action} />;
}
```

- [ ] **Step 2: Courses ledger** (`courses-ledger.tsx`). Replaces MyLearning + OnChainStatus: lists every enrolled and completed course with a status, links to the course, keeps the "Browse courses" empty action, the error message, and the refresh.

```tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioErrorAlert,
  AndamioLedger,
  AndamioLedgerEmpty,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";

export function CoursesLedger() {
  const { student, isLoading, error } = useDashboardData();
  const paths = useMemo(() => (student ? getCoursePaths(student) : []), [student]);

  return (
    <AndamioRecordSection label="Courses">
      {isLoading ? (
        <AndamioLedgerSkeleton />
      ) : error ? (
        <AndamioErrorAlert error={error.message} />
      ) : paths.length === 0 ? (
        <AndamioLedgerEmpty
          action={
            <Link href="/course">
              <AndamioButton size="sm">Browse courses</AndamioButton>
            </Link>
          }
        >
          You are not enrolled in a course yet.
        </AndamioLedgerEmpty>
      ) : (
        <AndamioLedger label="Your courses">
          {paths.map((p) => (
            <AndamioLedgerRow
              key={p.courseId}
              href={`/course/${p.courseId}`}
              title={p.title}
              detail={
                p.credentialCount > 0
                  ? `${p.credentialCount} ${p.credentialCount === 1 ? "credential" : "credentials"} on record`
                  : undefined
              }
              status={
                <span className={p.status === "ready_to_claim" || p.status === "revision_requested" ? "text-primary" : undefined}>
                  {p.status === "ready_to_claim" && p.claimableCount > 1
                    ? `${p.claimableCount} credentials ready to claim`
                    : p.statusLabel}
                </span>
              }
            />
          ))}
        </AndamioLedger>
      )}
    </AndamioRecordSection>
  );
}
```

Check: `AndamioErrorAlert` takes `error: string` (it is used as `<AndamioErrorAlert error={error?.message ?? "…"} />` in `src/app/(app)/project/[projectid]/page.tsx`).

- [ ] **Step 3: Path panel** (`path-panel.tsx`)

```tsx
"use client";

import React, { useMemo } from "react";
import { AndamioPathTimeline, AndamioRecordSection, AndamioSkeleton, AndamioText } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";

/** Margin: one milestone line per course (states, not dates). */
export function PathPanel() {
  const { student, isLoading } = useDashboardData();
  const paths = useMemo(() => (student ? getCoursePaths(student) : []), [student]);

  return (
    <AndamioRecordSection label="Path">
      {isLoading ? (
        <AndamioSkeleton className="h-24 w-full" />
      ) : paths.length === 0 ? (
        <AndamioText variant="small">Your path starts when you enrol in a course.</AndamioText>
      ) : (
        <div className="space-y-6">
          {paths.map((p) => (
            <div key={p.courseId} className="space-y-2">
              <div className="truncate font-serif text-base font-medium">{p.title}</div>
              <AndamioPathTimeline label={`Progress in ${p.title}`} milestones={p.milestones} />
            </div>
          ))}
        </div>
      )}
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 4: Check**

Run: `npm run typecheck && npx eslint src/components/dashboard/record/`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/record/dashboard-next-step.tsx src/components/dashboard/record/courses-ledger.tsx src/components/dashboard/record/path-panel.tsx
git commit -m "feat: dashboard next step, courses ledger and path panel"
```

### Task 16: Projects unlocking

**Files:**
- Create: `src/components/dashboard/record/projects-unlocking.tsx`

Same calculation as `ProjectUnlockProgress` (copied, not imported, so the old widget can be deleted in Task 21), rendered as a ledger. Keeps: qualified-count line with link to `/project?filter=qualified`, per-project rows linking to `/project/{id}` with "n of m prerequisites" and the claim hint, the overflow link to `/project`, and the empty action "Browse projects".

- [ ] **Step 1: Write the component**

```tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioLedger,
  AndamioLedgerEmpty,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

const MAX_SHOWN = 3;

export function ProjectsUnlocking() {
  const { projects, student, isLoading } = useDashboardData();

  const { items, qualifiedCount } = useMemo(() => {
    const claimed = new Set((student?.credentialsByCourse ?? []).flatMap((c) => c.credentials));
    const approved = new Set(
      (student?.commitments ?? [])
        .filter((c) => c.status === "ASSIGNMENT_ACCEPTED" && !claimed.has(c.sltHash))
        .map((c) => c.sltHash),
    );
    const withPrereqs = projects?.withPrerequisites ?? [];

    const rows = withPrereqs
      .filter((p) => !p.qualified && (p.prerequisites ?? []).length > 0)
      .map((p) => {
        const hashes = p.prerequisites.flatMap((x) => x.sltHashes ?? []);
        const completed = hashes.filter((h) => claimed.has(h)).length;
        const approvedUnclaimed = hashes.filter((h) => !claimed.has(h) && approved.has(h)).length;
        return { projectId: p.projectId, title: p.title || "Untitled project", total: hashes.length, completed, approvedUnclaimed };
      })
      .filter((r) => r.total > 0 && (r.completed > 0 || r.approvedUnclaimed > 0));

    return { items: rows, qualifiedCount: withPrereqs.filter((p) => p.qualified).length };
  }, [projects?.withPrerequisites, student?.credentialsByCourse, student?.commitments]);

  if (isLoading) {
    return (
      <AndamioRecordSection label="Projects unlocking">
        <AndamioLedgerSkeleton rows={2} />
      </AndamioRecordSection>
    );
  }

  if (items.length === 0 && qualifiedCount === 0) {
    return (
      <AndamioRecordSection label="Projects unlocking">
        <AndamioLedgerEmpty
          action={
            <Link href="/project">
              <AndamioButton size="sm" variant="outline">Browse projects</AndamioButton>
            </Link>
          }
        >
          Completing course modules unlocks real project work here.
        </AndamioLedgerEmpty>
      </AndamioRecordSection>
    );
  }

  const shown = items.slice(0, MAX_SHOWN);
  const hidden = items.length - shown.length;

  return (
    <AndamioRecordSection label="Projects unlocking">
      <AndamioLedger label="Projects unlocking">
        {qualifiedCount > 0 && (
          <AndamioLedgerRow
            serif={false}
            href="/project?filter=qualified"
            title={`You qualify for ${qualifiedCount} ${qualifiedCount === 1 ? "project" : "projects"}`}
            status={<span className="text-primary">View</span>}
          />
        )}
        {shown.map((r) => (
          <AndamioLedgerRow
            key={r.projectId}
            href={`/project/${r.projectId}`}
            title={r.title}
            detail={
              r.approvedUnclaimed > 0
                ? `Claim ${r.approvedUnclaimed === 1 ? "your credential" : `${r.approvedUnclaimed} credentials`} to move closer`
                : undefined
            }
            status={`${r.completed} of ${r.total} prerequisites`}
          />
        ))}
        {hidden > 0 && (
          <AndamioLedgerRow
            serif={false}
            href="/project"
            title={`${hidden} more ${hidden === 1 ? "project" : "projects"}`}
          />
        )}
      </AndamioLedger>
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 2: Check**

Run: `npm run typecheck && npx eslint src/components/dashboard/record/projects-unlocking.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/record/projects-unlocking.tsx
git commit -m "feat: projects unlocking as a ledger"
```

### Task 17: Duties and Contributing ledgers

**Files:**
- Create: `src/components/dashboard/record/duties-ledger.tsx`
- Create: `src/components/dashboard/record/contributing-ledger.tsx`

Duties replaces PendingReviewsSummary, PendingAssessmentsSummary, OwnedCoursesSummary and ManagingProjectsSummary. Links kept: `/studio/course/{id}/teacher`, `/studio/project/{id}?tab=commitments`, `/studio/course/{id}`, `/studio/project/{id}`, `/studio`. "All caught up" states become a line.

- [ ] **Step 1: Duties** (`duties-ledger.tsx`)

```tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioButton,
  AndamioErrorAlert,
  AndamioLedger,
  AndamioLedgerRow,
  AndamioLedgerSkeleton,
  AndamioRecordSection,
  AndamioText,
} from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

/** Shown only when the user teaches a course or manages a project. */
export function DutiesLedger() {
  const { teacher, projects, isLoading, error, refetch } = useDashboardData();

  const courses = teacher?.courses ?? [];
  const managing = projects?.managing ?? [];
  if (!isLoading && courses.length === 0 && managing.length === 0) return null;

  const reviews = [...(teacher?.pendingReviews ?? [])].filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const assessments = [...(projects?.pendingAssessments ?? [])].filter((a) => a.count > 0).sort((a, b) => b.count - a.count);

  return (
    <AndamioRecordSection label="Duties">
      {isLoading ? (
        <AndamioLedgerSkeleton rows={4} />
      ) : error ? (
        <div className="space-y-3">
          <AndamioErrorAlert error={error.message} />
          <AndamioButton size="sm" variant="outline" onClick={refetch}>Try again</AndamioButton>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.length > 0 && (
            <div className="space-y-2">
              <AndamioText variant="small">
                {reviews.length === 0
                  ? "No assignments are waiting for review."
                  : `${teacher?.totalPendingReviews ?? 0} assignments waiting for review`}
              </AndamioText>
              <AndamioLedger label="Courses you teach">
                {reviews.map((r) => (
                  <AndamioLedgerRow
                    key={`review-${r.courseId}`}
                    href={`/studio/course/${r.courseId}/teacher`}
                    title={r.courseTitle || `${r.courseId.slice(0, 16)}…`}
                    status={<span className="text-primary">{r.count} to review</span>}
                  />
                ))}
                {courses
                  .filter((c) => !reviews.some((r) => r.courseId === c.courseId))
                  .map((c) => (
                    <AndamioLedgerRow
                      key={`course-${c.courseId}`}
                      href={`/studio/course/${c.courseId}`}
                      title={c.title || `${c.courseId.slice(0, 16)}…`}
                      status="Teaching"
                    />
                  ))}
              </AndamioLedger>
            </div>
          )}
          {managing.length > 0 && (
            <div className="space-y-2">
              <AndamioText variant="small">
                {assessments.length === 0
                  ? "No project work is waiting for assessment."
                  : `${projects?.totalPendingAssessments ?? 0} submissions waiting for assessment`}
              </AndamioText>
              <AndamioLedger label="Projects you manage">
                {assessments.map((a) => (
                  <AndamioLedgerRow
                    key={`assess-${a.projectId}`}
                    href={`/studio/project/${a.projectId}?tab=commitments`}
                    title={a.projectTitle || `${a.projectId.slice(0, 16)}…`}
                    status={<span className="text-primary">{a.count} to assess</span>}
                  />
                ))}
                {managing
                  .filter((p) => !assessments.some((a) => a.projectId === p.projectId))
                  .map((p) => (
                    <AndamioLedgerRow
                      key={`manage-${p.projectId}`}
                      href={`/studio/project/${p.projectId}`}
                      title={p.title || `${p.projectId.slice(0, 16)}…`}
                      status="Managing"
                    />
                  ))}
              </AndamioLedger>
            </div>
          )}
          <Link href="/studio" className="inline-block text-sm font-medium text-primary underline underline-offset-4">
            Open the studio
          </Link>
        </div>
      )}
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 2: Contributing** (`contributing-ledger.tsx`)

```tsx
"use client";

import React from "react";
import { AndamioLedger, AndamioLedgerRow, AndamioLedgerSkeleton, AndamioRecordSection } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";

/** Shown only when the user contributes to a project. */
export function ContributingLedger() {
  const { projects, isLoading } = useDashboardData();
  const contributing = projects?.contributing ?? [];
  if (!isLoading && contributing.length === 0) return null;

  return (
    <AndamioRecordSection label="Contributing">
      {isLoading ? (
        <AndamioLedgerSkeleton rows={2} />
      ) : (
        <AndamioLedger label="Projects you contribute to">
          {contributing.map((p) => (
            <AndamioLedgerRow
              key={p.projectId}
              href={`/project/${p.projectId}/contributor`}
              title={p.title || `${p.projectId.slice(0, 16)}…`}
              detail={p.description || undefined}
              status="Contributor"
            />
          ))}
          <AndamioLedgerRow serif={false} href="/project" title="Browse more projects" />
        </AndamioLedger>
      )}
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 3: Check**

Run: `npm run typecheck && npx eslint src/components/dashboard/record/`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/record/duties-ledger.tsx src/components/dashboard/record/contributing-ledger.tsx
git commit -m "feat: duties and contributing ledgers"
```

### Task 18: Accomplishments and Record details panels

**Files:**
- Create: `src/components/dashboard/record/accomplishments-panel.tsx`
- Create: `src/components/dashboard/record/record-details.tsx`

- [ ] **Step 1: Accomplishments** (`accomplishments-panel.tsx`)

```tsx
"use client";

import React from "react";
import { AndamioRecordSection, AndamioSkeleton } from "~/components/andamio";
import { RefreshIcon } from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

export function AccomplishmentsPanel() {
  const { counts, isLoading, refetch } = useDashboardData();
  const rows: [string, number][] = [
    ["Courses enrolled", counts?.enrolledCourses ?? 0],
    ["Courses completed", counts?.completedCourses ?? 0],
    ["Credentials earned", counts?.totalCredentials ?? 0],
  ];

  return (
    <AndamioRecordSection label="Accomplishments">
      {isLoading ? (
        <AndamioSkeleton className="h-20 w-full" />
      ) : (
        <dl className="divide-y divide-border border-y border-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between py-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-serif text-lg font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <button
        type="button"
        onClick={refetch}
        className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshIcon className="h-3 w-3" /> Refresh
      </button>
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 2: Record details** (`record-details.tsx`), replacing AccountDetailsCard and the old status bar's timer and alias

```tsx
"use client";

import React from "react";
import { AndamioRecordSection } from "~/components/andamio";
import { CompletedIcon, CopyIcon } from "~/components/icons";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { useSessionExpiry } from "~/hooks/auth/use-session-expiry";

export function RecordDetails({
  walletAddress,
  accessTokenAlias,
}: {
  walletAddress: string | null | undefined;
  accessTokenAlias: string | null | undefined;
}) {
  const { isCopied, copy } = useCopyFeedback();
  const session = useSessionExpiry();

  return (
    <AndamioRecordSection label="Record details">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Wallet</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            <code className="min-w-0 truncate font-mono text-xs">{walletAddress ?? "Not connected"}</code>
            {walletAddress && (
              <button
                type="button"
                onClick={() => void copy(walletAddress)}
                aria-label="Copy wallet address"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {isCopied ? <CompletedIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Access token</dt>
          <dd className="mt-0.5 font-serif text-base font-medium">{accessTokenAlias ?? "Not created"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Session</dt>
          <dd className={session.isExpiringSoon ? "mt-0.5 font-medium text-destructive" : "mt-0.5"}>
            {session.label === "Expired"
              ? "Expired. Sign in again."
              : session.label
                ? `Active, ${session.label} left`
                : "Active"}
          </dd>
        </div>
      </dl>
    </AndamioRecordSection>
  );
}
```

- [ ] **Step 3: Check**

Run: `npm run typecheck && npx eslint src/components/dashboard/record/`
Expected: no errors. (`RefreshIcon`, `CopyIcon`, `CompletedIcon` are already imported from `~/components/icons` by the old widgets.)

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/record/accomplishments-panel.tsx src/components/dashboard/record/record-details.tsx
git commit -m "feat: accomplishments and record details panels"
```

### Task 19: Compose the dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace the imports block** (everything from `import { MyLearning }` down to `import { AndamioText } from "~/components/andamio";`) with:

```tsx
import { AccessTokenConfirmationAlert } from "~/components/dashboard/access-token-confirmation-alert";
import {
  PostMintAuthPrompt,
  checkAndClearJustMintedFlag,
} from "~/components/dashboard/post-mint-auth-prompt";
import { AndamioRecordHeader, AndamioRecordLayout } from "~/components/andamio";
import { truncateWalletAddress } from "~/config";
import { Admission } from "~/components/dashboard/record/admission";
import { DashboardNextStep } from "~/components/dashboard/record/dashboard-next-step";
import { CoursesLedger } from "~/components/dashboard/record/courses-ledger";
import { ProjectsUnlocking } from "~/components/dashboard/record/projects-unlocking";
import { DutiesLedger } from "~/components/dashboard/record/duties-ledger";
import { ContributingLedger } from "~/components/dashboard/record/contributing-ledger";
import { PathPanel } from "~/components/dashboard/record/path-panel";
import { AccomplishmentsPanel } from "~/components/dashboard/record/accomplishments-panel";
import { RecordDetails } from "~/components/dashboard/record/record-details";
```

Keep the `React`, `useRouter`, `useAndamioAuth`, `DashboardProvider`, `ConnectWalletGate` and `AuthUser` imports. Remove `useDashboardData` from the dashboard-context import if it is no longer used.

- [ ] **Step 2: Remove the JWT parsing block** (`let jwtExpiration … }` before `const hasAccessToken`). Session time now comes from `useSessionExpiry` inside `RecordDetails`.

- [ ] **Step 3: Replace the no-access-token return** with:

```tsx
  if (!hasAccessToken) {
    return (
      <div className="space-y-6">
        <AccessTokenConfirmationAlert onComplete={() => router.refresh()} />
        <Admission walletAddress={user.cardanoBech32Addr} onMinted={() => router.refresh()} />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardContent user={user} />
    </DashboardProvider>
  );
}
```

- [ ] **Step 4: Replace `DashboardContentProps` and `DashboardContent`** with:

```tsx
function DashboardContent({ user }: { user: AuthUser }) {
  return (
    <>
      <AndamioRecordHeader
        label="Academic record"
        title={user.accessTokenAlias}
        meta={user.cardanoBech32Addr ? `Wallet ${truncateWalletAddress(user.cardanoBech32Addr)}` : undefined}
      />
      <AndamioRecordLayout
        main={
          <>
            <DashboardNextStep />
            <CoursesLedger />
            <ProjectsUnlocking />
            <DutiesLedger />
            <ContributingLedger />
          </>
        }
        margin={
          <>
            <PathPanel />
            <AccomplishmentsPanel />
            <RecordDetails walletAddress={user.cardanoBech32Addr} accessTokenAlias={user.accessTokenAlias} />
          </>
        }
      />
    </>
  );
}
```

- [ ] **Step 5: Check**

Run: `npm run typecheck && npx eslint "src/app/(app)/dashboard/page.tsx" && npm run test:unit 2>&1 | grep -E "^# (pass|fail)"`
Expected: no errors; `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat: dashboard as an academic record with a next step and path"
```

### Task 20: Feature parity check

Walk through every old widget and confirm its function survives. Fix any gap before Task 21.

- [ ] **Step 1: Check against this list** in the running app (`npm run dev`), signed in as a user with data where possible:

| Old widget | Function | Now in |
|---|---|---|
| WelcomeHero | alias heading; Browse Courses button; credential badges linking to course | RecordHeader; next step "Browse courses" / Courses ledger empty action; Courses ledger rows (credential count + link) |
| GettingStarted | 3-step progress | Admission path |
| MintAccessToken | alias form | Admission next step (same component) |
| MyLearning | enrolled + completed, claimable first, link per course, Browse | Courses ledger (sorted claimable first) |
| OnChainStatus | course list, refresh, error | Courses ledger; Accomplishments refresh |
| StudentAccomplishments | counts, refresh | Accomplishments panel |
| ProjectUnlockProgress | qualified link, per-project progress, claim hint, overflow, empty action | Projects unlocking |
| PendingReviewsSummary | per-course counts → teacher view; retry on error | Duties |
| PendingAssessmentsSummary | per-project counts → commitments tab | Duties |
| OwnedCoursesSummary | owned courses → studio course; /studio | Duties |
| ManagingProjectsSummary | managed projects → studio project | Duties |
| ContributingProjectsSummary | projects → contributor page; /project | Contributing |
| AccountDetailsCard | address + copy, alias, session | Record details |
| AuthStatusBar | wallet state, auth error/retry, timer, alias, theme, sign out | spine (AuthNotice, ThemeToggle, Sign Out, alias), Record details (timer) |

Expected: every row ticked. If one is missing, add it to the matching new component and commit (`fix: keep <function> on the dashboard`).

### Task 21: Remove replaced widgets

**Files:**
- Delete only what nothing imports any more.

- [ ] **Step 1: Find unused files**

Run:
```bash
for f in welcome-hero getting-started on-chain-status student-accomplishments account-details pending-reviews-summary pending-assessments-summary owned-courses-summary managing-projects-summary contributing-projects-summary; do
  n=$(grep -rln "components/dashboard/$f\"" src | wc -l); echo "$f $n"; done
for f in learner/my-learning learner/project-unlock-progress; do
  n=$(grep -rln "components/$f\"" src | wc -l); echo "$f $n"; done
```
Expected: each prints a count; `0` means unused.

- [ ] **Step 2: Delete the unused ones** with `git rm <path>` for every file that printed `0`. Keep `access-token-confirmation-alert.tsx` and `post-mint-auth-prompt.tsx` (still used).

- [ ] **Step 3: Check**

Run: `npm run typecheck && npm run test:unit 2>&1 | grep -E "^# (pass|fail)"`
Expected: no errors; `# fail 0`.

- [ ] **Step 4: Commit and push**

```bash
git commit -m "chore: remove dashboard widgets replaced by the record"
git push origin main
```

### Task 22: Visual and live check

- [ ] **Step 1: Visual check** at 375px and desktop, light and dark, for both states:
  - before token: sign in with the Google test wallet (no alias);
  - after token: sign in with `EverydayLewis`.
  Expected: header rule, navy next step, ledgers, margin below the main column on phones, touch targets at least 44px, no text below AA.

- [ ] **Step 2: Live check after deploy**

Run: `vercel ls --prod | head -3` until Ready; then load `https://tracom-credentials.vercel.app/dashboard` signed in both ways.
Expected: same as Step 1 on production.

### Task 23: README (user request, after the redesign)

- [ ] **Step 1:** Read `README.md` and compare it with the current app: Tracom branding, mainnet, Tracom-only filter, social login on free plans, the Record design, `npm run test:unit`, Vercel and Andamio CLIs. List what's out of date and propose the rewrite to the user before editing (it's public-facing text).
