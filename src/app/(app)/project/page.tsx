"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects } from "~/hooks/api";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioText } from "~/components/andamio";
import { AlertIcon, ProjectIcon, CredentialIcon, SearchIcon, SuccessIcon } from "~/components/icons";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";
import { ProjectCard } from "~/components/projects/project-card";
import { Button } from "~/components/ui/button";

type EligibilityFilter = "all" | "qualified" | "in-progress" | "open";

/**
 * Public page displaying all published projects
 *
 * Shows eligibility status for authenticated users based on their
 * completed courses/credentials.
 *
 * API Endpoint: GET /api/v2/project/user/projects/list
 */
export default function ProjectCatalogPage() {
  return (
    <Suspense fallback={<AndamioPageLoading variant="cards" />}>
      <ProjectCatalogContent />
    </Suspense>
  );
}

function ProjectCatalogContent() {
  const { data: projects, isLoading, error } = useProjects();
  const { isAuthenticated } = useAndamioAuth();
  const searchParams = useSearchParams();

  // Filter state — initialize from URL search params if present (e.g. ?filter=qualified)
  const initialFilter = searchParams.get("filter") as EligibilityFilter | null;
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>(
    initialFilter && ["all", "qualified", "in-progress", "open"].includes(initialFilter)
      ? initialFilter
      : "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Collect all unique prerequisite course IDs across projects
  const allPrereqCourseIds = useMemo(() => {
    if (!projects?.length) return [];
    const ids = new Set<string>();
    for (const project of projects) {
      for (const prereq of project.prerequisites ?? []) {
        if (prereq.courseId) ids.add(prereq.courseId);
      }
    }
    return Array.from(ids);
  }, [projects]);

  const { completions } = useStudentCompletionsForPrereqs(allPrereqCourseIds);

  // Derive eligibility from project prerequisites + student completions
  const eligibilityMap = useMemo(() => {
    const map = new Map<string, EligibilityResult>();
    if (!projects?.length) return map;

    for (const project of projects) {
      if (!project.projectId) continue;
      const result = checkProjectEligibility(project.prerequisites ?? [], completions);
      map.set(project.projectId, result);
    }
    return map;
  }, [projects, completions]);

  // Extract unique categories from projects
  const categories = useMemo(() => {
    if (!projects?.length) return [];
    const cats = new Set<string>();
    for (const project of projects) {
      if (project.category) cats.add(project.category);
    }
    return Array.from(cats).sort();
  }, [projects]);

  // Apply filters
  const filteredProjects = useMemo(() => {
    if (!projects?.length) return [];

    return projects.filter((project) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = project.title?.toLowerCase().includes(q);
        const descMatch = project.description?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        if (project.category !== categoryFilter) return false;
      }

      // Eligibility filter (only applies when authenticated)
      if (isAuthenticated && eligibilityFilter !== "all" && project.projectId) {
        const eligibility = eligibilityMap.get(project.projectId);
        if (!eligibility) return false;

        switch (eligibilityFilter) {
          case "qualified":
            if (!eligibility.eligible) return false;
            break;
          case "in-progress":
            if (eligibility.eligible || eligibility.totalCompleted === 0) return false;
            break;
          case "open":
            if (eligibility.totalRequired !== 0) return false;
            break;
        }
      }

      return true;
    });
  }, [projects, searchQuery, categoryFilter, eligibilityFilter, isAuthenticated, eligibilityMap]);

  // Stats
  const qualifiedCount = isAuthenticated
    ? Array.from(eligibilityMap.values()).filter((e) => e.eligible).length
    : 0;

  const hasActiveFilters = searchQuery.trim() !== "" || eligibilityFilter !== "all" || categoryFilter !== "all";

  if (isLoading) {
    return <AndamioPageLoading variant="cards" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Projects"
          description="Browse all published projects"
        />
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Projects"
          description="Browse all published projects"
        />
        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Published Projects"
          description="There are currently no published projects available. Check back later."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioPageHeader
        title="Projects"
        description={isAuthenticated
          ? "Browse projects and see which ones you qualify for based on your completed courses."
          : "Browse all published projects. Connect your wallet to see eligibility."
        }
      />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <AndamioBadge variant="secondary" className="text-sm px-3 py-1.5">
          <ProjectIcon className="h-4 w-4 mr-1.5" />
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </AndamioBadge>
        {isAuthenticated && qualifiedCount > 0 && (
          <AndamioBadge variant="outline" className="text-sm px-3 py-1.5 text-primary border-primary/30">
            <CredentialIcon className="h-4 w-4 mr-1.5" />
            {qualifiedCount} qualified
          </AndamioBadge>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <AndamioInput
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Eligibility filters (only when authenticated) */}
          {isAuthenticated && (
            <>
              <FilterButton
                label="All"
                active={eligibilityFilter === "all"}
                onClick={() => setEligibilityFilter("all")}
              />
              <FilterButton
                label="Qualified"
                active={eligibilityFilter === "qualified"}
                onClick={() => setEligibilityFilter("qualified")}
              />
              <FilterButton
                label="In Progress"
                active={eligibilityFilter === "in-progress"}
                onClick={() => setEligibilityFilter("in-progress")}
              />
              <FilterButton
                label="Open to All"
                active={eligibilityFilter === "open"}
                onClick={() => setEligibilityFilter("open")}
              />
            </>
          )}

          {/* Category filter */}
          {categories.length > 0 && (
            <>
              {isAuthenticated && <div className="w-px bg-border mx-1" />}
              <FilterButton
                label="All Categories"
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {categories.map((cat) => (
                <FilterButton
                  key={cat}
                  label={cat}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                />
              ))}
            </>
          )}
        </div>

        {/* Active filter count + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <AndamioText variant="small" className="text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </AndamioText>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearchQuery("");
                setEligibilityFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Project cards grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              eligibility={project.projectId ? eligibilityMap.get(project.projectId) : undefined}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Matching Projects"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      )}
    </div>
  );
}

// =============================================================================
// FilterButton
// =============================================================================

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "secondary" : "outline"}
      size="sm"
      className={`h-7 text-xs ${active ? "font-medium" : ""}`}
      onClick={onClick}
    >
      {active && <SuccessIcon className="h-3 w-3 mr-1" />}
      {label}
    </Button>
  );
}
