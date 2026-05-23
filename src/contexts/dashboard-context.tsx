"use client";

import React, { createContext, useContext } from "react";
import {
  useDashboard,
  type Dashboard,
  type DashboardCounts,
  type DashboardStudent,
  type DashboardTeacher,
  type DashboardProjects,
} from "~/hooks/api";

// =============================================================================
// Context Types
// =============================================================================

interface DashboardContextValue {
  /** Full dashboard data */
  dashboard: Dashboard | undefined;
  /** Aggregated counts for summary cards */
  counts: DashboardCounts | undefined;
  /** Student-specific data (courses, credentials, commitments) */
  student: DashboardStudent | undefined;
  /** Teacher-specific data (courses, pending reviews) */
  teacher: DashboardTeacher | undefined;
  /** Project data (contributing, managing, with prerequisites) */
  projects: DashboardProjects | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch dashboard data */
  refetch: () => void;
  /** Warning message if partial content was returned */
  warning: string | undefined;
}

// =============================================================================
// Context
// =============================================================================

const DashboardContext = createContext<DashboardContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface DashboardProviderProps {
  children: React.ReactNode;
}

/**
 * Dashboard data provider that fetches consolidated dashboard data once
 * and shares it with all child components.
 *
 * This eliminates the N+1 query pattern where each dashboard card made
 * its own API call. Now all cards consume from a single shared query.
 *
 * @example
 * ```tsx
 * // In dashboard page layout
 * <DashboardProvider>
 *   <StudentAccomplishments />
 *   <PendingReviewsSummary />
 *   <ContributingProjectsSummary />
 * </DashboardProvider>
 *
 * // In a dashboard component
 * function StudentAccomplishments() {
 *   const { counts, student, isLoading } = useDashboardData();
 *   // Use shared data instead of individual API calls
 * }
 * ```
 */
export function DashboardProvider({ children }: DashboardProviderProps) {
  const { data: dashboard, isLoading, error, refetch } = useDashboard();

  const value: DashboardContextValue = {
    dashboard,
    counts: dashboard?.counts,
    student: dashboard?.student,
    teacher: dashboard?.teacher,
    projects: dashboard?.projects,
    isLoading,
    error: error,
    refetch: () => void refetch(),
    warning: dashboard?.warning,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access dashboard data from the DashboardProvider context.
 *
 * Must be used within a DashboardProvider.
 *
 * @throws Error if used outside of DashboardProvider
 */
export function useDashboardData(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error(
      "useDashboardData must be used within a DashboardProvider. " +
      "Wrap your dashboard components with <DashboardProvider>."
    );
  }

  return context;
}

/**
 * Check if we're inside a DashboardProvider.
 * Useful for components that can work both with and without the provider.
 */
export function useOptionalDashboardData(): DashboardContextValue | null {
  return useContext(DashboardContext);
}
