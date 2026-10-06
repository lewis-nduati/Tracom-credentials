"use client";

import React, { useMemo } from "react";
import { AndamioNextStep, AndamioSkeleton } from "~/components/andamio";
import { useDashboardData } from "~/contexts/dashboard-context";
import { getCoursePaths } from "~/lib/course-path";
import { getNextStep } from "~/lib/next-step";

export function DashboardNextStep() {
  const { student, teacher, isLoading } = useDashboardData();
  const step = useMemo(
    () =>
      student
        ? getNextStep(getCoursePaths(student), { pendingReviews: teacher?.pendingReviews ?? [] })
        : null,
    [student, teacher?.pendingReviews],
  );

  if (isLoading) return <AndamioSkeleton className="h-28 w-full rounded-sm" />;
  if (!step) return null;
  return <AndamioNextStep title={step.title} detail={step.detail} action={step.action} />;
}
