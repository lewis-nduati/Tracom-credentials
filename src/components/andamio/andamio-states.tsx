/**
 * Andamio State Display Components
 *
 * Reusable components for loading, error, and empty states.
 * Eliminates repeated state UI patterns across pages.
 *
 * @example
 * ```tsx
 * // Use unified loading components from andamio-loading.tsx
 * if (isLoading) return <AndamioPageLoading variant="list" />;
 * if (isLoading) return <AndamioCardLoading title="Loading" />;
 *
 * // Error and empty states
 * if (error) return <ErrorState message={error} onRetry={refetch} />;
 * if (items.length === 0) return <EmptyState title="No items" />;
 * ```
 */

"use client";

import React from "react";
import { AlertIcon, EmptyIcon, RefreshIcon } from "~/components/icons";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "./andamio-alert";
import { AndamioButton } from "./andamio-button";
import { AndamioText } from "./andamio-text";
import { AndamioHeading } from "./andamio-heading";
import type { IconComponent } from "~/types/ui";
// Note: Loading components are exported from ./andamio-loading via index.ts
// Do NOT re-export them here to avoid duplicate export warnings
import {
  AndamioPageLoading,
  AndamioInlineLoading,
} from "./andamio-loading";

/**
 * @deprecated Use AndamioPageLoading or AndamioInlineLoading from andamio-loading.tsx instead
 */
export interface LoadingStateProps {
  rows?: number;
  showHeader?: boolean;
  className?: string;
  variant?: "list" | "card" | "minimal";
}

/**
 * @deprecated Use AndamioPageLoading or AndamioInlineLoading from andamio-loading.tsx instead
 *
 * Migration guide:
 * - LoadingState variant="list" → AndamioPageLoading variant="list"
 * - LoadingState variant="card" → AndamioPageLoading variant="cards"
 * - LoadingState variant="minimal" → AndamioInlineLoading
 */
export function LoadingState({
  rows = 5,
  className,
  variant = "list",
}: LoadingStateProps) {
  if (variant === "minimal") {
    return <AndamioInlineLoading className={className} />;
  }

  const mappedVariant = variant === "card" ? "cards" : "list";
  return <AndamioPageLoading variant={mappedVariant} itemCount={rows} className={className} />;
}

/**
 * ErrorState - Error alert with optional retry
 */
export interface ErrorStateProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Error title
   * @default "Error"
   */
  title?: string;
  /**
   * Callback for retry button
   */
  onRetry?: () => void;
  /**
   * Text for retry button
   * @default "Try Again"
   */
  retryLabel?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Icon to display
   * @default AlertCircle
   */
  icon?: IconComponent;
}

export function ErrorState({
  message,
  title = "Error",
  onRetry,
  retryLabel = "Try Again",
  className,
  icon: IconProp,
}: ErrorStateProps) {
  const Icon: IconComponent = IconProp ?? AlertIcon;
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <AndamioAlert variant="destructive">
        <Icon className="h-4 w-4" />
        <AndamioAlertTitle>{title}</AndamioAlertTitle>
        <AndamioAlertDescription>{message}</AndamioAlertDescription>
      </AndamioAlert>
      {onRetry && (
        <AndamioButton variant="outline" onClick={onRetry}>
          <RefreshIcon className="h-4 w-4 mr-2" />
          {retryLabel}
        </AndamioButton>
      )}
    </div>
  );
}

/**
 * EmptyState - Placeholder for empty lists/data
 */
export interface EmptyStateProps {
  /**
   * Title text
   * @default "No items found"
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Icon to display
   * @default Inbox
   */
  icon?: IconComponent;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className
   */
  className?: string;
}

export function EmptyState({
  title = "No items found",
  description,
  icon: IconProp,
  action,
  className,
}: EmptyStateProps) {
  const Icon: IconComponent = IconProp ?? EmptyIcon;
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center border rounded-md ${className ?? ""}`}
    >
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <AndamioHeading level={3} size="lg" className="mb-1">{title}</AndamioHeading>
      {description && (
        <AndamioText variant="small" className="max-w-sm mb-4">{description}</AndamioText>
      )}
      {action && (
        <AndamioButton onClick={action.onClick}>{action.label}</AndamioButton>
      )}
    </div>
  );
}

/**
 * NotFoundState - 404-style not found display
 */
export interface NotFoundStateProps {
  /**
   * What was not found
   * @default "Item"
   */
  itemType?: string;
  /**
   * Navigation action
   */
  backAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className
   */
  className?: string;
}

export function NotFoundState({
  itemType = "Item",
  backAction,
  className,
}: NotFoundStateProps) {
  const NotFoundIcon: IconComponent = AlertIcon;
  return (
    <EmptyState
      title={`${itemType} not found`}
      description={`The ${itemType.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      icon={NotFoundIcon}
      action={backAction}
      className={className}
    />
  );
}

/**
 * AuthRequiredState - Prompt for authentication
 */
export interface AuthRequiredStateProps {
  /**
   * Feature that requires auth
   */
  feature?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Children to render (e.g., auth button)
   */
  children?: React.ReactNode;
}

export function AuthRequiredState({
  feature = "this feature",
  className,
  children,
}: AuthRequiredStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center border rounded-md ${className ?? ""}`}
    >
      <AlertIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <AndamioHeading level={3} size="lg" className="mb-1">Authentication Required</AndamioHeading>
      <AndamioText variant="small" className="max-w-sm mb-4">
        Connect your wallet to access {feature}.
      </AndamioText>
      {children}
    </div>
  );
}
