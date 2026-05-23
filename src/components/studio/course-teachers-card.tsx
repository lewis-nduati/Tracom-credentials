"use client";

import React from "react";
import { useCourse } from "~/hooks/api";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import { TeacherIcon, OwnerIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

interface CourseTeachersCardProps {
  courseId: string;
  className?: string;
}

/**
 * Card showing course owner and teachers from merged API data
 *
 * Note: Chain sync now happens automatically on the backend.
 * This component displays the combined on-chain + database team data.
 */
export function CourseTeachersCard({
  courseId,
  className,
}: CourseTeachersCardProps) {
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useCourse(courseId);

  // Get owner and teachers from merged course data
  const owner = course?.owner;
  const teachers = course?.teachers ?? [];

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <AndamioCardTitle className="text-base flex items-center gap-2">
          <TeacherIcon className="h-4 w-4" />
          Course Team
        </AndamioCardTitle>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Owner Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OwnerIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              Owner
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isLoadingCourse ? (
              <AndamioSkeleton className="h-6 w-24" />
            ) : courseError ? (
              <AndamioText variant="small" className="text-destructive">
                Failed to load
              </AndamioText>
            ) : owner ? (
              <AndamioBadge variant="default" className="font-mono text-xs">
                {owner}
              </AndamioBadge>
            ) : (
              <AndamioText variant="small" className="text-muted-foreground">
                Not set
              </AndamioText>
            )}
          </div>
        </div>

        {/* Teachers Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TeacherIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <AndamioText variant="small" className="font-medium">
              Teachers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isLoadingCourse ? (
              <>
                <AndamioSkeleton className="h-6 w-20" />
                <AndamioSkeleton className="h-6 w-16" />
              </>
            ) : courseError ? (
              <AndamioText variant="small" className="text-destructive">
                Failed to load
              </AndamioText>
            ) : teachers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No teachers assigned
              </AndamioText>
            ) : (
              teachers.map((teacher: string) => (
                <AndamioBadge
                  key={teacher}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {teacher}
                </AndamioBadge>
              ))
            )}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
