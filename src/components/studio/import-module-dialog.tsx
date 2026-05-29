"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogDescription,
  AndamioDialogFooter,
} from "~/components/andamio/andamio-dialog";
import {
  AndamioButton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioBadge,
  AndamioText,
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
} from "~/components/icons";
import { parseModuleFolder, validateParsedModule } from "~/lib/import-parser";
import type { ParsedModule, ValidationResult } from "~/lib/import-parser";
import { useImportModule } from "~/hooks/api/course/use-import-module";
import { cn } from "~/lib/utils";

type ImportState =
  | { type: "idle" }
  | { type: "parsing" }
  | { type: "preview"; parsed: ParsedModule; validation: ValidationResult }
  | { type: "importing" }
  | { type: "success"; moduleCode: string; wasUpdate: boolean }
  | { type: "error"; message: string };

interface ImportModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function ImportModuleDialog({
  open,
  onOpenChange,
  courseId,
}: ImportModuleDialogProps) {
  const router = useRouter();
  const importModule = useImportModule();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ type: "idle" });

  const reset = useCallback(() => {
    setState({ type: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset]
  );

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
    if (state.type !== "preview") return;
    setState({ type: "importing" });
    try {
      const result = await importModule.mutateAsync({
        courseId,
        parsed: state.parsed,
      });
      if (result.success) {
        setState({ type: "success", moduleCode: result.moduleCode, wasUpdate: result.wasUpdate });
      } else {
        setState({ type: "error", message: result.error ?? "Import failed" });
      }
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Import failed",
      });
    }
  }, [state, courseId, importModule]);

  const handleOpenModule = useCallback(() => {
    if (state.type !== "success") return;
    router.push(`/studio/course/${courseId}/${state.moduleCode}`);
    onOpenChange(false);
  }, [state, courseId, router, onOpenChange]);

  return (
    <AndamioDialog open={open} onOpenChange={handleOpenChange}>
      <AndamioDialogContent className="max-w-md">
        <AndamioDialogHeader>
          <AndamioDialogTitle className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-primary" />
            Import module
          </AndamioDialogTitle>
          <AndamioDialogDescription>
            Select a compiled module folder to import its content.
          </AndamioDialogDescription>
        </AndamioDialogHeader>

        <div className="py-2 space-y-4">

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
            <div className="flex flex-col items-center py-8 gap-3">
              <LoadingIcon className="h-8 w-8 text-primary animate-spin" />
              <AndamioText variant="small">Reading files...</AndamioText>
            </div>
          )}

          {state.type === "preview" && (
            <>
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

              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Choose a different folder
              </button>
            </>
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
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <SuccessIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Module {state.wasUpdate ? "updated" : "imported"}
                </p>
                <AndamioText variant="small" className="text-muted-foreground">
                  {state.moduleCode} is ready to edit in the wizard
                </AndamioText>
              </div>
            </div>
          )}

          {state.type === "error" && (
            <>
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
            </>
          )}
        </div>

        <AndamioDialogFooter>
          {(state.type === "idle" || state.type === "error") && (
            <AndamioButton variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </AndamioButton>
          )}

          {state.type === "preview" && (
            <>
              <AndamioButton variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </AndamioButton>
              <AndamioButton
                onClick={() => void handleImport()}
                disabled={!state.validation.valid}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Import
              </AndamioButton>
            </>
          )}

          {state.type === "success" && (
            <>
              <AndamioButton variant="ghost" onClick={reset}>
                Import another
              </AndamioButton>
              <AndamioButton onClick={handleOpenModule}>
                Open module
              </AndamioButton>
            </>
          )}
        </AndamioDialogFooter>
      </AndamioDialogContent>
    </AndamioDialog>
  );
}
