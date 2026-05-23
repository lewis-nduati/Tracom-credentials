# Andamio UI Components

**Wrapper components for shadcn/ui with Andamio-specific defaults and enhancements.**

This directory contains Andamio-branded wrappers for all shadcn/ui components. These wrappers:
- Maintain the full shadcn/ui API
- Add Andamio-specific default styling
- Provide additional convenience features
- Are designed to be extracted into `@andamio/ui` package

## Philosophy

### Why Wrap Instead of Modify?

**shadcn/ui's intended use**: Copy components and modify them directly.

**Our approach for templates**:
1. ✅ **Keep base shadcn pristine** - Easy to update from upstream
2. ✅ **Create Andamio wrappers** - Our opinions live here
3. ✅ **Clear separation** - Know what's "stock" vs "custom"
4. ✅ **Package-ready** - Easy to extract to `@andamio/ui`

## Directory Structure

```
src/components/
├── ui/              # 🔒 Base shadcn components - DON'T MODIFY
│   ├── button.tsx
│   ├── badge.tsx
│   └── ...
│
└── andamio/         # ✨ Andamio wrappers - CUSTOMIZE HERE
    ├── andamio-button.tsx
    ├── andamio-badge.tsx
    ├── andamio-card.tsx
    ├── index.ts
    └── README.md (this file)
```

## Component Categories

### Enhanced Components

Components with Andamio-specific features and opinions:

#### `AndamioButton`
Enhanced with loading states and icon support.

```typescript
import { AndamioButton } from "~/components/andamio";

// Loading state
<AndamioButton isLoading>Save</AndamioButton>

// With icons
<AndamioButton leftIcon={<Save />}>Save Course</AndamioButton>
<AndamioButton rightIcon={<ArrowRight />}>Next</AndamioButton>
```

#### `AndamioBadge`
Enhanced with semantic status variants.

```typescript
import { AndamioBadge } from "~/components/andamio";

<AndamioBadge status="live">Live</AndamioBadge>
<AndamioBadge status="draft">Draft</AndamioBadge>
<AndamioBadge status="archived">Archived</AndamioBadge>
<AndamioBadge status="pending">Pending</AndamioBadge>
<AndamioBadge status="success">Success</AndamioBadge>
<AndamioBadge status="error">Error</AndamioBadge>
```

All status variants use semantic colors from `globals.css`.

#### `AndamioCard`
Re-exports with Andamio naming convention.

```typescript
import {
  AndamioCard,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardDescription,
  AndamioCardContent,
  AndamioCardFooter
} from "~/components/andamio";
```

#### `AndamioCode`
Component for displaying formatted JSON or code blocks with proper styling.

```typescript
import { AndamioCode } from "~/components/andamio";

// Display JSON data
<AndamioCode data={myObject} />

// Custom indentation
<AndamioCode data={myObject} indent={4} />

// Display raw code
<AndamioCode>
  const foo = "bar";
</AndamioCode>
```

Features:
- Automatic JSON stringification via `data` prop
- Configurable indentation
- Fixed `text-xs` size (overrides global CSS)
- Proper overflow handling
- Loading and empty states supported

### Pass-Through Components

Components that currently just re-export the base shadcn component. These are placeholders for future Andamio-specific customizations.

All other components (`AndamioAlert`, `AndamioInput`, `AndamioDialog`, etc.) currently re-export their base shadcn equivalents. This provides:
- Consistent import pattern
- Easy future customization
- Preparation for package extraction

## Usage Patterns

### Pattern 1: Import from Andamio

```typescript
// Recommended - use Andamio wrappers
import { AndamioButton, AndamioBadge } from "~/components/andamio";

<AndamioButton isLoading>Save</AndamioButton>
<AndamioBadge status="live">Live</AndamioBadge>
```

### Pattern 2: Direct shadcn (when needed)

```typescript
// Use base shadcn when you need full control
import { Button } from "~/components/ui/button";

<Button className="custom-styles">Custom Button</Button>
```

### Pattern 3: Mix and Match

```typescript
// Both approaches work side-by-side
import { Button } from "~/components/ui/button";
import { AndamioButton } from "~/components/andamio";

<Button>Base shadcn</Button>
<AndamioButton>Andamio styled</AndamioButton>
```

## Adding Custom Behavior

