/**
 * Transaction recovery context — typed entity identifiers used by the indexer
 * fallback path when polling terminates on a 404 budget.
 *
 * The context is carried from the submit call site through
 * `useTransaction.execute()` → `txWatcherStore.register()` → optional
 * `PendingTxRegistration` persistence → recovery loop → indexer lookup.
 *
 * Three kinds are supported. `project_contributor` and `course_assignment`
 * resolve via gateway commitment endpoints in `runIndexerFallback`.
 * `course_credential_claim` resolves via the on-chain credential token; the
 * dispatcher returns `unresolved` for it today (no fallback resolver), so
 * the polling layer's synthetic terminal handles the timeout case. Other TX
 * types pass `undefined` and fall through to the synthetic terminal.
 *
 * @see src/lib/tx-indexer-fallback.ts - Consumer of this context
 * @see src/lib/assignment-tx-filter.ts - R5 precision filter (consumes course_credential_claim)
 * @see docs/plans/2026-04-14-001-fix-tx-register-404-polling-loop-plan.md
 * @see docs/plans/2026-05-07-003-feat-course-credential-claim-recovery-kind-plan.md
 */

export type TxRecoveryContext =
  | {
      kind: "project_contributor";
      projectId: string;
      taskHash: string;
    }
  | {
      kind: "course_assignment";
      courseId: string;
      moduleCode: string;
      sltHash: string;
    }
  | {
      kind: "course_credential_claim";
      courseId: string;
      alias: string;
    };
