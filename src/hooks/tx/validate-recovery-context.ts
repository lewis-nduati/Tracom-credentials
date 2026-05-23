// Test-seam extraction of validateRecoveryContext from use-transaction.ts (pure, no React-deps).

import type { TransactionType } from "~/config/transaction-ui";
import type { TxRecoveryContext } from "~/types/tx-recovery";

// Authoritative kind → allowed txTypes mapping. The `satisfies Record<...>`
// guarantees every member of `TxRecoveryContext["kind"]` has a paired list of
// `TransactionType`s — adding a kind to the union without extending this table
// is a compile error, matching the dispatcher's `_exhaustive: never` ratchet
// in tx-indexer-fallback.ts.
//
// A kind may be paired with multiple txTypes when the same recovery context
// shape is produced by multiple TX flows. Example: the `course_assignment`
// recovery context (courseId, moduleCode, sltHash) is produced by both the
// initial COMMIT tx and the post-denial UPDATE tx — both resolve via the same
// `recoverCourseAssignment` indexer-fallback path keyed on the same identifiers.
const KIND_TO_TX_TYPES = {
  project_contributor: ["PROJECT_CONTRIBUTOR_TASK_COMMIT"],
  course_assignment: [
    "COURSE_STUDENT_ASSIGNMENT_COMMIT",
    "COURSE_STUDENT_ASSIGNMENT_UPDATE",
  ],
  course_credential_claim: ["COURSE_STUDENT_CREDENTIAL_CLAIM"],
} as const satisfies Record<TxRecoveryContext["kind"], readonly TransactionType[]>;

// Drops a recoveryContext whose `kind` does not allow the TX type — mismatches indicate a caller bug.
export function validateRecoveryContext(
  txType: TransactionType,
  context: TxRecoveryContext | undefined,
): TxRecoveryContext | undefined {
  if (!context) return undefined;
  const allowedTxTypes = KIND_TO_TX_TYPES[context.kind];
  // Use a generic includes() check; readonly tuple types narrow includes()
  // to their literal members, so we widen via a runtime cast.
  if (!(allowedTxTypes as readonly TransactionType[]).includes(txType)) {
    console.warn(
      `[useTransaction] recoveryContext.kind "${context.kind}" does not match txType "${txType}" — dropping`,
    );
    return undefined;
  }
  return context;
}
