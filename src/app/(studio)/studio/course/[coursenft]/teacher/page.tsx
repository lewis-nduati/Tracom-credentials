"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioPageLoading,
  AndamioErrorAlert,
  AndamioSearchInput,
  AndamioScrollArea,
} from "~/components/andamio";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import {
  TeacherIcon,
  SuccessIcon,
  CloseIcon,
  LoadingIcon,
  AlertIcon,
  ExpandIcon,
  CollapseIcon,
  NextIcon,
} from "~/components/icons";
import { ContentDisplay } from "~/components/content-display";
import type { JSONContent } from "@tiptap/core";
import {
  useCourse,
  useTeacherAssignmentCommitments,
  useInvalidateTeacherCourses,
  type TeacherAssignmentCommitment,
} from "~/hooks/api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { toast } from "sonner";

/** Maximum number of assessments allowed in a single batch transaction */
const BATCH_LIMIT = 5;

// =============================================================================
// Batch TX Types
// =============================================================================

/** Display-only grouping for the decision summary UI */
interface ModuleGroup {
  sltHash: string;
  moduleCode: string | undefined;
  decisions: Array<{ alias: string; outcome: "accept" | "refuse" }>;
}

interface BatchTxResult {
  status: "pending" | "submitting" | "success" | "error";
  txHash?: string;
  error?: string;
  confirmationState?: "pending" | "confirming" | "confirmed" | "failed";
}

type BatchState = "idle" | "submitting" | "done";

// =============================================================================
// Batch TX Stream Watcher
// =============================================================================

/**
 * Watches a single txHash via SSE stream and reports terminal state.
 * Renders nothing visible — purely a side-effect component.
 */
function BatchTxStreamWatcher({
  txHash,
  onConfirmed,
  onFailed,
}: {
  txHash: string;
  onConfirmed: () => void;
  onFailed: () => void;
}) {
  const { isSuccess, isFailed, isStalled } = useTxStream(txHash);

  useEffect(() => {
    if (isSuccess) {
      onConfirmed();
    } else if (isFailed || isStalled) {
      onFailed();
    }
  }, [isSuccess, isFailed, isStalled, onConfirmed, onFailed]);

  return null;
}

// Network status color mapping based on workflow stages
const getStatusVariant = (
  status: string | undefined | null
): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  if (status.includes("PENDING")) return "secondary";
  if (status.includes("ACCEPTED") || status.includes("CLAIMED") || status === "ON_CHAIN") return "default";
  if (status.includes("REFUSED")) return "destructive";
  if (status === "AWAITING_EVIDENCE" || status === "DRAFT") return "outline";
  return "default";
};

