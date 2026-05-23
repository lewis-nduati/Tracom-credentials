"use client";

import React from "react";
import Link from "next/link";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { SettingsIcon } from "~/components/icons";
import { type Course } from "~/hooks/api";
import {
  CourseStatusIcon,
  CourseModuleCount,
} from "./course-ui";

interface CourseTableViewProps {
  courses: Course[];
  moduleCounts: Record<string, number>;
}

/**
 * Table view for courses - detailed data grid
 * Uses shared components from course-ui.tsx for consistency
 * Horizontal scroll on mobile for better responsiveness
 */
export function CourseTableView({ courses, moduleCounts }: CourseTableViewProps) {
  return (
    <div className="border overflow-x-auto">
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="w-12">Status</AndamioTableHead>
            <AndamioTableHead className="min-w-[120px]">Course Code</AndamioTableHead>
            <AndamioTableHead className="min-w-[200px]">Title</AndamioTableHead>
            <AndamioTableHead className="min-w-[250px] hidden md:table-cell">Description</AndamioTableHead>
            <AndamioTableHead className="text-center min-w-[80px]">Modules</AndamioTableHead>
            <AndamioTableHead className="text-right min-w-[120px]">Actions</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {courses.map((courseData) => {
            const courseId = courseData.courseId ?? "";
            const title = typeof courseData.title === "string" ? courseData.title : "";
            const description = typeof courseData.description === "string" ? courseData.description : "";
            return (
              <AndamioTableRow key={courseId}>
                {/* Status Icon */}
                <AndamioTableCell>
                  <CourseStatusIcon isPublished={!!courseId} />
                </AndamioTableCell>

                {/* Course Code */}
                <AndamioTableCell className="font-mono text-xs">{courseId}</AndamioTableCell>

                {/* Title */}
                <AndamioTableCell className="font-medium">
                  <div className="line-clamp-2">{title}</div>
                </AndamioTableCell>

                {/* Description (hidden on mobile) */}
                <AndamioTableCell className="hidden md:table-cell">
                  {description ? (
                    <div className="line-clamp-2 text-sm text-muted-foreground">{description}</div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </AndamioTableCell>

                {/* Module Count */}
                <AndamioTableCell className="text-center">
                  <CourseModuleCount count={moduleCounts[courseId]} showIcon={false} />
                  {moduleCounts[courseId] === undefined && (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </AndamioTableCell>

                {/* Actions */}
                <AndamioTableCell className="text-right">
                  {courseId && (
                    <Link href={`/studio/course/${courseId}`}>
                      <AndamioButton variant="ghost" size="sm">
                        <SettingsIcon className="h-4 w-4 md:mr-1" />
                        <span className="hidden md:inline">Manage</span>
                      </AndamioButton>
                    </Link>
                  )}
                </AndamioTableCell>
              </AndamioTableRow>
            );
          })}
        </AndamioTableBody>
      </AndamioTable>
    </div>
  );
}
