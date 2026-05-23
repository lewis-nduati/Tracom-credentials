"use client";

import Link from "next/link";
import { SuccessIcon, PendingIcon, NeutralIcon, NextIcon, DeleteIcon, OnChainIcon } from "~/components/icons";
import { type CourseModule, type CourseModuleStatus } from "~/hooks/api/course/use-course-module";
import { AndamioCard } from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";

// =============================================================================
// Module Status Configuration
// =============================================================================

/**
 * Status config uses lowercase values matching CourseModuleStatus from use-course-module.ts:
 * - "draft": DB only, teacher editing
 * - "approved": DB only, SLTs locked, ready for TX
 * - "pending_tx": TX submitted but not confirmed
 * - "active": On-chain + DB (merged)
 * - "unregistered": On-chain only, needs DB registration
 */
interface StatusConfig {
  icon: typeof SuccessIcon;
  iconColor: string;
  label: string;
  textColor: string;
}

const STATUS_CONFIG: Record<CourseModuleStatus, StatusConfig> = {
  active: {
    icon: SuccessIcon,
    iconColor: "text-primary",
    label: "On-Chain",
    textColor: "text-primary",
  },
  pending_tx: {
    icon: PendingIcon,
    iconColor: "text-secondary animate-pulse",
    label: "Pending...",
    textColor: "text-secondary",
  },
  approved: {
    icon: NeutralIcon,
    iconColor: "text-muted-foreground fill-warning",
    label: "Ready to Publish",
    textColor: "text-muted-foreground",
  },
  draft: {
    icon: NeutralIcon,
    iconColor: "text-muted-foreground",
    label: "Draft",
    textColor: "text-muted-foreground",
  },
  unregistered: {
    icon: OnChainIcon,
    iconColor: "text-secondary",
    label: "Unregistered",
    textColor: "text-secondary",
  },
};

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as CourseModuleStatus] ?? STATUS_CONFIG.draft;
}

// =============================================================================
// Module Status Icon
// =============================================================================

function ModuleStatusIcon({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return <Icon className={cn("h-4 w-4", config.iconColor)} />;
}

// =============================================================================
// Module Status Text
// =============================================================================

function ModuleStatusText({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={cn("text-sm font-medium", config.textColor)}>
      {config.label}
    </span>
  );
}

// =============================================================================
// Studio Module Card
// =============================================================================

export interface StudioModuleCardProps {
  /** Course module data (app-level type with camelCase fields) */
  courseModule: CourseModule;
  courseId: string;
  /** Show the module status text */
  showStatus?: boolean;
  /** Show the module description */
  showDescription?: boolean;
  /** Show the SLT count */
  showSltCount?: boolean;
  /** Callback for deleting the module (only shown for DRAFT modules) */
  onDelete?: () => void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
}

export function StudioModuleCard({
  courseModule,
  courseId,
  showStatus = true,
  showDescription = true,
  showSltCount = true,
  onDelete,
  isDeleting = false,
}: StudioModuleCardProps) {
  // Use camelCase fields from CourseModule (app-level type)
  const sltCount = courseModule.slts?.length ?? courseModule.onChainSlts?.length ?? 0;
  const status = courseModule.status;
  const moduleCode = courseModule.moduleCode ?? "";
  const sltHash = courseModule.sltHash ?? "";
  const description = typeof courseModule.description === "string" ? courseModule.description : "";

  // Unregistered modules exist on-chain but aren't in the database yet
  const isUnregistered = status === "unregistered";

  // Only allow delete for draft modules (not minted or pending)
  const canDelete = onDelete && status === "draft";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent Link navigation
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent Link navigation
    onDelete?.();
  };

  // For unregistered modules, show a non-clickable card with registration guidance
  if (isUnregistered) {
    return (
      <AndamioCard className="p-5 border-secondary/30 bg-secondary/5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Module Info */}
          <div className="flex-1 min-w-0">
            {/* Hash & Status Icon */}
            <div className="flex items-center gap-2 mb-1">
              <ModuleStatusIcon status={status} />
              <span className="text-xs font-mono text-secondary/70 bg-secondary/10 px-2 py-0.5 rounded">
                {sltHash.slice(0, 12)}...
              </span>
            </div>

            {/* Title placeholder */}
            <div className="text-lg font-semibold text-foreground">
              On-Chain Module
            </div>

            {/* Registration guidance */}
            <AndamioText variant="small" className="text-secondary mt-1">
              This module exists on-chain but needs to be registered. Go to the On-Chain tab to register it.
            </AndamioText>
          </div>

          {/* Right: Status & Metadata */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* SLT Count */}
            {showSltCount && sltCount > 0 && (
              <AndamioText variant="small" className="text-muted-foreground whitespace-nowrap">
                {sltCount} Learning Target{sltCount !== 1 ? "s" : ""}
              </AndamioText>
            )}

            {/* Status Text */}
            {showStatus && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <ModuleStatusText status={status} />
              </>
            )}
          </div>
        </div>
      </AndamioCard>
    );
  }

  // All modules link to the edit wizard — the status badge communicates the next step
  const cardHref = `/studio/course/${courseId}/${moduleCode}`;

  return (
    <Link
      href={cardHref}
      className="group block"
    >
      <AndamioCard className="p-5 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Module Info */}
          <div className="flex-1 min-w-0">
            {/* Module Code & Status Icon */}
            <div className="flex items-center gap-2 mb-1">
              <ModuleStatusIcon status={status} />
              {moduleCode && (
                <span className="text-xs font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded">
                  {moduleCode}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {courseModule.title ?? "Untitled Module"}
            </div>

            {/* Description */}
            {showDescription && description && (
              <AndamioText variant="muted" className="text-sm mt-1 line-clamp-2">
                {description}
              </AndamioText>
            )}
          </div>

          {/* Right: Status & Metadata */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* SLT Count */}
            {showSltCount && sltCount > 0 && (
              <AndamioText variant="small" className="text-muted-foreground whitespace-nowrap">
                {sltCount} Learning Target{sltCount !== 1 ? "s" : ""}
              </AndamioText>
            )}

            {/* Status Text */}
            {showStatus && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <ModuleStatusText status={status} />
              </>
            )}

            {/* Delete Button - Only for DRAFT modules */}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </AndamioButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete module</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete &ldquo;{courseModule.title ?? moduleCode}&rdquo;? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteConfirm}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Arrow */}
            <NextIcon className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </div>
        </div>
      </AndamioCard>
    </Link>
  );
}

// Export sub-components for flexibility
export { ModuleStatusIcon, ModuleStatusText, getStatusConfig };
