"use client";

import Link from "next/link";
import { OnChainIcon, NextIcon, SuccessIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AssignmentStatusBadge } from "~/components/learner/assignment-status-badge";

/**
 * SLT data for display in module card
 */
export interface ModuleSLT {
  sltText: string;
}

export interface CourseModuleCardProps {
  /** Module code identifier */
  moduleCode: string;
  /** Module title */
  title: string;
  /** Module index (1-based for display, fallback when no moduleCode) */
  index: number;
  /** SLT hash (used as fallback identifier for chain_only modules) */
  sltHash?: string;
  /** List of SLTs in this module */
  slts: ModuleSLT[];
  /** Set of on-chain verified SLT texts */
  onChainSlts?: Set<string>;
  /** Whether module has been verified on-chain */
  isOnChain?: boolean;
  /** Course NFT policy ID for link generation */
  courseId: string;
  /** Student's commitment status for this module (derived from commitments list) */
  commitmentStatus?: string | null;
}

/**
 * CourseModuleCard - Displays a course module with its learning targets
 *
 * Used on course detail pages to show module overview with SLT list.
 * Includes on-chain verification indicators when available.
 */
export function CourseModuleCard({
  moduleCode,
  title,
  index,
  sltHash,
  slts,
  onChainSlts = new Set(),
  isOnChain = false,
  courseId,
  commitmentStatus,
}: CourseModuleCardProps) {
  // Display: moduleCode > shortened sltHash > index
  const displayCode = moduleCode || (sltHash ? `#${sltHash.slice(0, 4)}` : String(index));

  // Link destination: use moduleCode if available, otherwise sltHash for chain_only modules
  const linkPath = moduleCode
    ? `/course/${courseId}/${moduleCode}`
    : `/course/${courseId}/${sltHash}`;

  return (
    <AndamioCard className="overflow-hidden">
      <Link href={linkPath}>
        <AndamioCardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                {displayCode}
              </div>
              <div className="min-w-0 flex-1">
                <AndamioCardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span className="truncate">{title}</span>
                  {isOnChain && (
                    <span title="Module on-chain" className="shrink-0">
                      <OnChainIcon className="h-4 w-4 text-primary" />
                    </span>
                  )}
                </AndamioCardTitle>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              {commitmentStatus ? (
                <AssignmentStatusBadge status={commitmentStatus} />
              ) : (
                <AndamioButton size="sm" rightIcon={<NextIcon className="h-3.5 w-3.5" />}>
                  Earn Credential
                </AndamioButton>
              )}
            </div>
          </div>
        </AndamioCardHeader>
      </Link>
      <AndamioCardContent className="pt-0 border-t bg-muted/30">
        <div className="pt-4">
          <AndamioText variant="overline" className="mb-3">
            Learning Targets
          </AndamioText>
          <ul className="space-y-2">
            {slts.map((slt, sltIndex) => {
              const isOnChainSlt = onChainSlts.has(slt.sltText);
              return (
                <li key={sltIndex} className="flex items-start gap-3">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      isOnChainSlt
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isOnChainSlt ? (
                      <SuccessIcon className="h-3.5 w-3.5" />
                    ) : (
                      sltIndex + 1
                    )}
                  </div>
                  <span className="text-sm pt-0.5">{slt.sltText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
