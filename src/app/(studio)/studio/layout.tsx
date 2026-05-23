"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudioHeader } from "~/components/layout/studio-header";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import {
  useTeacherCourses,
  type TeacherCourse,
} from "~/hooks/api";
import {
  useOwnerProjects,
  useManagerProjects,
  type Project,
  type ManagerProject,
} from "~/hooks/api";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
  AndamioInput,
} from "~/components/andamio";
import {
  SearchIcon,
  RefreshIcon,
  CourseIcon,
  ProjectIcon,
  NextIcon,
  SuccessIcon,
  PendingIcon,
  AlertIcon,
  AddIcon,
  UploadIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";
import { StudioProvider, useStudioContext } from "./studio-context";

// =============================================================================
// Studio Sidebar Layout
// =============================================================================

/**
 * Shared layout for /studio and all child routes.
 * Provides persistent sidebar with courses and projects list.
 */
export default function StudioSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioProvider>
      <StudioSidebarLayoutInner>{children}</StudioSidebarLayoutInner>
    </StudioProvider>
  );
}

function StudioSidebarLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAndamioAuth();
  const { showCreateCourse, showCreateProject } = useStudioContext();
  const { setActions } = useStudioHeader();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");

  // Courses data
  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useTeacherCourses();

  // Projects data (owned + managed)
  const {
    data: ownedProjects = [],
    isLoading: ownedLoading,
    refetch: refetchOwned,
  } = useOwnerProjects();

  const {
    data: managedProjects = [],
    isLoading: managedLoading,
    refetch: refetchManaged,
  } = useManagerProjects();

  // Deduplicate managed projects
  const allProjects = useMemo(() => {
    const ownedIds = new Set(ownedProjects.map((p) => p.projectId));
    const managedOnly = managedProjects.filter((p) => !ownedIds.has(p.projectId));
    return [...ownedProjects, ...managedOnly];
  }, [ownedProjects, managedProjects]);

  const isLoading = coursesLoading || ownedLoading || managedLoading;

  // Filter by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.courseId.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return allProjects;
    const query = searchQuery.toLowerCase();
    return allProjects.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query)
    );
  }, [allProjects, searchQuery]);

  const handleRefresh = useCallback(() => {
    void refetchCourses();
    void refetchOwned();
    void refetchManaged();
  }, [refetchCourses, refetchOwned, refetchManaged]);

  // Determine selected item from URL
  const selectedCourseId = useMemo(() => {
    const match = /\/studio\/course\/([^/]+)/.exec(pathname);
    return match ? match[1] : null;
  }, [pathname]);

  const selectedProjectId = useMemo(() => {
    const match = /\/studio\/project\/([^/]+)/.exec(pathname);
    return match ? match[1] : null;
  }, [pathname]);

  // Check if we're in wizard mode (hide sidebar)
  // Wizard mode is when we're editing a module: /studio/course/[courseId]/[moduleCode]
  // This matches both /new and actual module codes like /101
  // Excludes /teacher route which is not wizard mode
  const isWizardMode = useMemo(() => {
    // Match /studio/course/[courseId]/[moduleCode] pattern
    const courseModuleMatch = /\/studio\/course\/[^/]+\/([^/]+)/.exec(pathname);
    if (!courseModuleMatch) return false;

    // Exclude known non-wizard routes
    const segment = courseModuleMatch[1];
    if (segment === "teacher") return false;

    return true;
  }, [pathname]);

  // Update studio header with refresh button
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <AndamioButton
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-7 w-7 p-0"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </AndamioButton>
      </div>
    );
  }, [setActions, isLoading, handleRefresh]);

  // Auth gate
  if (!isAuthenticated) {
    return (
      <StudioEditorPane padding="normal" className="min-h-[calc(100vh-40px-44px)]">
        <ConnectWalletGate
          title="Connect your wallet"
          description="Sign in to access Studio"
        />
      </StudioEditorPane>
    );
  }

  // Wizard mode: hide sidebar, show full-width content
  if (isWizardMode) {
    return <>{children}</>;
  }

  return (
    <AndamioResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel: Courses + Projects List */}
      <AndamioResizablePanel defaultSize={25} minSize={15} maxSize={35}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Search - Top */}
          <div className="border-b border-border px-3 py-2 bg-muted/30">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <AndamioInput
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <AndamioScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-1 px-4 py-3">
              {/* Import Quick Action */}
              <Link
                href="/studio/import"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 mb-2 rounded-sm border border-dashed transition-all",
                  pathname === "/studio/import"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <UploadIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Import Module</span>
              </Link>

              {/* Courses Section */}
              <SectionHeader
                title="Courses"
                count={filteredCourses.length}
                icon={<CourseIcon className="h-4 w-4" />}
                variant="course"
                onCreate={() => {
                  if (pathname !== "/studio") {
                    router.push("/studio");
                  }
                  showCreateCourse();
                }}
              />

              {coursesLoading && courses.length === 0 && (
                <div className="space-y-2 mb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/30">
                      <AndamioSkeleton className="h-8 w-8 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <AndamioSkeleton className="h-3.5 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredCourses.map((course) => (
                <CourseListItem
                  key={course.courseId}
                  course={course}
                  isSelected={course.courseId === selectedCourseId}
                />
              ))}

              {!coursesLoading && courses.length > 0 && filteredCourses.length === 0 && (
                <div className="py-4 text-center mb-4">
                  <span className="text-xs text-muted-foreground">No matching courses</span>
                </div>
              )}

              {/* Projects Section */}
              <SectionHeader
                title="Projects"
                count={filteredProjects.length}
                icon={<ProjectIcon className="h-4 w-4" />}
                variant="project"
                onCreate={() => {
                  if (pathname !== "/studio") {
                    router.push("/studio");
                  }
                  showCreateProject();
                }}
                className="mt-4"
              />

              {(ownedLoading || managedLoading) && allProjects.length === 0 && (
                <div className="space-y-2 mb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/30">
                      <AndamioSkeleton className="h-8 w-8 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <AndamioSkeleton className="h-3.5 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredProjects.map((project) => (
                <ProjectListItem
                  key={project.projectId}
                  project={project}
                  isSelected={project.projectId === selectedProjectId}
                />
              ))}

              {!ownedLoading && !managedLoading && allProjects.length > 0 && filteredProjects.length === 0 && (
                <div className="py-4 text-center">
                  <span className="text-xs text-muted-foreground">No matching projects</span>
                </div>
              )}
            </div>
          </AndamioScrollArea>

        </div>
      </AndamioResizablePanel>

      <AndamioResizableHandle withHandle />

      {/* Right Panel: Page Content */}
      <AndamioResizablePanel defaultSize={75}>
        {children}
      </AndamioResizablePanel>
    </AndamioResizablePanelGroup>
  );
}

