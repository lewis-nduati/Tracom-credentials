---
name: transactions
description: How Cardano transactions work in this template — the state machine, APIs, and hooks you'll reuse for every TX you build.
---

# Transactions

Build, submit, and track Cardano transactions in your app. This skill explains the state machine the template uses for every transaction, and points you at the hooks and config files you'll edit when adding your own TX types.

**Reference**: [docs.andamio.io](https://docs.andamio.io) | **Default gateway**: `https://preprod.api.andamio.io`

## The State Machine

```
BUILD → SIGN → SUBMIT → REGISTER → WATCH
  │       │       │         │         │
  │       │       │         │         └─ SSE stream or poll until "updated"
  │       │       │         └─ POST /api/v2/tx/register
  │       │       └─ wallet.submitTx(signed) → txHash
  │       └─ wallet.signTx(cbor, true)
  └─ POST to /api/v2/tx/* → unsigned CBOR
```

| State | Terminal? | What it means |
|-------|-----------|---------------|
| `pending` | No | TX submitted, waiting for blockchain |
| `confirmed` | **No** | On-chain, Gateway still processing |
| `updated` | **Yes** | DB updated — safe to fetch data |
| `failed` | **Yes** | TX failed after retries |
| `expired` | **Yes** | TX exceeded 2-hour TTL |

## Try It: Explore TX Code in This Repo

### 1. Read the hooks

```bash
# The main TX execution hook
cat src/hooks/tx/use-transaction.ts

# Real-time SSE tracking (preferred)
cat src/hooks/tx/use-tx-stream.ts

# Polling fallback
cat src/hooks/tx/use-tx-watcher.ts
```

### 2. See TX types and endpoints

```bash
# All TX types (access_token_mint, course_create, etc.)
cat src/config/transaction-ui.ts

# Zod schemas for validation
cat src/config/transaction-schemas.ts
```

### 3. Find existing TX implementations

Search for components that use transactions:

```bash
# Find usages of the TX hook
grep -r "useTransaction" src/

# Find TX stream usage
grep -r "useTxStream" src/
```

## Using the Hooks

### useTxStream (Preferred)

Real-time updates via Server-Sent Events:

```typescript
import { useTxStream } from "~/hooks/tx/use-tx-stream";

const { status, isSuccess, isFailed } = useTxStream(txHash);

// isSuccess = true when state === "updated" (DB is ready)
```

### useTxWatcher (Fallback)

Polling every 15 seconds:

```typescript
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";

const { status, isSuccess } = useTxWatcher(txHash, {
  onComplete: (status) => {
    if (status.state === "updated") {
      toast.success("Transaction complete!");
      void refetchData(); // Now safe to fetch
    }
  },
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/{hash}` | GET | Poll TX status |
| `/api/v2/tx/stream/{hash}` | GET (SSE) | Real-time state updates |
| `/api/v2/tx/pending` | GET | User's pending TXs |

## TX Types

The full union lives in `src/config/transaction-ui.ts` as `TransactionType`. Names follow `NAMESPACE_ROLE_ACTION`:

| Namespace | Role | Examples |
|-----------|------|----------|
| `GLOBAL_*` | — | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT`, `GLOBAL_USER_ACCESS_TOKEN_CLAIM` |
| `INSTANCE_*` | — | `INSTANCE_COURSE_CREATE`, `INSTANCE_PROJECT_CREATE` |
| `COURSE_*` | OWNER / TEACHER / STUDENT | `COURSE_TEACHER_ASSIGNMENTS_ASSESS`, `COURSE_STUDENT_CREDENTIAL_CLAIM` |
| `PROJECT_*` | OWNER / MANAGER / CONTRIBUTOR / USER | `PROJECT_CONTRIBUTOR_TASK_COMMIT`, `PROJECT_MANAGER_TASKS_ASSESS`, `PROJECT_USER_TREASURY_ADD_FUNDS` |

For the canonical list, open `src/config/transaction-ui.ts` and read the `TransactionType` union — it's the source of truth.

## Adding Your Own TX Type

To add a new transaction (e.g., `MY_APP_ACTION`):

1. **Type union**: add the new TX type to the `TransactionType` union in `src/config/transaction-ui.ts` and to `TRANSACTION_UI` (UI metadata) and `TRANSACTION_ENDPOINTS` (backend route).
2. **Backend**: expose a build endpoint at the URL you registered, returning unsigned CBOR. The template uses `/api/v2/tx/*` against the Andamio gateway — point at your own backend if you've forked.
3. **Schema**: add a Zod schema in `src/config/transaction-schemas.ts` for the request/response payload.
4. **Trigger**: call `useTransaction()` from a component, passing your new `TransactionType` and payload.
5. **Track**: wrap the result with `useTxStream()` so the UI waits for `"updated"` before refetching data.

The state machine, retry logic, and SSE plumbing are all reusable — you only write the type-specific schema and the build endpoint on the backend.

## Related Skills

- `/task-lifecycle` — see the state machine in action across a 4-step contributor flow

## Key Files

| File | Purpose |
|------|---------|
| `~/hooks/tx/use-tx-stream.ts` | SSE-based TX tracking |
| `~/hooks/tx/use-tx-watcher.ts` | Polling-based TX tracking |
| `~/hooks/tx/use-transaction.ts` | TX execution hook |
| `~/config/transaction-schemas.ts` | Zod validation |
| `~/config/transaction-ui.ts` | TX types and endpoints |

---

## Key Insights

### "confirmed" is NOT terminal

The Gateway updates the database ~30 seconds after on-chain confirmation. If you fetch data at "confirmed", you'll get stale results.

```typescript
// WRONG - data will be stale
if (status.state === "confirmed") { refetchData(); }

// CORRECT - wait for DB update
if (status.state === "updated") { refetchData(); }
```

### Don't call confirm-tx endpoints directly

The Gateway handles DB updates automatically. Just wait for `"updated"` status.

### SSE connections can drop

The `useTxStream` hook handles reconnection, but if you're building custom TX tracking, implement fallback to polling via `useTxWatcher`.
