"use client";

import React from "react";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  CredentialIcon,
  EditIcon,
  ErrorIcon,
  InfoIcon,
  NeutralIcon,
  PendingIcon,
  SuccessIcon,
} from "~/components/icons";
import { normalizeAssignmentStatus, type AssignmentStatus } from "~/lib/assignment-status";
import { cn } from "~/lib/utils";

type StatusInput = string | null | undefined;

interface AssignmentStatusBadgeProps {
  status?: StatusInput;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_META: Record<
  AssignmentStatus,
  {
    label: string;
    tooltip: string;
    icon: React.ElementType;
    badgeStatus?: "pending" | "success" | "error";
    variant?: "default" | "secondary" | "outline";
  }
> = {
  NOT_STARTED: {
    label: "Not Started",
    tooltip: "You haven't started this assignment yet",
    icon: NeutralIcon,
    variant: "outline",
  },
  IN_PROGRESS: {
    label: "In Progress",
    tooltip: "Your assignment is being prepared or submitted",
    icon: EditIcon,
    variant: "secondary",
  },
  PENDING_APPROVAL: {
    label: "Pending Review",
    tooltip: "Your assignment is waiting for instructor review",
    icon: PendingIcon,
    badgeStatus: "pending",
    variant: "secondary",
  },
  ASSIGNMENT_ACCEPTED: {
    label: "Completed",
    tooltip: "Your assignment has been accepted",
    icon: SuccessIcon,
    badgeStatus: "success",
    variant: "default",
  },
  ASSIGNMENT_DENIED: {
    label: "Needs Revision",
    tooltip: "Review the feedback and resubmit your assignment",
    icon: ErrorIcon,
    badgeStatus: "error",
    variant: "default",
  },
  CREDENTIAL_CLAIMED: {
    label: "Credential Earned",
    tooltip: "Your credential has been recorded on-chain",
    icon: CredentialIcon,
    variant: "default",
  },
  UNKNOWN: {
    label: "Unknown",
    tooltip: "Status could not be determined",
    icon: InfoIcon,
    variant: "outline",
  },
};

export function AssignmentStatusBadge({
  status,
  size = "sm",
  className,
}: AssignmentStatusBadgeProps) {
  const normalized = normalizeAssignmentStatus(status);
  const meta = STATUS_META[normalized];
  const Icon = meta.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <AndamioBadge
      status={meta.badgeStatus}
      variant={meta.variant}
      className={cn("inline-flex items-center gap-1.5", textSize, className)}
      aria-label={meta.label}
      title={meta.tooltip}
    >
      <Icon className={cn(iconSize)} />
      {meta.label}
    </AndamioBadge>
  );
}
