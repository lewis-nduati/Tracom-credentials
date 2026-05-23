# Design Philosophy

The foundational principles that guide every design decision in the Andamio app. Read this first — all other design-system docs build on these ideas.

---

## Design Vision

Andamio is a Programmable Economy of Competence. Courses verify skills. Verified skills unlock paid work. Smart contracts manage the money. Our job is to make this complex orchestration feel like a fluid, Apple-caliber Pro app.

**The bar:** A project manager creating tasks, a learner completing assessments, and a contributor claiming escrowed rewards should all feel like they're using a premium productivity tool — not a blockchain application. Think Linear meets Notion, where the wallet only appears at moments of genuine commitment.

**The invisible line:** Users interact with projects, courses, credentials, tasks, and treasuries. They never interact with policy IDs, transaction hashes, UTXOs, or contract addresses — unless they explicitly choose to look under the hood.

**Three user archetypes, one coherent experience:**
- **Project Manager** — creates projects, defines tasks with rewards, sets credential prerequisites, manages treasury, reviews submitted work
- **Learner** — completes backward-design courses (learning targets → assessments → credentials), building toward eligibility for real work
- **Contributor** — applies competence credentials to unlock tasks, submits work, receives payment through escrow

The design system exists to make all three flows feel like one seamless product where blockchain is the engine, not the dashboard.

---

## The Six Principles

### 1. Invisible Infrastructure

**The blockchain is the engine, never the dashboard.**

Users interact with *projects*, *credentials*, *tasks*, and *treasuries*. They never interact with policy IDs, UTXOs, transaction hashes, or contract mechanics. When the infrastructure must surface (wallet signing), it arrives as a moment of clarity, not a moment of confusion.

**In practice:**
- A credential displays "Advanced Smart Contract Development — Earned Feb 2026," not `asset1qz8...policy_id`
- Treasury shows "12,500 ADA available · 3,200 ADA in active escrows," not a list of UTXOs
- "Task funded" is the success state, not "Transaction confirmed in block 9,241,087"

**Forbids:**
- Exposing raw hashes, addresses, or chain data in primary UI (move to "Advanced" or expandable details)
- Using blockchain jargon in labels, buttons, or status text ("mint," "burn," "submit tx")
- Showing transaction confirmations as the *primary* feedback — show the *outcome* ("Credential earned," "Funds released")

---

### 2. Clarity Over Cleverness

**Every element answers "what is this?" and "what do I do next?" instantly.**

No ambiguous icons. No clever labels that require domain knowledge. No layouts where the user's eye wanders without finding a focal point. If someone needs to read documentation to use a screen, the screen failed.

**In practice:**
- Buttons say exactly what they do: "Submit Assessment," "Fund Task," "Release Payment" — not "Submit," "Confirm," "Process"
- Status indicators use both color *and* text: a green badge says "On-Chain," not just a green dot
- Empty states explain why they're empty and what to do: "No contributors yet — share your project link or set credential prerequisites to attract qualified contributors"

**Forbids:**
- Icon-only actions without labels or tooltips
- Generic button text ("Submit," "OK," "Continue") where specific text is possible
- Status communicated through color alone

---

### 3. Earned Progression

**The UI reflects demonstrated competence, not navigation skill.**

Andamio's core mechanic is that credentials unlock capabilities. The interface should mirror this: new actions, sections, and opportunities appear *because the user earned them*, not because they found a menu item. The UI is a living reflection of what you can do.

**In practice:**
- A task shows "Requires: Advanced Solidity Module" with the learner's completion status — either a path to unlock or a clear "Apply" button
- The contributor dashboard grows as credentials accumulate — new project categories appear when prerequisites are met
- Course progress is visible, cumulative, and tied to *what it unlocks*, not just a percentage bar

**Forbids:**
- Showing actions the user can't take without explaining why and how to get there
- Dead-end permission walls ("Access Denied") without a path forward
- Hiding the relationship between learning and work — the connection should always be visible

---

### 4. Moments of Commitment

**The wallet appears only at genuine decision points, and every signing is preceded by understanding.**

Wallet interactions are the *most important* design moments in the app. They're where trust is built or broken. Each one follows the same rhythm: **context → preview → sign → celebrate**.

**In practice:**
- Before funding a task: a clear breakdown — "You are locking 500 ADA from Project Treasury into escrow for 'Physics Engine Task.' This amount will be released to the contributor upon your approval."
- Before minting a credential: "You are certifying that [learner] has completed Module 3: Advanced Protocols. This credential is permanent and on-chain."
- After every successful transaction: a moment of celebration and a clear next step — never just "Transaction successful"

**Forbids:**
- Wallet popups without a preceding human-readable summary
- Raw transaction data shown to the user as the primary information
- Silent transaction completion — every on-chain action gets acknowledgment
- Stacking multiple signing requests without clear separation

---

### 5. Breathing Room

**Space is not empty — it creates hierarchy, separates ideas, and signals confidence.**