// =============================================================================
// Section Header
// =============================================================================

interface SectionHeaderProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  onCreate: () => void;
  variant: "course" | "project";
  className?: string;
}

function SectionHeader({ title, count, icon, onCreate, variant, className }: SectionHeaderProps) {
  const iconColor = variant === "course" ? "text-primary" : "text-secondary";
  return (
    <div className={cn("flex items-center justify-between px-2 py-2", className)}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("shrink-0", iconColor)}>{icon}</span>
        <span className="text-sm font-medium truncate">{title}</span>
        <AndamioBadge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
          {count}
        </AndamioBadge>
      </div>
      <AndamioButton
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs shrink-0"
        onClick={onCreate}
      >
        <AddIcon className="h-3 w-3 mr-1" />
        Create
      </AndamioButton>
    </div>
  );
}

// =============================================================================
// Course List Item
// =============================================================================

interface CourseListItemProps {
  course: TeacherCourse;
  isSelected: boolean;
}

function CourseListItem({ course, isSelected }: CourseListItemProps) {
  const hasDbContent = course.title !== undefined && course.title !== null;
  const isOnChain = course.status === "synced" || course.status === "onchain_only";

  return (
    <Link
      href={`/studio/course/${course.courseId}`}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-sm border transition-all duration-150",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
        !hasDbContent && "opacity-60"
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0",
        isOnChain && hasDbContent ? "bg-primary/10" : hasDbContent ? "bg-muted/10" : "bg-muted"
      )}>
        {isOnChain && hasDbContent ? (
          <SuccessIcon className="h-4 w-4 text-primary" />
        ) : hasDbContent ? (
          <PendingIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <AlertIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm font-medium truncate transition-colors block",
          isSelected ? "text-primary" : "group-hover:text-foreground"
        )}>
          {course.title || "Untitled Course"}
        </span>
      </div>

      {/* Selection indicator */}
      <NextIcon className={cn(
        "h-4 w-4 flex-shrink-0 transition-all duration-150",
        isSelected
          ? "text-primary opacity-100 translate-x-0"
          : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
      )} />
    </Link>
  );
}

// =============================================================================
// Project List Item
// =============================================================================

interface ProjectListItemProps {
  project: Project | ManagerProject;
  isSelected: boolean;
}

function ProjectListItem({ project, isSelected }: ProjectListItemProps) {
  const isRegistered = project.status !== "unregistered";
  const isOnChain = project.status === "active" || project.status === "unregistered";

  // Build tooltip with prerequisites info (only Project type has prerequisites, not ManagerProject)
  const prereqs = (project as { prerequisites?: Array<{ courseId: string }> }).prerequisites;
  const tooltipText = useMemo(() => {
    if (!prereqs || prereqs.length === 0) {
      return project.title || "Untitled Project";
    }
    const courseList = prereqs.map(p => p.courseId.slice(0, 8) + "…").join(", ");
    return `${project.title || "Untitled Project"}\nPrerequisites: ${courseList}`;
  }, [prereqs, project.title]);

  return (
    <Link
      href={`/studio/project/${project.projectId}`}
      title={tooltipText}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-sm border transition-all duration-150",
        isSelected
          ? "bg-secondary/10 border-secondary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
        !isRegistered && "opacity-60"
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0",
        isRegistered && isOnChain ? "bg-secondary/10" : isRegistered ? "bg-muted/10" : "bg-muted"
      )}>
        {isRegistered && isOnChain ? (
          <SuccessIcon className="h-4 w-4 text-secondary" />
        ) : isRegistered ? (
          <PendingIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <AlertIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Project info */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm font-medium truncate transition-colors block",
          isSelected ? "text-secondary" : "group-hover:text-foreground"
        )}>
          {project.title || "Untitled Project"}
        </span>
      </div>

      {/* Selection indicator */}
      <NextIcon className={cn(
        "h-4 w-4 flex-shrink-0 transition-all duration-150",
        isSelected
          ? "text-secondary opacity-100 translate-x-0"
          : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
      )} />
    </Link>
  );
}
