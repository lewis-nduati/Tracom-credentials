# The Record: redesign of the signed-in app

Date: 6 October 2026
Status: approved for stages 1 and 2

## Why

The signed-in app still looks like the stock Andamio app template: bright blue, a navy pill sidebar, a blue "Mesh Web3 Services · Auth" status bar, and grids of identical cards. Tracom's product should feel like an institution's own record, not a protocol demo (PRODUCT.md, "Generic SaaS template" and "Crypto/web3 aesthetic" anti-references).

The redesign changes how things look and how the dashboard is organised. It does not remove any feature, action, link or state.

## Direction

**The Record with a Path.** Each page reads like a page of an academic record: a serif name or title, ruled ledgers instead of card grids, and status written in words. The dashboard adds a "path": one clear next step and a line of milestones showing what the learner has done.

Decisions taken during design:

| Question | Decision |
|---|---|
| Direction | The Record (transcript) combined with the Path (next step and milestones) |
| Dashboard layout | Main column plus a margin column; the margin drops below on phones |
| Scope | The whole signed-in app, in five stages, Studio included |
| Type | Newsreader (serif) for titles and names, Inter for everything else, Geist Mono for addresses |
| Shell | A navy sidebar ("spine"); the blue status bar is removed |
| Dark mode | Kept, with its own "night record" palette |

## Stages

| Stage | Scope | Spec |
|---|---|---|
| 1. Foundation and shell | Tokens, type, shared building blocks, sidebar, mobile nav | This document |
| 2. Dashboard | Before-token and after-token dashboard | This document |
| 3. Learner pages | Credentials, course list, course, module, lesson, assignment | Own spec, later |
| 4. Project pages | Project list, project, task, contributor | Own spec, later |
| 5. Studio | Course and project studio, import, learner management | Own spec, later |

Stages 3 to 5 follow the rules in "Rules for every page" below.

## Stage 1: Foundation and shell

### Tokens

Change the values of the existing tokens in `src/styles/globals.css` (`:root` and `.dark`). Components keep using the same semantic names (`background`, `card`, `primary`, `muted`, `border`, `sidebar`), so every page takes on the new look without per-component edits.

Light ("paper"):

- `--background`: warm off-white paper, around `#F7F5F0`
- `--card`: a slightly lighter paper than the background
- `--muted`: a slightly darker paper, for quiet bands
- `--foreground`: near-black ink with a little warmth
- `--muted-foreground`: warm grey, at least 4.5:1 on paper
- `--border`: a warm hairline, around `#D9D2C3`
- `--primary`: brand navy `#1A3D6B` (already `--brand-navy`), with white foreground
- `--sidebar` and its family: navy spine (see Shell)
- `--radius`: about 4px

Dark ("night record"):

- `--background`: deep navy-charcoal
- `--card`: one step lighter
- `--foreground`: warm off-white
- `--border`: a low-contrast warm line
- `--primary`: navy lightened until it reaches AA against the dark background

Status colours (success, warning, destructive, info) stay semantic and are rechecked for AA on the new backgrounds.

Depth comes from rules and background steps. No shadows, no gradients.

### Type

- Add Newsreader with `next/font/google`, as `--font-serif`, only the weights in use (400 and 500), `display: "swap"`.
- Newsreader: page titles, people's names and aliases in headers, course and credential names in ledgers.
- Inter: body text, labels, buttons, tables, forms.
- Geist Mono: wallet addresses, hashes, ids.
- Small-caps navy labels (`SectionLabel`) use Inter, 600, wide tracking.

### Shared building blocks

New components in `src/components/andamio/`, exported from its index:

| Component | Does | Used by |
|---|---|---|
| `RecordHeader` | Overline label, serif title, meta line, optional actions | Every page heading |
| `SectionLabel` | Small-caps navy section label | Section titles in both columns |
| `LedgerTable` | Ruled rows, no box; columns collapse to stacked lines under 640px | Lists of courses, duties, projects |
| `NextStep` | Navy banner with a label, one sentence, and one action or a status | Dashboard |
| `PathTimeline` | Vertical line of milestones, filled when done, hollow when to come | Dashboard margin |
| `RecordLayout` | Main column and margin column; margin moves below the main column on phones | Dashboard, later the course page |

Each takes plain props, has no data fetching, and is usable in later stages.

### Shell

- **Sidebar (navy spine):** serif "Tracom" wordmark with a small "Credentials" line; index groups in small caps (Record: Dashboard, Credentials; Catalogue: Courses, Projects; Studio: Course Studio, Project Studio); the active item is marked by a rule and bold text, not a filled pill.
- **Status bar removed** (`auth-status-bar.tsx`). Its contents move:
  - session expiry and wallet address go to "Record details" on the dashboard;
  - the theme toggle and sign-out go to the spine footer;
  - the pending-transaction indicator stays in the spine (it already lives in the user section).