const formatNetworkStatus = (status: string | undefined | null): string => {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export default function TeacherDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.coursenft as string;
  const { user } = useAndamioAuth();

  // Data hooks
  const { data: courseData, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: rawCommitments, isLoading: commitmentsLoading, error: commitmentsError, refetch: refetchCommitments } = useTeacherAssignmentCommitments(courseId);
  const commitments = useMemo(() => (Array.isArray(rawCommitments) ? rawCommitments : []), [rawCommitments]);
  const invalidateTeacher = useInvalidateTeacherCourses();

  // V2 Transaction hook
  const assessTx = useTransaction();

  // Batch assessment state
  const [batchState, setBatchState] = useState<BatchState>("idle");
  const [batchTxResult, setBatchTxResult] = useState<BatchTxResult | null>(null);
  const batchAbortedRef = useRef(false);

  // Batch assessment decisions - keyed by "studentAlias-sltHash"
  const [pendingDecisions, setPendingDecisions] = useState<
    Map<string, { commitment: TeacherAssignmentCommitment; decision: "accept" | "refuse" }>
  >(new Map());

  // Selected commitment for viewing evidence detail
  const [selectedCommitment, setSelectedCommitment] = useState<TeacherAssignmentCommitment | null>(null);

  // New state: tab filter and decision summary expansion
  const [currentTab, setCurrentTab] = useState<"pending" | "all">("pending");
  const [decisionSummaryExpanded, setDecisionSummaryExpanded] = useState(false);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Helper to create unique key for a commitment
  const getCommitmentKey = (commitment: TeacherAssignmentCommitment) =>
    `${commitment.studentAlias}-${commitment.sltHash}`;

  // Helper to set/update a decision (capped at BATCH_LIMIT)
  const setDecision = useCallback((commitment: TeacherAssignmentCommitment, decision: "accept" | "refuse") => {
    const key = getCommitmentKey(commitment);
    setPendingDecisions((prev) => {
      // Allow updating an existing decision, but block new additions at capacity
      if (!prev.has(key) && prev.size >= BATCH_LIMIT) {
        toast.error("Batch limit reached", {
          description: `Maximum ${BATCH_LIMIT} assessments per batch. Submit current batch first.`,
        });
        return prev;
      }
      const next = new Map(prev);
      next.set(key, { commitment, decision });
      return next;
    });
  }, []);

  // Helper to remove a decision
  const removeDecision = (commitment: TeacherAssignmentCommitment) => {
    const key = getCommitmentKey(commitment);
    setPendingDecisions((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  // Helper to clear all decisions
  const clearAllDecisions = () => {
    setPendingDecisions(new Map());
  };

  // Get decision for a commitment (if any)
  const getDecision = (commitment: TeacherAssignmentCommitment) => {
    const key = getCommitmentKey(commitment);
    return pendingDecisions.get(key)?.decision ?? null;
  };

  // Group pending decisions by slt_hash for batch submission
  const moduleGroups = useMemo((): ModuleGroup[] => {
    const groupMap = new Map<string, ModuleGroup>();

    for (const [, { commitment, decision }] of pendingDecisions) {
      const sltHash = commitment.sltHash ?? "unknown";
      let group = groupMap.get(sltHash);
      if (!group) {
        group = {
          sltHash,
          moduleCode: commitment.moduleCode,
          decisions: [],
        };
        groupMap.set(sltHash, group);
      }
      group.decisions.push({
        alias: commitment.studentAlias,
        outcome: decision,
      });
    }

    return Array.from(groupMap.values());
  }, [pendingDecisions]);

  // Flat decisions list for single-TX submission
  const allDecisions = useMemo(
    () =>
      Array.from(pendingDecisions.values()).map(({ commitment, decision }) => ({
        alias: commitment.studentAlias,
        outcome: decision,
      })),
    [pendingDecisions]
  );

  // Batch submit: single TX for all decisions.
  const handleBatchSubmit = useCallback(async () => {
    const alias = user?.accessTokenAlias;
    if (!alias || allDecisions.length === 0) return;

    batchAbortedRef.current = false;
    setBatchState("submitting");
    setBatchTxResult({ status: "submitting" });

    assessTx.reset();

    await new Promise<void>((resolve) => {
      void assessTx.execute({
        txType: "COURSE_TEACHER_ASSIGNMENTS_ASSESS",
        params: {
          alias: alias,
          course_id: courseId,
          assignment_decisions: allDecisions,
        },
        onSuccess: (txResult) => {
          setBatchTxResult({
            status: "success",
            txHash: txResult.txHash,
            confirmationState: "confirming",
          });
          setBatchState("done");
          // Clear all pending decisions on success
          setPendingDecisions(new Map());
          resolve();
        },
        onError: (err) => {
          setBatchTxResult({
            status: "error",
            error: err.message,
          });
          setBatchState("done");
          resolve();
        },
      });
    });
  }, [user?.accessTokenAlias, allDecisions, courseId, assessTx]);

  // Reset batch state
  const resetBatch = useCallback(() => {
    setBatchState("idle");
    setBatchTxResult(null);
    assessTx.reset();
  }, [assessTx]);

  // Stream watcher callbacks: update confirmation state
  const handleTxConfirmed = useCallback(() => {
    setBatchTxResult((prev) =>
      prev ? { ...prev, confirmationState: "confirmed" } : prev
    );
  }, []);

  const handleTxFailed = useCallback(() => {
    setBatchTxResult((prev) =>
      prev ? { ...prev, confirmationState: "failed" } : prev
    );
  }, []);

  // Track whether the single TX has been confirmed
  const isConfirming =
    batchState === "done" &&
    batchTxResult?.status === "success" &&
    batchTxResult.confirmationState === "confirming";
  const allConfirmed =
    batchState === "done" &&
    batchTxResult?.status === "success" &&
    batchTxResult.confirmationState === "confirmed";

  const hasInvalidatedRef = useRef(false);

  useEffect(() => {
    if (allConfirmed && !hasInvalidatedRef.current) {
      hasInvalidatedRef.current = true;
      void invalidateTeacher();
      void refetchCommitments();
    }
    // Reset the ref when batch goes back to idle
    if (batchState === "idle") {
      hasInvalidatedRef.current = false;
    }
  }, [allConfirmed, batchState, invalidateTeacher, refetchCommitments]);

  // Sync selectedCommitment with refreshed data so the right panel reflects updated status
  useEffect(() => {
    if (!selectedCommitment) return;
    const fresh = commitments.find(
      (c) =>
        c.studentAlias === selectedCommitment.studentAlias &&
        c.sltHash === selectedCommitment.sltHash
    );
    if (fresh && fresh.commitmentStatus !== selectedCommitment.commitmentStatus) {
      setSelectedCommitment(fresh);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitments]);

  // Auto-select commitment from URL query params (deep-link from commitments tab)
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (hasAutoSelectedRef.current || commitments.length === 0) return;
    const studentParam = searchParams.get("student");
    const sltHashParam = searchParams.get("sltHash");
    if (!studentParam) return;
    const match = commitments.find(
      (c) => c.studentAlias === studentParam && (!sltHashParam || c.sltHash === sltHashParam)
    );
    if (match) {
      setSelectedCommitment(match);
      hasAutoSelectedRef.current = true;
    }
  }, [commitments, searchParams]);

  // Get unique assignments for filter (by moduleCode)
  const uniqueModuleCodes = Array.from(
    new Set(commitments.map((c) => c.moduleCode).filter((c): c is string => !!c))
  );

  // Helper to check if a commitment is assessable (has on-chain data and is not already accepted)
  const isAssessable = useCallback((c: TeacherAssignmentCommitment) => {
    if (!c.studentAlias) return false;
    if (c.commitmentStatus === "ACCEPTED") return false;
    // Pending is always assessable
    if (c.commitmentStatus === "PENDING_APPROVAL") return true;
    // REFUSED with on-chain data can be re-assessed (student resubmitted)
    if (c.commitmentStatus === "REFUSED" &&
        (c.status === "synced" || c.status === "onchain_only")) {
      return true;
    }
    return false;
  }, []);

  // Stats
  const stats = {
    total: commitments.length,
    pendingReview: commitments.filter(isAssessable).length,
  };

  // Derived filtered commitments — uses currentTab instead of statusFilter
  const filteredCommitments = useMemo(() => {
    let filtered = [...commitments];

    if (currentTab === "pending") {
      filtered = filtered.filter(isAssessable);
    }

    if (assignmentFilter !== "all") {
      filtered = filtered.filter((c) => c.moduleCode === assignmentFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.studentAlias?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [commitments, currentTab, assignmentFilter, searchQuery]);

  // Handle commitment selection
  const handleSelectCommitment = (commitment: TeacherAssignmentCommitment) => {
    setSelectedCommitment(
      selectedCommitment?.studentAlias === commitment.studentAlias &&
        selectedCommitment?.sltHash === commitment.sltHash
        ? null
        : commitment
    );
  };

  // Check if a commitment is ready for assessment (alias for isAssessable for clarity)
  const isReadyForAssessment = isAssessable;

  // Find next undecided assessable assignment for auto-advance
  const findNextPending = useCallback(
    (current: TeacherAssignmentCommitment | null) => {
      const assessableItems = commitments.filter(isAssessable);
      if (assessableItems.length === 0) return null;

      const currentKey = current ? getCommitmentKey(current) : null;

      // Find items that don't have a decision yet
      const undecided = assessableItems.filter((c) => {
        const key = getCommitmentKey(c);
        return key !== currentKey && !pendingDecisions.has(key);
      });

      return undecided[0] ?? null;
    },
    [commitments, isAssessable, pendingDecisions]
  );

  // Make a decision and auto-advance
  const handleDecisionAndAdvance = useCallback(
    (commitment: TeacherAssignmentCommitment, decision: "accept" | "refuse") => {
      setDecision(commitment, decision);
      // Brief delay then auto-advance
      setTimeout(() => {
        const next = findNextPending(commitment);
        if (next) {
          setSelectedCommitment(next);
        }
      }, 300);
    },
    [findNextPending, setDecision]
  );

  // Derived loading/error states
  const isLoading = courseLoading || commitmentsLoading;
  const fetchError = courseError?.message ?? commitmentsError?.message ?? null;

  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (fetchError || !courseData) {
    return (
      <div className="space-y-6 p-6">
        <AndamioErrorAlert error={fetchError ?? "Course not found"} />
      </div>
    );
  }

  return (
    <AndamioResizablePanelGroup direction="horizontal" className="h-full">
      {/* ================================================================= */}
      {/* LEFT PANEL — Browse & Decide                                      */}
      {/* ================================================================= */}
      <AndamioResizablePanel defaultSize={40} minSize={30} maxSize={55}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <AndamioHeading level={2} size="lg">{courseData.title}</AndamioHeading>
                <AndamioText variant="small" className="text-muted-foreground mt-0.5">
                  Teacher Dashboard
                </AndamioText>
              </div>
              {stats.pendingReview > 0 && (
                <AndamioBadge variant="secondary">
                  {stats.pendingReview} pending
                </AndamioBadge>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b px-1">
            <button
              type="button"
              onClick={() => setCurrentTab("pending")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                currentTab === "pending"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending Review ({stats.pendingReview})
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("all")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                currentTab === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Assignments ({stats.total})
            </button>
          </div>

          {/* Inline filters */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <AndamioSearchInput
              inputSize="sm"
              placeholder="Search learner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <AndamioSelect value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <AndamioSelectTrigger className="h-8 w-[140px] text-xs">
                <AndamioSelectValue placeholder="Module" />
              </AndamioSelectTrigger>
              <AndamioSelectContent>
                <AndamioSelectItem value="all">All Modules</AndamioSelectItem>
                {uniqueModuleCodes.map((moduleCode) => (
                  <AndamioSelectItem key={moduleCode} value={moduleCode}>
                    {moduleCode}
                  </AndamioSelectItem>
                ))}
              </AndamioSelectContent>
            </AndamioSelect>
          </div>

          {/* Scrollable assignment list */}
          <AndamioScrollArea className="flex-1">
            {filteredCommitments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <TeacherIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <AndamioText variant="small" className="text-muted-foreground text-center">
                  {commitments.length === 0
                    ? "No assignment commitments yet"
                    : "No commitments match your filters"}
                </AndamioText>
                {(assignmentFilter !== "all" || searchQuery) && (
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setAssignmentFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </AndamioButton>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredCommitments.map((commitment) => {
                  const decision = getDecision(commitment);
                  const canAssess = isReadyForAssessment(commitment);
                  const isSelected =
                    selectedCommitment?.studentAlias === commitment.studentAlias &&
                    selectedCommitment?.sltHash === commitment.sltHash;

                  return (
                    <div
                      key={`${commitment.moduleCode}-${commitment.studentAlias}`}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-muted border-l-2 border-l-primary"
                          : decision === "accept"
                            ? "bg-success/5 border-l-2 border-l-success/50"
                            : decision === "refuse"
                              ? "bg-destructive/5 border-l-2 border-l-destructive/50"
                              : "border-l-2 border-l-transparent hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectCommitment(commitment)}
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AndamioText className="font-mono text-xs truncate">
                            {commitment.studentAlias ?? "No access token"}
                          </AndamioText>
                          {(commitment.evidence || commitment.onChainContent) && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" title="Has evidence" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <AndamioText variant="small" className="text-muted-foreground">
                            {commitment.moduleCode ?? (commitment.sltHash ? `${commitment.sltHash.slice(0, 8)}...` : "Unknown")}
                          </AndamioText>
                          <AndamioBadge variant={getStatusVariant(commitment.commitmentStatus)} className="text-[10px] px-1.5 py-0">
                            {formatNetworkStatus(commitment.commitmentStatus)}
                          </AndamioBadge>
                        </div>
                      </div>

                      {/* Quick decision buttons */}
                      {canAssess ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(() => {
                            const atCapacity = pendingDecisions.size >= BATCH_LIMIT && !decision;
                            return (
                              <>
                                <button
                                  type="button"
                                  disabled={atCapacity}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDecision(commitment, "accept");
                                  }}
                                  className={`rounded-md p-1.5 transition-all ${
                                    atCapacity
                                      ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                      : decision === "accept"
                                        ? "bg-success text-success-foreground"
                                        : "hover:bg-success/20 text-muted-foreground hover:text-success"
                                  }`}
                                  title={atCapacity ? `Batch limit (${BATCH_LIMIT}) reached` : "Accept"}
                                >
                                  <SuccessIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={atCapacity}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDecision(commitment, "refuse");
                                  }}
                                  className={`rounded-md p-1.5 transition-all ${
                                    atCapacity
                                      ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                      : decision === "refuse"
                                        ? "bg-destructive text-destructive-foreground"
                                        : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                  }`}
                                  title={atCapacity ? `Batch limit (${BATCH_LIMIT}) reached` : "Refuse"}
                                >
                                  <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        decision && (
                          <div className="flex-shrink-0">
                            {decision === "accept" ? (
                              <SuccessIcon className="h-4 w-4 text-success" />
                            ) : (
                              <CloseIcon className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AndamioScrollArea>

          {/* Sticky bottom bar — decision cart (also visible during/after batch submission) */}
          {(pendingDecisions.size > 0 || batchState !== "idle") && (
            <div className="border-t bg-muted/30">
              {/* Collapsed summary row — hidden when batch is done and no pending decisions remain */}
              {pendingDecisions.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AndamioBadge variant={pendingDecisions.size >= BATCH_LIMIT ? "destructive" : "secondary"}>
                      {pendingDecisions.size}/{BATCH_LIMIT} ready
                    </AndamioBadge>
                    <AndamioText variant="small" className="text-muted-foreground">
                      {moduleGroups.length} module{moduleGroups.length !== 1 ? "s" : ""}
                    </AndamioText>
                  </div>
                  <div className="flex items-center gap-2">
                    <AndamioButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDecisionSummaryExpanded(!decisionSummaryExpanded)}
                    >
                      {decisionSummaryExpanded ? (
                        <CollapseIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ExpandIcon className="h-4 w-4 mr-1" />
                      )}
                      {decisionSummaryExpanded ? "Hide" : "View Summary"}
                    </AndamioButton>
                  </div>
                </div>
              )}

              {/* Expanded decision summary */}
              {decisionSummaryExpanded && (
                <div className="border-t px-4 pb-2">
                  <AndamioScrollArea className="max-h-48">
                    {moduleGroups.map((group) => (
                      <div key={group.sltHash} className="py-2 border-b last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <AndamioText className="font-medium text-xs">
                            {group.moduleCode ?? group.sltHash.slice(0, 12)}
                          </AndamioText>
                          <AndamioText variant="small" className="text-muted-foreground">
                            {group.decisions.length} decision{group.decisions.length !== 1 ? "s" : ""}
                          </AndamioText>
                        </div>
                        {group.decisions.map((d) => {
                          const entry = Array.from(pendingDecisions.values()).find(
                            (e) =>
                              e.commitment.studentAlias === d.alias &&
                              (e.commitment.sltHash ?? "unknown") === group.sltHash
                          );
                          return (
                            <div
                              key={`${group.sltHash}-${d.alias}`}
                              className="flex items-center justify-between py-0.5 pl-2"
                            >
                              <AndamioText variant="small" className="font-mono">
                                {d.alias}
                              </AndamioText>
                              <div className="flex items-center gap-1">
                                <AndamioBadge
                                  variant={d.outcome === "accept" ? "default" : "destructive"}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {d.outcome === "accept" ? "Accept" : "Refuse"}
                                </AndamioBadge>
                                {batchState === "idle" && entry && (
                                  <button
                                    type="button"
                                    onClick={() => removeDecision(entry.commitment)}
                                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    title="Remove"
                                  >
                                    <CloseIcon className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </AndamioScrollArea>

                  {/* Clear all */}
                  <div className="flex justify-end pt-1">
                    <AndamioButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearAllDecisions();
                        resetBatch();
                      }}
                      disabled={batchState === "submitting"}
                    >
                      Clear All
                    </AndamioButton>
                  </div>
                </div>
              )}

              {/* Batch progress inline */}
              {batchState === "submitting" && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <LoadingIcon className="h-4 w-4 animate-spin text-secondary" />
                    <AndamioText variant="small" className="text-muted-foreground">
                      {assessTx.state === "fetching" && "Preparing transaction..."}
                      {assessTx.state === "signing" && "Sign in wallet..."}
                      {assessTx.state === "submitting" && "Submitting transaction..."}
                      {assessTx.state === "success" && "Done"}
                    </AndamioText>
                  </div>
                </div>
              )}

              {/* Batch complete inline */}
              {batchState === "done" && (
                <div className="px-4 pb-2 space-y-2">
                  {batchTxResult?.status === "success" ? (
                    <div className="flex items-center gap-2">
                      {allConfirmed ? (
                        <>
                          <SuccessIcon className="h-4 w-4 text-success" />
                          <AndamioText variant="small" className="text-success font-medium">
                            Transaction confirmed!
                          </AndamioText>
                        </>
                      ) : batchTxResult.confirmationState === "failed" ? (
                        <>
                          <AlertIcon className="h-4 w-4 text-destructive" />
                          <AndamioText variant="small" className="text-destructive font-medium">
                            Confirmation failed
                          </AndamioText>
                        </>
                      ) : (
                        <>
                          <LoadingIcon className="h-4 w-4 animate-spin text-secondary" />
                          <AndamioText variant="small" className="font-medium">
                            Confirming transaction...
                          </AndamioText>
                        </>
                      )}
                    </div>
                  ) : batchTxResult?.status === "error" ? (
                    <div className="flex items-center gap-2">
                      <AlertIcon className="h-4 w-4 text-destructive" />
                      <AndamioText variant="small" className="text-destructive">
                        {batchTxResult.error ?? "Transaction failed"}
                      </AndamioText>
                    </div>
                  ) : null}
                  <AndamioButton variant="outline" size="sm" onClick={resetBatch} className="w-full" disabled={isConfirming}>
                    {isConfirming
                      ? "Waiting for confirmation..."
                      : batchTxResult?.status === "error"
                        ? "Try Again"
                        : "Done"}
                  </AndamioButton>

                  {/* Invisible stream watcher for the submitted TX */}
                  {batchTxResult?.txHash && batchTxResult.confirmationState === "confirming" && (
                    <BatchTxStreamWatcher
                      txHash={batchTxResult.txHash}
                      onConfirmed={handleTxConfirmed}
                      onFailed={handleTxFailed}
                    />
                  )}
                </div>
              )}

              {/* Submit button */}
              {batchState === "idle" && (
                <div className="px-4 pb-3">
                  <TransactionButton
                    txState={assessTx.state}
                    onClick={handleBatchSubmit}
                    disabled={!user?.accessTokenAlias || pendingDecisions.size === 0}
                    stateText={{
                      idle: `Submit ${pendingDecisions.size} Assessment${pendingDecisions.size !== 1 ? "s" : ""}`,
                      fetching: "Preparing...",
                      signing: "Sign in Wallet",
                      submitting: "Submitting...",
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </AndamioResizablePanel>

      <AndamioResizableHandle withHandle />

      {/* ================================================================= */}
      {/* RIGHT PANEL — Evidence Detail                                     */}
      {/* ================================================================= */}
      <AndamioResizablePanel defaultSize={60}>
        <AndamioScrollArea className="h-full">
          {selectedCommitment ? (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AndamioHeading level={3} size="lg">
                      {selectedCommitment.moduleCode ??
                        (selectedCommitment.sltHash
                          ? `${selectedCommitment.sltHash.slice(0, 12)}...`
                          : "Unknown")}
                    </AndamioHeading>
                    <AndamioBadge variant={getStatusVariant(selectedCommitment.commitmentStatus)}>
                      {formatNetworkStatus(selectedCommitment.commitmentStatus)}
                    </AndamioBadge>
                  </div>
                  <AndamioText variant="small" className="font-mono text-muted-foreground">
                    {selectedCommitment.studentAlias ?? "No access token"}
                  </AndamioText>
                </div>
                <AndamioButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCommitment(null)}
                >
                  <CloseIcon className="h-4 w-4" />
                </AndamioButton>
              </div>

              {/* Transaction info */}
              {selectedCommitment.submissionTx && (
                <div>
                  <AndamioLabel>Transaction</AndamioLabel>
                  <AndamioText variant="small" className="font-mono mt-1">
                    {selectedCommitment.submissionTx.slice(0, 24)}...
                  </AndamioText>
                </div>
              )}

              {/* Evidence Section — main focus */}
              <div className="space-y-2">
                <AndamioLabel>Student Evidence</AndamioLabel>
                {selectedCommitment.evidence ? (
                  <div className="border rounded-md">
                    <ContentDisplay content={selectedCommitment.evidence as JSONContent} variant="muted" />
                  </div>
                ) : selectedCommitment.onChainContent ? (
                  <div className="py-4 px-3 border rounded-md bg-muted/20">
                    <AndamioText variant="small" className="font-mono break-all">
                      {selectedCommitment.onChainContent}
                    </AndamioText>
                    <AndamioText variant="small" className="text-muted-foreground italic mt-2">
                      On-chain evidence hash. Database record not found.
                    </AndamioText>
                  </div>
                ) : (
                  <div className="py-4 px-3 border rounded-md bg-muted/20">
                    <AndamioText variant="small" className="text-muted-foreground italic">
                      No evidence submitted yet.
                    </AndamioText>
                  </div>
                )}
              </div>

              {/* Decision buttons — sticky bottom area */}
              {isReadyForAssessment(selectedCommitment) && (
                <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 -mx-6 px-6 space-y-3">
                  {(() => {
                    const currentDecision = getDecision(selectedCommitment);
                    const atCapacity = pendingDecisions.size >= BATCH_LIMIT && !currentDecision;
                    return (
                      <>
                        {atCapacity && (
                          <AndamioText variant="small" className="text-xs text-center text-destructive">
                            Batch limit ({BATCH_LIMIT}) reached — submit or clear current batch to continue
                          </AndamioText>
                        )}
                        <div className="flex items-center gap-3">
                          <AndamioButton
                            size="default"
                            disabled={atCapacity}
                            variant={currentDecision === "accept" ? "default" : "outline"}
                            onClick={() => handleDecisionAndAdvance(selectedCommitment, "accept")}
                            className={`flex-1 ${currentDecision === "accept" ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                          >
                            <SuccessIcon className="h-4 w-4 mr-2" />
                            Accept
                          </AndamioButton>
                          <AndamioButton
                            size="default"
                            disabled={atCapacity}
                            variant={currentDecision === "refuse" ? "destructive" : "outline"}
                            onClick={() => handleDecisionAndAdvance(selectedCommitment, "refuse")}
                            className="flex-1"
                          >
                            <CloseIcon className="h-4 w-4 mr-2" />
                            Refuse
                          </AndamioButton>
                          {currentDecision && (
                            <AndamioButton
                              size="default"
                              variant="ghost"
                              onClick={() => removeDecision(selectedCommitment)}
                            >
                              Clear
                            </AndamioButton>
                          )}
                        </div>
                        {/* Current decision indicator + next pending */}
                        <div className="flex items-center justify-between">
                          {currentDecision ? (
                            <AndamioText variant="small" className="text-muted-foreground">
                              Decision:{" "}
                              <span className={currentDecision === "accept" ? "text-success font-medium" : "text-destructive font-medium"}>
                                {currentDecision === "accept" ? "Accept" : "Refuse"}
                              </span>
                            </AndamioText>
                          ) : (
                            <span />
                          )}
                          {findNextPending(selectedCommitment) && (
                            <AndamioButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = findNextPending(selectedCommitment);
                                if (next) setSelectedCommitment(next);
                              }}
                            >
                              Next pending
                              <NextIcon className="h-4 w-4 ml-1" />
                            </AndamioButton>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <TeacherIcon className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <AndamioText className="font-medium">Select an assignment to review</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground mt-1">
                  Click on a learner in the list to view their evidence and make assessment decisions.
                </AndamioText>
              </div>
            </div>
          )}
        </AndamioScrollArea>
      </AndamioResizablePanel>
    </AndamioResizablePanelGroup>
  );
}
