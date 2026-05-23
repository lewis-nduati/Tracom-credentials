"use client";

import React, { useState, useEffect } from "react";
import {
  AndamioButton,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioText,
  AndamioActionFooter,
} from "~/components/andamio";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { ContentEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import type { Task } from "~/hooks/api/project/use-project";
import { setPreAssignment } from "~/lib/task-metadata";
import { AliasListInput } from "~/components/tx/alias-list-input";

// =============================================================================
// Types
// =============================================================================

/**
 * Values managed by the TaskForm.
 * Passed back to the parent via onSubmit.
 */
export interface TaskFormValues {
  title: string;
  content: string;
  lovelaceAmount: string;
  expirationTime: string;
  contentJson: JSONContent | null;
  preAssignedAlias: string | null;
}

export interface TaskFormProps {
  /** Existing task data to populate the form (edit mode). Omit for create mode. */
  initialTask?: Task;
  /** Called when the user submits a valid form */
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  /** Whether the parent mutation is in flight */
  isSubmitting: boolean;
  /** Label for the submit button (e.g. "Create Task", "Save Changes") */
  submitLabel: string;
  /** Cancel navigation element (typically a Link wrapping a Button) */
  cancelAction: React.ReactNode;
  /** Card header description text */
  headerDescription?: string;
}

// =============================================================================
// Component
// =============================================================================

export function TaskForm({
  initialTask,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelAction,
  headerDescription = "Fill in the task information.",
}: TaskFormProps) {
  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lovelace, setLovelace] = useState("");
  const [expirationTime, setExpirationTime] = useState("");
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);
  const [formInitialized, setFormInitialized] = useState(!initialTask);
  const [preAssignedAliases, setPreAssignedAliases] = useState<string[]>([]);
  const [isAliasValidating, setIsAliasValidating] = useState(false);

  // Populate form from existing task data (edit mode)
  useEffect(() => {
    if (!initialTask || formInitialized) return;
    setTitle(initialTask.title ?? "");
    setContent(initialTask.description ?? "");
    setLovelace(initialTask.lovelaceAmount ?? "1000000");
    setExpirationTime(initialTask.expirationTime ?? "");
    setContentJson((initialTask.contentJson as JSONContent) ?? null);
    const existingAlias = initialTask.preAssignedAlias;
    setPreAssignedAliases(existingAlias ? [existingAlias] : []);
    setFormInitialized(true);
  }, [initialTask, formInitialized]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const adaValue = lovelace ? (parseInt(lovelace) || 0) / 1_000_000 : "";

  const isValid =
    title.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAdaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setLovelace("");
      return;
    }
    // Allow only digits and a single decimal point
    if (!/^\d*\.?\d*$/.test(raw)) return;
    const ada = parseFloat(raw) || 0;
    setLovelace(Math.floor(ada * 1_000_000).toString());
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const alias = preAssignedAliases[0] ?? null;
    const finalContentJson = setPreAssignment(contentJson, alias);
    void onSubmit({
      title: title.trim(),
      content: content.trim(),
      lovelaceAmount: lovelace,
      expirationTime,
      contentJson: finalContentJson,
      preAssignedAlias: alias,
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Task Details</AndamioCardTitle>
        <AndamioCardDescription>{headerDescription}</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-0">
        {/* Section: Identity — Title + Reward/Expiration */}
        <div className="space-y-6 pb-6">
          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={100}
            />
            <AndamioText variant="small" className="text-xs">
              {title.length}/100 characters
            </AndamioText>
          </div>

          {/* Reward & Expiration — two-column on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reward (Lovelace) */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="lovelace">
              Reward Amount (ADA) *
            </AndamioLabel>
            <div className="flex items-center gap-2">
              <AndamioInput
                id="lovelace"
                type="text"
                inputMode="decimal"
                value={adaValue}
                onChange={handleAdaChange}
                onFocus={(e) => e.target.select()}
                placeholder="1"
              />
              <AndamioText variant="small">ADA</AndamioText>
            </div>
            <AndamioText variant="small" className="text-xs">
              Minimum 1 ADA ({lovelace || "0"} lovelace)
            </AndamioText>
          </div>

          {/* Expiration Time */}
          <div className="space-y-2">
            <AndamioLabel>Expiration Date *</AndamioLabel>
            <Popover>
              <PopoverTrigger asChild>
                <AndamioButton
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationTime && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationTime
                    ? format(new Date(parseInt(expirationTime)), "PPP")
                    : "Select expiration date"}
                </AndamioButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    expirationTime
                      ? new Date(parseInt(expirationTime))
                      : undefined
                  }
                  onSelect={(date) =>
                    setExpirationTime(date ? date.getTime().toString() : "")
                  }
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <AndamioText variant="small" className="text-xs">
              Task will expire at end of selected date
            </AndamioText>
          </div>
          </div>

          {/* Pre-assignment (Optional) */}
          <div className="space-y-2">
            <AliasListInput
              value={preAssignedAliases}
              onChange={(aliases) => {
                // Cap at 1 alias
                if (aliases.length > 1) {
                  setPreAssignedAliases([aliases[aliases.length - 1]!]);
                } else {
                  setPreAssignedAliases(aliases);
                }
              }}
              label="Pre-assign to (Optional)"
              placeholder="Enter contributor alias"
              onValidatingChange={setIsAliasValidating}
              helperText={
                preAssignedAliases.length > 0
                  ? `Only @${preAssignedAliases[0]} will be able to commit to this task`
                  : "Leave empty to allow any contributor. Alias is verified on-chain."
              }
            />
          </div>
        </div>

        {/* Section: Content — Description + Rich Editor */}
        <div className="space-y-6 border-t py-6">
          <div className="space-y-2">
            <AndamioLabel htmlFor="content">Description</AndamioLabel>
            <AndamioTextarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Brief description of the task"
              maxLength={360}
              rows={3}
            />
            <AndamioText variant="small" className="text-xs">
              {content.length}/360 characters
            </AndamioText>
          </div>

          <div className="space-y-2">
            <AndamioLabel>Detailed Content (Optional)</AndamioLabel>
            <AndamioText variant="small" className="text-xs mb-2">
              Add detailed instructions, examples, or resources for the task
            </AndamioText>
            <ContentEditor
              content={contentJson}
              onContentChange={setContentJson}
              minHeight="200px"
              placeholder="Add detailed task instructions..."
            />
          </div>
        </div>

        {/* Actions */}
        <AndamioActionFooter className="border-t pt-6">
          {cancelAction}
          <AndamioButton
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || isAliasValidating}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </AndamioButton>
        </AndamioActionFooter>
      </AndamioCardContent>
    </AndamioCard>
  );
}
