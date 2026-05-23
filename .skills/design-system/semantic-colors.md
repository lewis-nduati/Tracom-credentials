# Semantic Color System

**CRITICAL RULE**: Always use semantic color variables. Never use hardcoded Tailwind color classes.

## Overview

All colors in this application are defined as semantic variables in `src/styles/globals.css` using the OKLCH color space. This provides:

- ✅ Full light/dark mode support
- ✅ Consistent color usage across the app
- ✅ Easy theme customization
- ✅ Better accessibility
- ✅ Type-safe color references

## Available Semantic Colors

### Status Colors (Most Common)

These are the colors you'll use most often for UI states:

| Color | Usage | Examples |
|-------|-------|----------|
| `success` / `success-foreground` | Success states, completed items, active connections | ✅ Checkmarks, "Connected", completed assignments |
| `warning` / `warning-foreground` | Warnings, pending states, cautionary info | ⚠️ Pending approvals, in-progress tasks |
| `info` / `info-foreground` | Informational states, neutral status | ℹ️ Help text, awaiting states, clock icons |
| `destructive` / `destructive-foreground` | Errors, destructive actions, critical alerts | ❌ Delete buttons, errors, denied states |

### Base Colors

| Color | Usage |
|-------|-------|
| `background` / `foreground` | Main page background and text color |
| `card` / `card-foreground` | Card backgrounds and card text |
| `popover` / `popover-foreground` | Popover/dropdown backgrounds and text |

### Interactive Colors

| Color | Usage |
|-------|-------|
| `primary` / `primary-foreground` | Primary actions, links, brand elements |
| `secondary` / `secondary-foreground` | Secondary actions and elements |
| `muted` / `muted-foreground` | Muted/subtle elements, placeholders |
| `accent` / `accent-foreground` | Accent/highlight elements |

### Utility Colors

| Color | Usage |
|-------|-------|
| `border` | Borders and dividers |
| `input` | Input field borders |
| `ring` | Focus rings |
| `chart-1` to `chart-5` | Data visualization colors |
| `sidebar-*` | Sidebar-specific colors |

## Usage Examples

### ✅ CORRECT Usage

```typescript
// Success state - completed assignment
<CheckCircle className="h-4 w-4 text-success" />
<span className="text-success">Assignment Complete!</span>

// Warning state - pending approval
<AlertTriangle className="h-4 w-4 text-warning" />
<Badge variant="outline" className="text-warning">Pending</Badge>

// Info state - awaiting evidence
<Clock className="h-4 w-4 text-info" />
<p className="text-info">Awaiting submission</p>

// Destructive state - error or delete action
<XCircle className="h-4 w-4 text-destructive" />
<Button variant="destructive">Delete Course</Button>

// Primary - links
<a href="/courses" className="text-primary hover:underline">
  View all courses
</a>

// Muted - helper text
<p className="text-muted-foreground">
  Enter your wallet address above
</p>

// Success with contrasting foreground
<Badge className="bg-success text-success-foreground">
  Live
</Badge>
```

### ❌ WRONG Usage - Never Do This!

```typescript
// ❌ Hardcoded Tailwind colors - FORBIDDEN
<CheckCircle className="text-green-600" />
<div className="bg-blue-500">Content</div>
<span className="text-red-600">Error</span>
<Button className="bg-green-500 hover:bg-green-600">Success</Button>
<a className="text-blue-600 hover:underline">Link</a>

// ❌ Color names instead of semantic names
<div className="text-green">Success</div>
<div className="bg-red">Error</div>
```

## When to Use Which Color

### Success (Green)
Use for positive states and confirmations:
- ✅ Completed tasks/assignments
- ✅ Successful operations (save, publish, submit)
- ✅ Active/connected states (wallet connected, authenticated)
- ✅ Checkmarks and success indicators
- ✅ Enrollment confirmed
- ✅ Assignment approved

### Warning (Yellow/Amber)
Use for states requiring attention but not critical:
- ⚠️ Pending approvals
- ⚠️ Awaiting review
- ⚠️ In-progress states
- ⚠️ Cautionary information
- ⚠️ Non-critical alerts
- ⚠️ Temporary states

### Info (Blue)
Use for informational, neutral states:
- ℹ️ Informational messages
- ℹ️ Neutral status indicators
- ℹ️ Help text and tooltips
- ℹ️ Pending/awaiting states (neutral)
- ℹ️ Default notification states
- ℹ️ Clock/time indicators

### Destructive (Red)
Use for errors and destructive actions:
- ❌ Error messages
- ❌ Failed operations
- ❌ Delete/remove actions
- ❌ Critical alerts
- ❌ Denied/rejected states
- ❌ Disconnected states (errors)
- ❌ Form validation errors

### Primary (Theme-dependent)
Use for primary actions and navigation:
- 🔗 Links and hyperlinks
- 🔘 Primary call-to-action buttons
- 📍 Active navigation items
- 🎨 Brand-related elements

### Muted
Use for subtle, secondary information:
- 📝 Placeholder text
- 💬 Helper text and descriptions
- ⏸️ Disabled states
- 📊 Secondary information
- 🕒 Timestamps and metadata

## Real-World Component Examples

### Status Indicators

