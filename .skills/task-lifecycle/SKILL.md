---
name: task-lifecycle
description: How the contributor task flow works in this template — commit, submit, review, assess — and where to extend it for your own app.
---

# Task Lifecycle

The template ships a 4-step contributor flow built on Cardano transactions. This skill explains the state machine, points at the hooks and routes that implement it, and shows how to adapt the pattern for your own task flows.

## The Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TASK LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │  COMMIT  │───▶│  SUBMIT  │───▶│  REVIEW  │───▶│  ASSESS  │       │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│       │               │               │               │              │
│       ▼               ▼               ▼               ▼              │
│   Contributor     Contributor      Manager        Manager            │
│   locks stake     submits work     reviews        approves/rejects   │
│   to task         (hash on-chain)  (off-chain)    (triggers payout)  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Instructions

### 1. Understand the State Machine

Each transaction moves the task through states:

| Transaction | tx_type | From State | To State | Who |
|-------------|---------|------------|----------|-----|
| Commit | `project_join` | open | committed | Contributor |
| Submit | `task_submit` | committed | submitted | Contributor |
| Assess (approve) | `task_assess` | submitted | approved | Manager |
| Assess (reject) | `task_assess` | submitted | rejected | Manager |

### 2. Walk Through the Code

The implementation lives in three layers:

**Transaction hooks** (`src/hooks/api/project/`):
- `use-project-contributor.ts` — commit and submit transactions
- `use-project-manager.ts` — assess transactions

**State tracking** (`src/stores/tx-watcher-store.ts`) — global watcher that tracks every in-flight TX through `pending → confirmed → updated`.

**Types** (`src/types/transaction.ts`) — state machine type definitions.

### 3. What Happens on Commit

Step-by-step, when a contributor clicks "Commit to Task":

```
1. Frontend calls POST /api/v2/tx/project/commit
2. Gateway builds unsigned CBOR with contributor's stake locked
3. Wallet signs the transaction
4. Wallet submits to blockchain
5. Frontend registers TX with POST /api/v2/tx/register
6. SSE stream or polling watches for confirmation
7. Gateway updates database ~30s after on-chain confirmation
8. UI receives "updated" state and refreshes
```

**Key insight**: `confirmed` means on-chain, but `updated` means the DB synced. Always wait for `updated` before refetching data.

### 4. Where the Routes Live

| Step | Route | Who |
|------|-------|-----|
| Commit / Submit | `/project/{projectId}/{taskHash}` | Contributor |
| Review / Assess | `/studio/project/{projectId}/commitments` | Manager |

### 5. Adapting This for Your App

If your app has its own task or contribution flow:

- Reuse the state machine and watcher store as-is — they're not specific to Andamio's task model.
- Replace the `tx_type` values (`project_join`, `task_submit`, `task_assess`) with your own in `src/config/transaction-ui.ts` and `transaction-schemas.ts`.
- Swap the `/api/v2/tx/project/*` endpoints for whatever your backend exposes.
- See `/transactions` for the underlying TX hook patterns you'll reuse for every TX you add.

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/api/project/use-project-contributor.ts` | Contributor transactions |
| `src/hooks/api/project/use-project-manager.ts` | Manager transactions |
| `src/hooks/tx/use-tx-stream.ts` | SSE-based TX tracking |
| `src/stores/tx-watcher-store.ts` | Global TX state management |
| `src/types/transaction.ts` | Transaction state types |

## Common Issues

### "Confirmed but data is stale"

You're checking for `confirmed` instead of `updated`. The database syncs ~30s after on-chain confirmation.

```typescript
// Wrong
if (status.state === "confirmed") { refetchData(); }

// Right
if (status.state === "updated") { refetchData(); }
```

### "Transaction expired"

Cardano transactions have a 2-hour TTL. If the user waits too long to sign, rebuild the transaction.

### "Not eligible for task"

The contributor is missing required SLTs. Check the task's `requiredCredentials` against the user's credentials.

## Related Skills

- `/transactions` — deeper dive into the TX state machine, hooks, and how to add your own TX types
- `/design-system` — UI patterns used on task and project pages
