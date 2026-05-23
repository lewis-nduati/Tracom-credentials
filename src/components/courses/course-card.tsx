"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  OnChainIcon,
  SuccessIcon,
  TeacherIcon,
} from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardFooter,
} from "~/components/andamio/andamio-card";
import type { Course } from "~/hooks/api";

interface CourseCardProps {
  course: Course;
  /** Optional enrollment status for authenticated students */
  enrollmentStatus?: "enrolled" | "completed";
}

/**
 * Enrollment badge for authenticated students
 */
function EnrollmentBadge({ status }: { status?: "enrolled" | "completed" }) {
  switch (status) {
    case "completed":
      return (
        <AndamioBadge status="success" className="text-xs">
          <SuccessIcon className="h-3 w-3 mr-1" />
          Completed
        </AndamioBadge>
      );
    case "enrolled":
      return (
        <AndamioBadge status="pending" className="text-xs">
          <OnChainIcon className="h-3 w-3 mr-1" />
          Enrolled
        </AndamioBadge>
      );
    default:
      return null;
  }
}

/**
 * CourseCard - Card with taller image header and title overlaid on gradient.
 * Description, badges, and footer sit on the solid card body below.
 */
export function CourseCard({ course, enrollmentStatus }: CourseCardProps) {
  const [imageError, setImageError] = useState(false);
  const {
    courseId,
    title,
    description,
    imageUrl,
    teachers,
  } = course;

  const displayTitle = title || courseId?.slice(0, 24) || "Untitled Course";
  const teacherCount = teachers?.length ?? 0;
  const showImage = imageUrl && !imageError;

  return (
    <Link href={`/course/${courseId}`} className="block group" data-testid="course-card">
      <AndamioCard className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:bg-accent/5">
        {/* Image header — taller, with title overlaid */}
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-xl -mt-6 -mx-0">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-accent/15" />
          )}
          {/* Gradient overlay for title readability */}
          <div className={showImage
            ? "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            : "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          } />
          {/* Title overlay — pinned to bottom */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
            {/* White text for WCAG AA contrast against image/gradient overlays */}
            <h3
              className="text-base sm:text-lg font-semibold line-clamp-2 !m-0"
              style={{ color: "white" }}
            >
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* Card body — solid background */}
        <AndamioCardContent className="pt-3">
          {description ? (
            <AndamioCardDescription className="line-clamp-2">
              {description}
            </AndamioCardDescription>
          ) : (
            <AndamioText variant="small" className="text-muted-foreground italic">
              No description available
            </AndamioText>
          )}
        </AndamioCardContent>

        <AndamioCardFooter className="border-t pt-3 mt-auto">
          <div className="flex items-center w-full text-sm text-muted-foreground">
            {teacherCount > 0 && (
              <div className="flex items-center gap-1.5">
                <TeacherIcon className="h-3.5 w-3.5" />
                <span>{teacherCount} {teacherCount === 1 ? "teacher" : "teachers"}</span>
              </div>
            )}
            <div className="ml-auto">
              <EnrollmentBadge status={enrollmentStatus} />
            </div>
          </div>
        </AndamioCardFooter>
      </AndamioCard>
    </Link>
  );
}
