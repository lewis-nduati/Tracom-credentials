"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTeacherCourses } from "~/hooks/api";
import { useImportModule } from "~/hooks/api/course/use-import-module";
import { parseModuleFolder, validateParsedModule } from "~/lib/import-parser";
import type { ParsedModule, ValidationResult } from "~/lib/import-parser";
import { useStudioHeader } from "~/components/layout/studio-header";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import {
  AndamioButton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioBadge,
  AndamioText,
  AndamioHeading,
} from "~/components/andamio";
import {
  FolderIcon,
  UploadIcon,
  LoadingIcon,
  SuccessIcon,
  AlertIcon,
  SLTIcon,
  LessonIcon,
  AssignmentIcon,
  IntroductionIcon,
  CourseIcon,
  NextIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";
import { useEffect } from "react";

// =============================================================================
// Types
// =============================================================================

type ImportState =
  | { type: "idle" }
  | { type: "parsing" }
  | { type: "preview"; parsed: ParsedModule; validation: ValidationResult }
  | { type: "importing" }
  | { type: "success"; moduleCode: string; courseId: string; wasUpdate: boolean }
  | { type: "error"; message: string };

// =============================================================================
// Page
// =============================================================================

export default function ImportModulePage() {
  const router = useRouter();
  const { setTitle, setBreadcrumbs, setActions } = useStudioHeader();
  const { data: courses = [], isLoading: coursesLoading } = useTeacherCourses();
  const importModule = useImportModule();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [state, setState] = useState<ImportState>({ type: "idle" });

  useEffect(() => {
    setTitle("Import Module");
    setBreadcrumbs([
      { label: "Studio", href: "/studio" },
      { label: "Import Module" },
    ]);
    setActions(null);
  }, [setTitle, setBreadcrumbs, setActions]);

  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId);

  const reset = useCallback(() => {
    setState({ type: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setState({ type: "parsing" });
    try {
      const parsed = await parseModuleFolder(Array.from(files));
      const validation = validateParsedModule(parsed);
      setState({ type: "preview", parsed, validation });
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to parse folder",
      });
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (state.type !== "preview" || !selectedCourseId) return;
    setState({ type: "importing" });
    try {
      const result = await importModule.mutateAsync({
        courseId: selectedCourseId,
        parsed: state.parsed,
      });
      if (result.success) {
        setState({
          type: "success",
          moduleCode: result.moduleCode,
          courseId: selectedCourseId,
          wasUpdate: result.wasUpdate,
        });
      } else {
        setState({ type: "error", message: result.error ?? "Import failed" });
      }
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Import failed",
      });
    }
  }, [state, selectedCourseId, importModule]);

  return (
    <AndamioScrollArea className="h-full">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-8">

        <div>
          <AndamioHeading level={1} size="2xl" className="mb-1">Import module</AndamioHeading>
          <AndamioText variant="muted">
            Upload a compiled module folder, then choose which course to import it into.
          </AndamioText>
        </div>

        {/* Step 1 — Upload folder */}
        {(state.type === "idle" || state.type === "parsing") && (
          <section className="space-y-3">
            <p className="text-sm font-medium">1. Upload module folder</p>

            {state.type === "idle" && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <FolderIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Select a module folder</p>
                  <p className="text-xs text-muted-foreground">
                    Folder must contain <code className="font-mono">outline.md</code> plus any lesson, introduction, or assignment files
                  </p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  // @ts-expect-error webkitdirectory is not typed
                  webkitdirectory=""
                  multiple
                  onChange={(e) => void handleFilesSelected(e.target.files)}
                />
              </>
            )}

            {state.type === "parsing" && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <LoadingIcon className="h-5 w-5 text-primary animate-spin" />
                <AndamioText variant="small">Reading files...</AndamioText>
              </div>
            )}
          </section>
        )}

        {/* Step 2 — Preview, choose course, import */}
        {state.type === "preview" && (
          <section className="space-y-6">
            {/* Module preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Module preview</p>
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{state.parsed.outline.title}</p>
                    <code className="text-xs text-muted-foreground font-mono">
                      {state.parsed.outline.code}
                    </code>
                  </div>
                  <AndamioBadge
                    variant={state.validation.valid ? "default" : "destructive"}
                    className="text-[10px] flex-shrink-0"
                  >
                    {state.validation.valid ? "Ready" : "Has errors"}
                  </AndamioBadge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={cn(
                    "flex items-center gap-1.5",
                    state.parsed.outline.slts.length > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <SLTIcon className="h-3.5 w-3.5" />
                    {state.parsed.outline.slts.length} learning targets
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5",
                    state.parsed.lessons.length > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <LessonIcon className="h-3.5 w-3.5" />
                    {state.parsed.lessons.length} lessons
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5",
                    state.parsed.introduction ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <IntroductionIcon className="h-3.5 w-3.5" />
                    {state.parsed.introduction ? "Introduction" : "No introduction"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5",
                    state.parsed.assignment ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <AssignmentIcon className="h-3.5 w-3.5" />
                    {state.parsed.assignment ? "Assignment" : "No assignment"}
                  </div>
                </div>
              </div>

              {state.validation.errors.length > 0 && (
                <AndamioAlert variant="destructive">
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    <ul className="text-xs space-y-1">
                      {state.validation.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}

              {state.validation.warnings.length > 0 && (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    <ul className="text-xs space-y-1">
                      {state.validation.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}
            </div>

            {/* Choose destination course */}
            <div className="space-y-3">
              <p className="text-sm font-medium">2. Choose destination course</p>

              {coursesLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <LoadingIcon className="h-4 w-4 animate-spin" />
                  Loading courses...
                </div>
              )}

              {!coursesLoading && courses.length === 0 && (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    No courses found. Create a course first, then import this module into it.
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}

              <div className="space-y-1.5">
                {courses.map((course) => (
                  <button
                    key={course.courseId}
                    type="button"
                    onClick={() => setSelectedCourseId(course.courseId)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-all",
                      selectedCourseId === course.courseId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
                      selectedCourseId === course.courseId ? "bg-primary/10" : "bg-muted"
                    )}>
                      <CourseIcon className={cn(
                        "h-4 w-4",
                        selectedCourseId === course.courseId ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="text-sm font-medium flex-1 truncate">
                      {course.title ?? "Untitled Course"}
                    </span>
                    {selectedCourseId === course.courseId && (
                      <NextIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Import controls */}
            <div className="flex items-center gap-3">
              <AndamioButton
                onClick={() => void handleImport()}
                disabled={!state.validation.valid || !selectedCourseId}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                {selectedCourseId
                  ? `Import into ${selectedCourse?.title ?? "course"}`
                  : "Choose a course above"}
              </AndamioButton>
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Choose a different folder
              </button>
            </div>
          </section>
        )}

        {state.type === "importing" && (
          <div className="flex flex-col items-center py-8 gap-3">
            <LoadingIcon className="h-8 w-8 text-primary animate-spin" />
            <AndamioText variant="small">Importing module...</AndamioText>
            <AndamioText variant="small" className="text-muted-foreground text-xs">
              Converting content and saving to database
            </AndamioText>
          </div>
        )}

        {state.type === "success" && (
          <div className="rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <SuccessIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Module {state.wasUpdate ? "updated" : "imported"}
                </p>
                <AndamioText variant="small" className="text-muted-foreground">
                  {state.moduleCode} is ready to edit
                </AndamioText>
              </div>
            </div>
            <div className="flex gap-2">
              <AndamioButton
                onClick={() => router.push(`/studio/course/${state.courseId}/${state.moduleCode}`)}
              >
                Open module
              </AndamioButton>
              <AndamioButton variant="ghost" onClick={reset}>
                Import another
              </AndamioButton>
            </div>
          </div>
        )}

        {state.type === "error" && (
          <div className="space-y-3">
            <AndamioAlert variant="destructive">
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertDescription className="text-xs">
                {state.message}
              </AndamioAlertDescription>
            </AndamioAlert>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

      </div>
    </AndamioScrollArea>
  );
}