```typescript
// User enrollment status
{isEnrolled ? (
  <>
    <CheckCircle className="h-4 w-4 text-success" />
    <span className="text-success">Enrolled</span>
  </>
) : (
  <>
    <AlertTriangle className="h-4 w-4 text-warning" />
    <span className="text-warning">Not Enrolled</span>
  </>
)}

// Assignment workflow status
{status === 'ACCEPTED' && (
  <Badge className="bg-success text-success-foreground">Accepted</Badge>
)}
{status === 'PENDING' && (
  <Badge className="bg-warning text-warning-foreground">Pending</Badge>
)}
{status === 'DENIED' && (
  <Badge variant="destructive">Denied</Badge>
)}
```

### Authentication States

```typescript
// Wallet connected
<ShieldCheck className="h-4 w-4 text-success" />
<Badge variant="default">
  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
  Authenticated
</Badge>

// Authentication error
<ShieldAlert className="h-4 w-4 text-destructive" />
<Badge variant="destructive">Auth Error</Badge>

// Not authenticated
<Shield className="h-4 w-4 text-muted-foreground" />
<Badge variant="secondary">Not Authenticated</Badge>
```

### Stats Cards

```typescript
// Success metric
<Card>
  <CardHeader>
    <CheckCircle className="h-4 w-4 text-success" />
    <CardTitle>Accepted</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-success">
      {acceptedCount}
    </div>
  </CardContent>
</Card>

// Error metric
<Card>
  <CardHeader>
    <XCircle className="h-4 w-4 text-destructive" />
    <CardTitle>Denied</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-destructive">
      {deniedCount}
    </div>
  </CardContent>
</Card>
```

## Color Values (Reference)

All colors are defined using OKLCH color space for better perceptual uniformity. Values are sourced from the [Andamio Brand Hub](https://www.andamio.io/brand/developers).

### Brand Colors (From Brand Hub)

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Background | `oklch(1 0 0)` | `oklch(0.188 0.013 257.128)` |
| Foreground | `oklch(0.145 0 0)` | `oklch(0.922 0.003 106.423)` |
| Primary | `oklch(0.669 0.199 38.581)` | `oklch(0.719 0.174 38.581)` |
| Secondary | `oklch(0.387 0.134 250.505)` | `oklch(0.605 0.155 250.505)` |
| Accent | `oklch(0.988 0.008 79.439)` | `oklch(0.338 0.024 257.128)` |
| Destructive | `oklch(0.608 0.227 27.325)` | `oklch(0.704 0.191 22.216)` |
| Border | `oklch(0.922 0.003 106.423)` | `oklch(0.338 0.024 257.128)` |
| Muted | `oklch(0.985 0.002 106.423)` | `oklch(0.241 0.018 257.128)` |

### Status Colors

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Success | `oklch(0.52 0.15 160)` | `oklch(0.62 0.16 160)` |
| Warning | `oklch(0.75 0.16 70)` | `oklch(0.80 0.15 70)` |
| Info | `oklch(0.55 0.15 250)` | `oklch(0.65 0.14 250)` |
| Destructive | `oklch(0.608 0.227 27.325)` | `oklch(0.704 0.191 22.216)` |

### Key Brand Color Notes

- **Primary (Orange/Coral, hue ~38)**: Used for CTAs, buttons, and primary actions
- **Secondary (Deep Blue, hue ~250)**: Used for headings and links
- **Accent (Warm Cream, hue ~79)**: Used for highlights and accent elements
- **Border Radius**: `0.625rem` (consistent across all components)

## Adding New Semantic Colors

If you need to add a new semantic color:

1. **Add to `@theme inline` block**:
```css
--color-your-color: var(--your-color);
--color-your-color-foreground: var(--your-color-foreground);
```

2. **Add light mode values in `:root`**:
```css
--your-color: oklch(0.6 0.15 145);
--your-color-foreground: oklch(0.985 0 0);
```

3. **Add dark mode values in `.dark`**:
```css
--your-color: oklch(0.7 0.15 145);
--your-color-foreground: oklch(0.145 0 0);
```

4. **Document the color** in this file and `.claude/CLAUDE.md`

5. **Update components** to use the new semantic color

## Enforcement

**Code Review Checklist**:
- [ ] No hardcoded color classes (`text-blue-600`, `bg-green-500`, etc.)
- [ ] All colors use semantic variables
- [ ] Appropriate semantic color chosen for the use case
- [ ] Both base and foreground colors used where needed
- [ ] Dark mode considered and tested

**Linting** (future):
Consider adding an ESLint rule to catch hardcoded color classes:
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/text-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|amber|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]/]",
        "message": "Use semantic color variables instead of hardcoded Tailwind colors"
      }
    ]
  }
}
```

## Migration Guide

If you find hardcoded colors in existing code:

1. **Identify the color's purpose**:
   - Success/positive? → `text-success`
   - Warning/pending? → `text-warning`
   - Info/neutral? → `text-info`
   - Error/destructive? → `text-destructive`
   - Link? → `text-primary`
   - Subtle text? → `text-muted-foreground`

2. **Replace the hardcoded class**:
```typescript
// Before
<CheckCircle className="text-green-600" />

// After
<CheckCircle className="text-success" />
```

3. **Test in both light and dark modes**

4. **Verify contrast and accessibility**

## Resources

- **File**: `src/styles/globals.css` - All color definitions
- **Docs**: `.claude/CLAUDE.md` - Complete development guide
- **Docs**: `README.md` - User-facing documentation
- **shadcn/ui**: https://ui.shadcn.com - Component library
- **OKLCH**: https://oklch.com - Color space documentation
