# AGENTS.md - Andamio App Template

> **Audience**: Anyone working in this repo (forkers and the template maintainers alike). Some sections describe Andamio's specific gateway and type-generation pipeline — if you've forked this template and pointed it at a different backend, treat those as guidance rather than rules.

Project instructions for AI coding agents. Works with [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), [Copilot](https://github.com/features/copilot), [Gemini CLI](https://geminicli.com), and [30+ other compatible agents](https://agentskills.io/home).

## Project Overview

Cardano dApp starter: Next.js 15, tRPC v11, Tailwind CSS v4, Mesh SDK, shadcn/ui.

**Gateway**: `https://preprod.api.andamio.io` | **Docs**: [docs.andamio.io](https://docs.andamio.io)

## Critical Rules

### Types
- **Always** import from `~/types/generated` - never define API types locally
- Regenerate: `npm run generate:types`

### Variable Naming
- **Never** use `module` as a variable name → use `courseModule`
- Be explicit: `courseData`, `lessonData`, `assignmentData`

### Icons
- **Always** import from `~/components/icons` with semantic names
- **Never** import directly from `lucide-react`
- Examples: `CredentialIcon`, `SLTIcon`, `CourseIcon`, `SuccessIcon`

### Styling
- **Only** use shadcn/ui components from `~/components/ui/`
- **Only** use semantic colors: `primary`, `secondary`, `muted`, `destructive`
- **Never** use hardcoded colors like `text-green-600` or `bg-blue-500`
- Use `AndamioText` for paragraphs, not raw `<p>` tags
- Headings (h1-h6) have base defaults in `@layer base` — override freely with Tailwind utilities
- For content-heavy sections (paragraphs, lists, blockquotes), wrap in `className="prose-content"`

### CSS Architecture (Tailwind v4 Cascade Layers)
- Layer order: `@layer base` < `@layer components` < `@layer utilities` < unlayered
- **Base**: heading defaults (h1-h6), body/html reset — NO `!important`, freely overridable
- **Components**: `.prose-content`, card augmentation, table augmentation
- **Utilities**: `.focus-ring`, `.hover-lift`, etc.
- **Unlayered**: brand overrides (tabs, checkbox) — highest priority without needing `!important`
- `.prose-content` scopes paragraph spacing, list markers, blockquote, code styles to descendants only
- No global form/input/button styles — shadcn components own their own styling
- shadcn Card uses `py-6` on card + `px-6` on children — don't add `p-6` to card (double horizontal padding)

### Wallet UI
- **Never** import `@meshsdk/react/styles.css` — it bundles a full TW3 preflight that destroys our design system at any layer priority
- **Never** import `CardanoWallet` from `@meshsdk/react` — use `ConnectWalletButton` from `~/components/auth/connect-wallet-button`
- `ConnectWalletButton` uses Mesh hooks (`useWallet`, `useWalletList`) with our shadcn Dialog/Button/DropdownMenu/Tooltip
- No `isDark`/`mounted`/`useTheme`/`WEB3_SERVICES_CONFIG` boilerplate needed — component handles its own theming via semantic colors

### Text Components
```typescript
import { AndamioText } from "~/components/andamio";
<AndamioText variant="muted">Helper text</AndamioText>
<AndamioText variant="small">Small text</AndamioText>
```

## Architecture

### Repository Structure
```
src/
├── config/           # Transaction schemas, UI config
├── hooks/            # Transaction hooks, API hooks
├── types/generated/  # Auto-generated API types
├── components/
│   ├── andamio/      # Andamio design system components
│   ├── icons/        # Centralized icon exports
│   └── ui/           # shadcn/ui base components
└── lib/              # API clients, utilities
```

### API Patterns
```typescript
import { gateway, gatewayAuth } from "~/lib/gateway";
import type { CourseResponse } from "~/types/generated";

// Public
const data = await gateway<CourseResponse[]>("/api/v2/course/user/courses/list");

// Authenticated
const data = await gatewayAuth<CourseResponse[]>("/api/v2/course/owner/courses/list", jwt);
```

### Route Structure
```
/                → Landing page
/migrate         → V1→V2 access token migration (no sidebar, no auth)
/(app)/dashboard → Dashboard (sidebar layout)
/(app)/courses   → Courses (sidebar layout)
```

## Authentication

**With Access Token**: Wallet connect → detect token → POST `/auth/login` → JWT
**Without Token**: Wallet connect → POST `/auth/login/session` → sign nonce → POST `/auth/login/validate` → JWT

Wallet addresses: Convert hex to bech32 using `core.Address.fromString().toBech32()`

### Security Features

**Wallet Switch Detection**: The auth context monitors the connected wallet address during active sessions. If a user switches to a different wallet while authenticated, they are automatically logged out to prevent session hijacking or data leakage. This check runs every 2 seconds via polling (in addition to reactive checks on wallet state changes) to catch switches that don't trigger React re-renders. See `contexts/andamio-auth-context.tsx:507` for implementation.

## Key Files

| Category | Files |
|----------|-------|
| Auth | `hooks/auth/use-andamio-auth.ts`, `lib/andamio-auth.ts` |
| Wallet | `components/auth/connect-wallet-button.tsx` |
| API | `lib/gateway.ts`, `types/generated/` |
| TX | `hooks/tx/use-transaction.ts`, `hooks/tx/use-tx-stream.ts` |
| Layout | `components/layout/app-layout.tsx`, `app-sidebar.tsx` |

## Development

```bash
npm run dev          # Start dev server
npm run typecheck    # Type check
npm run generate:types  # Regenerate API types
```

## Environment Variables

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://preprod.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

## Skills

This repo includes [Agent Skills](https://agentskills.io) — portable instructions that work with any compatible coding agent.

**Start here**: `/getting-started` → then explore `/transactions`, `/task-lifecycle`, `/design-system` as needed.

| Skill | Purpose |
|-------|---------|
| `/getting-started` | Customize theme colors in 2 minutes |
| `/design-system` | Styling patterns and component reference |
| `/transactions` | Cardano TX state machine, hooks, and how to add your own TX types |
| `/task-lifecycle` | The commit → submit → review → assess flow and how to adapt it |

Skills are in `.skills/*/SKILL.md`. See the [Agent Skills spec](https://agentskills.io/specification) for the format.
