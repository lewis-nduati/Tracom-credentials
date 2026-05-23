"use client";

import React from "react";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import { SearchIcon, CloseIcon, GridViewIcon, ListViewIcon, TableViewIcon, SortIcon } from "~/components/icons";
import { type CourseFilter, type CourseSortConfig, type CourseViewMode, defaultCourseFilter } from "~/lib/course-filters";
import { AndamioBadge } from "~/components/andamio/andamio-badge";

interface CourseFilterToolbarProps {
  filter: CourseFilter;
  sortConfig: CourseSortConfig;
  viewMode: CourseViewMode;
  onFilterChange: (filter: CourseFilter) => void;
  onSortChange: (sortConfig: CourseSortConfig) => void;
  onViewModeChange: (viewMode: CourseViewMode) => void;
  activeFilterCount: number;
}

/**
 * Comprehensive toolbar for filtering, sorting, and changing view modes
 * Fully responsive for mobile and desktop
 */
export function CourseFilterToolbar({
  filter,
  sortConfig,
  viewMode,
  onFilterChange,
  onSortChange,
  onViewModeChange,
  activeFilterCount,
}: CourseFilterToolbarProps) {
  const handleResetFilters = () => {
    onFilterChange(defaultCourseFilter);
  };

  const updateFilter = (updates: Partial<CourseFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Search and View Mode */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <AndamioInput
            type="text"
            placeholder="Search courses by title, code, or description..."
            value={filter.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
            className="pl-9 pr-9"
          />
          {filter.search && (
            <button
              onClick={() => updateFilter({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 border p-1">
          <AndamioButton
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <GridViewIcon className="h-4 w-4" />
          </AndamioButton>
          <AndamioButton
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <ListViewIcon className="h-4 w-4" />
          </AndamioButton>
          <AndamioButton
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            aria-label="Table view"
          >
            <TableViewIcon className="h-4 w-4" />
          </AndamioButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Publication Status */}
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
          <AndamioSelect
            value={filter.publicationStatus}
            onValueChange={(value) =>
              updateFilter({ publicationStatus: value as CourseFilter["publicationStatus"] })
            }
          >
            <AndamioSelectTrigger className="w-full">
              <AndamioSelectValue placeholder="Publication Status" />
            </AndamioSelectTrigger>
            <AndamioSelectContent>
              <AndamioSelectItem value="all">All Courses</AndamioSelectItem>
              <AndamioSelectItem value="published">Published</AndamioSelectItem>
              <AndamioSelectItem value="draft">Draft</AndamioSelectItem>
            </AndamioSelectContent>
          </AndamioSelect>
        </div>

        {/* Sort By */}
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[220px]">
          <AndamioSelect
            value={`${sortConfig.field}-${sortConfig.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-") as [CourseSortConfig["field"], CourseSortConfig["direction"]];
              onSortChange({ field, direction });
            }}
          >
            <AndamioSelectTrigger className="w-full">
              <SortIcon className="h-4 w-4 mr-2" />
              <AndamioSelectValue placeholder="Sort By" />
            </AndamioSelectTrigger>
            <AndamioSelectContent>
              <AndamioSelectItem value="title-asc">Title (A → Z)</AndamioSelectItem>
              <AndamioSelectItem value="title-desc">Title (Z → A)</AndamioSelectItem>
              <AndamioSelectItem value="courseCode-asc">Code (A → Z)</AndamioSelectItem>
              <AndamioSelectItem value="courseCode-desc">Code (Z → A)</AndamioSelectItem>
              <AndamioSelectItem value="moduleCount-asc">Modules (Low → High)</AndamioSelectItem>
              <AndamioSelectItem value="moduleCount-desc">Modules (High → Low)</AndamioSelectItem>
            </AndamioSelectContent>
          </AndamioSelect>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <AndamioButton variant="outline" size="sm" onClick={handleResetFilters} className="w-full sm:w-auto">
            <CloseIcon className="h-4 w-4 mr-2" />
            Clear Filters
            <AndamioBadge variant="secondary" className="ml-2">
              {activeFilterCount}
            </AndamioBadge>
          </AndamioButton>
        )}
      </div>
    </div>
  );
}