To customize a component, edit its file in `src/components/andamio/`:

```typescript
// src/components/andamio/andamio-button.tsx

import { Button, type ButtonProps } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface AndamioButtonProps extends ButtonProps {
  // Add custom props
  myCustomProp?: boolean;
}

export const AndamioButton = React.forwardRef<
  HTMLButtonElement,
  AndamioButtonProps
>(({ className, myCustomProp, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        // Add Andamio defaults
        "font-semibold",
        myCustomProp && "custom-class",
        className
      )}
      {...props}
    />
  );
});
```

## Future: Package Extraction

These components are designed to be extracted into `@andamio/ui`:

### Current (Monorepo)
```typescript
import { AndamioButton } from "~/components/andamio";
```

### Future (Published Package)
```typescript
import { AndamioButton } from "@andamio/ui";
```

### Package Structure
```
packages/@andamio/ui/
├── src/
│   ├── andamio-button.tsx
│   ├── andamio-badge.tsx
│   ├── andamio-card.tsx
│   └── index.ts
├── package.json
└── README.md
```

### Peer Dependencies
```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "@radix-ui/*": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "tailwindcss": "^4.0.0"
  }
}
```

## Updating shadcn Components

When shadcn releases updates:

1. **Update base components** in `src/components/ui/`:
   ```bash
   npx shadcn@latest add button
   ```

2. **Andamio wrappers automatically inherit** the updates (they import from `~/components/ui/`)

3. **Test Andamio wrappers** to ensure customizations still work

4. **No conflicts** - base and wrapper are separate files

## Guidelines

### ✅ DO

- Customize components in `src/components/andamio/`
- Use semantic colors from `globals.css`
- Maintain the base component API
- Add Andamio-specific props/features
- Document custom behavior
- Keep wrappers thin and focused

### ❌ DON'T

- Modify files in `src/components/ui/` (except via `shadcn add`)
- Use hardcoded colors (use semantic variables)
- Break the base component API
- Add heavy dependencies to wrappers
- Duplicate base component code

## Testing with Themes

All Andamio components work with semantic color system:

```typescript
// These components automatically adapt to theme changes
<AndamioBadge status="live">Live</AndamioBadge>
<AndamioButton variant="destructive">Delete</AndamioButton>
```

Try the "Chaos Mode" theme (in globals.css) to see which components use which semantic colors!

## Contributing

When adding a new shadcn component:

1. **Install with shadcn**:
   ```bash
   npx shadcn@latest add new-component
   ```

2. **Create Andamio wrapper**:
   ```bash
   node scripts/generate-wrappers.mjs
   ```

3. **Customize if needed** in `src/components/andamio/andamio-new-component.tsx`

4. **Export from index.ts**

5. **Update this README** if adding new patterns

## Complete Component List

### Enhanced (Customized)
- `AndamioButton` - Loading states, icons
- `AndamioBadge` - Status variants
- `AndamioCard` - Consistent naming
- `AndamioCode` - JSON/code display with formatting

### Pass-Through (Ready to Customize)
All other components currently re-export from base shadcn:

- AndamioAccordion
- AndamioAlert
- AndamioAlertDialog
- AndamioAspectRatio
- AndamioAvatar
- AndamioBreadcrumb
- AndamioCalendar
- AndamioCarousel
- AndamioChart
- AndamioCheckbox
- AndamioCollapsible
- AndamioCommand
- AndamioConfirmDialog
- AndamioContextMenu
- AndamioDialog
- AndamioDrawer
- AndamioDropdownMenu
- AndamioForm
- AndamioHoverCard
- AndamioInput
- AndamioInputOtp
- AndamioLabel
- AndamioMenubar
- AndamioNavigationMenu
- AndamioPagination
- AndamioPopover
- AndamioProgress
- AndamioRadioGroup
- AndamioResizable
- AndamioScrollArea
- AndamioSelect
- AndamioSeparator
- AndamioSheet
- AndamioSkeleton
- AndamioSlider
- AndamioSonner
- AndamioSwitch
- AndamioTable
- AndamioTabs
- AndamioTextarea
- AndamioToggle
- AndamioToggleGroup
- AndamioTooltip

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Andamio Semantic Colors](../../docs/styling/SEMANTIC-COLORS.md)
- [Component Library Goals](../../README.md#goals)