Dense UI communicates anxiety. Generous whitespace communicates that the product is in control and the user can think clearly. Every pixel of space is intentional: it groups related elements, separates distinct ideas, and gives the eye a place to rest.

**In practice:**
- Cards have consistent internal padding. Content areas have generous margins. Lists have vertical rhythm between items.
- A dashboard with 4 stats and room to breathe is better than 8 stats crammed together
- Form sections are separated by visible space, not just borders — the grouping should be obvious even without lines

**Forbids:**
- Filling available space because it's available
- Reducing padding or margins to "fit more in"
- Information-dense tables without clear header separation and row spacing
- Layouts where removing one element would make the page *better*

---

### 6. Accessibility is Not Optional

**Every feature ships accessible. No exceptions, no "we'll add it later."**

WCAG 2.1 AA is the minimum. Keyboard navigation works everywhere. Screen readers can traverse every flow. Color is never the only signal. Touch targets meet minimum sizes. This is not an enhancement — it's a structural requirement, the same as type safety or test coverage.

**In practice:**
- Every interactive element is keyboard-reachable and has a visible focus indicator
- Status uses color *plus* icon *plus* text (the three-channel rule)
- Contrast ratios meet 4.5:1 for text, 3:1 for large text and UI components
- All images and icons have meaningful alt text or are marked decorative
- Motion respects `prefers-reduced-motion`

**Forbids:**
- Shipping a feature that can't be operated by keyboard alone
- Color as the sole differentiator between states (red/green without icons or labels)
- Focus traps without escape
- Timing-dependent interactions without alternatives

---

## Accessibility Standards

Principle 6 states the philosophy. This section makes it measurable.

### Compliance Target

**WCAG 2.1 Level AA** — every feature, every release. No backlog items for "accessibility cleanup later."

### Color & Contrast

| Element | Minimum Ratio | How to Check |
|---------|--------------|--------------|
| Body text | 4.5:1 against background | Semantic colors handle this — don't override with custom colors |
| Large text (18px+ bold, 24px+ regular) | 3:1 | Heading defaults meet this |
| UI components (borders, icons, focus rings) | 3:1 | Semantic `muted-foreground` meets this against `background` |
| Decorative elements | No requirement | Gradients, shadows, dividers |

### The Three-Channel Rule

Every status communicates through *color + icon + text*. A user who can't see color, can't see icons, or can't read small text should still understand the state.

```tsx
// ✅ Three channels: color (success), icon (CheckCircle), text ("On-Chain")
<AndamioStatusIcon status="on-chain" />
<span>On-Chain</span>

// ❌ Color only
<div className="bg-success h-2 w-2 rounded-full" />
```

### Keyboard

- Every interactive element reachable via Tab
- Logical tab order (visual order matches DOM order)
- Escape closes modals, drawers, and dropdowns
- Enter/Space activates buttons and links
- Arrow keys navigate within composite widgets (tabs, menus, lists)
- Visible focus indicator on every focusable element (use `.focus-ring` utility)

### Screen Readers

- Semantic HTML: `<button>` not `<div onClick>`, `<nav>` not `<div className="nav">`
- ARIA labels on icon-only buttons: `aria-label="Close dialog"`
- Live regions for dynamic content: toast notifications, loading states, status changes
- Heading hierarchy reflects page structure (h1 → h2 → h3, no skipping)

### Motion

- All animations respect `prefers-reduced-motion: reduce`
- No animations that are essential to understanding (animation enhances, never carries meaning)
- Loading spinners are the one exception — they can animate, but must also have `aria-label="Loading"`

### Touch

- Minimum touch target: 44×44px (the `.touch-target` utility provides this on mobile)
- Adequate spacing between tap targets — no adjacent buttons without at least 8px gap

---

## Quick Reference Card

When making any design decision, run through this.

### Before Building Any Screen

1. **Who is the user?** PM, Learner, or Contributor? What's their context right now?
2. **What's the one thing?** What's the single most important action or information on this screen?
3. **What's invisible?** What blockchain/protocol complexity is being hidden? Where does it go if the user wants it?

### The Checklist

| Principle | Quick Test |
|-----------|-----------|
| Invisible Infrastructure | Can a non-crypto user complete this flow without confusion? |
| Clarity Over Cleverness | Can someone explain what this screen does in one sentence? |
| Earned Progression | Does the UI show *why* something is available or unavailable? |
| Moments of Commitment | Does every wallet interaction have context → preview → sign → celebrate? |
| Breathing Room | Would removing one element improve this screen? If yes, remove it. |
| Accessibility | Can this be operated by keyboard alone? Is color never the only signal? |

### When Stuck

- **"Should I show this data?"** — Only if it helps the user take action or understand state. If it's informational only, consider hiding it behind a detail expansion.
- **"How much should I explain?"** — Enough that the user never wonders "what happens when I click this?" but not so much that they feel talked down to.
- **"Should this be a new page or inline?"** — If it introduces a new *context* (different entity, different task), new page. If it's detail about the *current* context, inline.