- **Mobile:** a slim paper top bar with the wordmark and a menu button opens the spine as a drawer (`mobile-nav.tsx`).
- The Studio layout (`studio-layout.tsx`, `studio-header.tsx`) gets the same spine and tokens; its inner pages are redesigned in stage 5.

## Stage 2: Dashboard

### Before the access token exists

- `AccessTokenConfirmationAlert` stays at the top, unchanged.
- `RecordHeader`: label "Admission", title "Welcome to Tracom", meta line with the short wallet address.
- `NextStep`: "Choose your alias", containing the existing `MintAccessToken` form unchanged (alias check, availability, errors including collateral).
- Margin: `PathTimeline` with the three getting-started steps (Connect wallet, Choose your alias, Explore courses). This replaces `GettingStarted` and shows the same state.

### After the access token exists

Main column:

1. `RecordHeader`: label "Academic record", title = the access token alias (serif), meta line with the short wallet address.
2. `NextStep`: one action from `getNextStep()` (below).
3. **Courses** (`LedgerTable`): course name, status in words (from the same commitment statuses as the path), link to the course. No module progress count: the dashboard data doesn't include each course's module total. Replaces `MyLearning` and `OnChainStatus`, which listed overlapping courses; every link they had is kept.
4. **Projects unlocking**: prerequisites met or not per project, link to the project. Replaces `ProjectUnlockProgress`.
5. **Duties** (only when the user teaches or manages): pending reviews, pending assessments, owned courses, managed projects, as ledger rows with counts and links. Replaces the four summary cards. Each keeps its empty state (for example the create-course action).
6. **Contributing** (only when the user contributes): projects as ledger rows. Replaces `ContributingProjectsSummary`.

Margin column:

1. **Path**: per enrolled course, milestones Enrolled → Submitted → Accepted → Credential claimed, from the commitment statuses. These are states, not dates; the dashboard data carries no dates.
2. **Accomplishments**: enrolled, completed and credential counts as ruled lines, not stat cards. Replaces `StudentAccomplishments`.
3. **Record details**: wallet address (click to copy), access token alias, session expiry. Replaces `AccountDetailsCard` and the removed status bar.

On phones the margin follows the main column in the order above.

### Next step rule

`getNextStep(dashboard, user)` in `src/lib/next-step.ts`, a pure function. The first rule that matches wins:

1. An assignment was refused → "Revise your assignment for {course}", action to the assignment.
2. An assignment was accepted and the credential not claimed → "Claim your credential for {course}", action to the course.
3. The user has reviews waiting → "Review {n} submissions in {course}", action to the teacher view.
4. The user is enrolled with nothing submitted → "Continue {course}", action to the course.
5. An assignment is waiting for review → "Your assignment for {course} is with the assessor", no action.
6. Otherwise → "Browse courses", action to `/course`.

Statuses come through `normalizeAssignmentStatus` in `src/lib/assignment-status.ts`.

### States

Every section keeps a loading state (ledger-shaped skeleton), an empty state (a sentence in the ledger's place, plus the existing action where there was one), and an error state (the existing behaviour, restyled). Copy follows PRODUCT.md: sentence case, no exclamation marks.

## Rules for every page (stages 3 to 5)

- Start with `RecordHeader`.
- Lists are `LedgerTable`s, not card grids. Cards stay only for things that really are objects, such as a credential.
- Secondary information (details, metadata, related links) goes in the margin column when the page is wide enough.
- Status is written in words; colour only supports it.
- Names of people, courses and credentials use the serif; nothing else does.
- No new hardcoded colours: semantic tokens only (AGENTS.md).

## Testing

- Unit tests (`node:test`, as in the repo) for `getNextStep` (each rule and the order between them) and for the path milestones.
- `npm run typecheck`, lint and `npm run test:unit` pass on every commit.
- Visual check at 375px and desktop width, light and dark, for the before-token and after-token dashboard.
- AA contrast for every new colour pair.
- After deploy: sign in with the Google test wallet (before-token state) and with `EverydayLewis` (after-token state).

## Rollout

- Stage 1 ships as its own commit: the whole app takes the paper, navy and serif look at once.
- Stage 2 ships after it.
- After stage 1, check the editor, dialogs and transaction modals, which are most affected by the token change.
- Update DESIGN.md with the new palette, type and rules in the same change as stage 1.

## Out of scope

- New features or data. The dashboard uses only data it already fetches.
- Redesigning the public landing, About and verification pages. They use the same global tokens, so stage 1 changes their colours too; they are checked after stage 1 for contrast and anything that looks broken, not redesigned.
