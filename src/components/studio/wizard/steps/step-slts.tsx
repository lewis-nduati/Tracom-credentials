"use client";

import React, { useState, useCallback, useId } from "react";
import { DeleteIcon, EditIcon, CompletedIcon, CloseIcon, AddIcon, SLTIcon, DragHandleIcon, LockedIcon } from "~/components/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWizard } from "../module-wizard";
import { WizardStep } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { cn } from "~/lib/utils";
import type { WizardStepConfig } from "../types";
import type { SLTDraft } from "~/stores/module-draft-store";
import { AndamioInput } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioErrorAlert } from "~/components/andamio";

interface StepSLTsProps {
  config: WizardStepConfig;
  direction: number;
}

/**
 * StepSLTs - Define learning targets with "I can..." statements
 *
 * Uses the draft store for optimistic updates.
 * Changes are saved automatically when navigating to the next step.
 */
export function StepSLTs({ config, direction }: StepSLTsProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    moduleCode,
    // Draft store actions
    draftSlts,
    addSlt,
    updateSlt,
    deleteSlt,
    reorderSlts,
    isDirty,
    isSaving,
    lastError,
  } = useWizard();
  const inputId = useId();

  // Check if SLTs are locked (module is approved or on-chain)
  const moduleStatus = data.courseModule?.status;
  const isApproved = moduleStatus === "approved";
  const isPendingTx = moduleStatus === "pending_tx";
  const isActive = moduleStatus === "active";
  const isLocked = isApproved || isPendingTx || isActive;

  // Use draft SLTs if available, otherwise fall back to data.slts
  const slts: SLTDraft[] = draftSlts ?? data.slts.map((slt, idx) => ({
    id: slt.id,
    _localId: `slt-fallback-${idx}`,
    sltText: slt.sltText ?? "",
    moduleIndex: slt.moduleIndex ?? idx + 1,
  }));

  // Local UI state
  const [newSltText, setNewSltText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const canProceed = slts.length > 0;

  /**
   * Create new SLT - uses draft store for optimistic update
   */
  const handleCreate = useCallback(() => {
    if (!newSltText.trim() || !addSlt) return;

    addSlt(newSltText.trim());
    setNewSltText("");
  }, [newSltText, addSlt]);

  /**
   * Update SLT - uses draft store for optimistic update
   */
  const handleUpdate = useCallback((moduleIndex: number) => {
    if (!editingText.trim() || !updateSlt) return;

    updateSlt(moduleIndex, editingText.trim());
    setEditingIndex(null);
    setEditingText("");
  }, [editingText, updateSlt]);

  /**
   * Delete SLT - uses draft store for optimistic update
   */
  const handleDelete = useCallback((moduleIndex: number) => {
    if (!deleteSlt) return;
    deleteSlt(moduleIndex);
  }, [deleteSlt]);

  const startEditing = (slt: SLTDraft) => {
    setEditingIndex(slt.moduleIndex);
    setEditingText(slt.sltText);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSltText.trim()) {
      handleCreate();
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end - reorder SLTs using draft store
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !reorderSlts) return;

    // Find items by _localId (stable identifier for DnD)
    const oldArrayIndex = slts.findIndex((s) => s._localId === active.id);
    const newArrayIndex = slts.findIndex((s) => s._localId === over.id);
    if (oldArrayIndex === -1 || newArrayIndex === -1) return;
    if (oldArrayIndex === newArrayIndex) return;

    // Reorder the array
    const reorderedArray = arrayMove(slts, oldArrayIndex, newArrayIndex);

    // Build the new order as array of current moduleIndex values
    const newOrder = reorderedArray.map((slt) => slt.moduleIndex);
    reorderSlts(newOrder);
  }, [slts, reorderSlts]);

  return (
    <WizardStep config={config} direction={direction}>
      <div className="space-y-6">
        {/* Input Section or Locked Notice */}
        {isLocked ? (
          <div className="rounded-sm border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <LockedIcon className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
              <div className="space-y-1">
                {isActive && (
                  <>
                    <AndamioText className="font-medium text-primary">On-Chain Learning Targets</AndamioText>
                    <AndamioText variant="small">
                      These Learning Targets are verified on-chain and cannot be modified.
                    </AndamioText>
                  </>
                )}
                {isPendingTx && (
                  <>
                    <AndamioText className="font-medium text-primary">Publishing...</AndamioText>
                    <AndamioText variant="small">
                      Learning Targets are locked while the transaction is processing.
                    </AndamioText>
                  </>
                )}
                {isApproved && (
                  <>
                    <AndamioText className="font-medium text-primary">Ready to Publish</AndamioText>
                    <AndamioText variant="small">
                      Learning Targets are locked. To edit, return this module to Draft.
                    </AndamioText>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-sm border-2 border-border p-4">
            <div className="flex items-center gap-3">
              <AndamioInput
                id={inputId}
                value={newSltText}
                onChange={(e) => setNewSltText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Explain how smart contracts execute on-chain"
                className="h-12 flex-1 text-base px-4"
                disabled={isSaving}
              />
              <AndamioButton
                onClick={handleCreate}
                disabled={!newSltText.trim() || isSaving}
                className="h-11 px-5"
              >
                <AddIcon className="h-4 w-4 mr-2" />
                Add
              </AndamioButton>
            </div>
          </div>
        )}

        {/* Error display */}
        {lastError && <AndamioErrorAlert error={lastError} />}

        {/* Dirty indicator */}
        {isDirty && !isSaving && (
          <div className="text-xs text-muted-foreground">
            Changes will be saved when you continue to the next step.
          </div>
        )}

        {/* SLT List */}
        {slts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <SLTIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <AndamioText variant="muted">
              Add your first learning target above
            </AndamioText>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slts.map((s) => s._localId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {slts.filter((slt) => !slt._isDeleted).map((slt) => (
                  <SortableSltItem
                    key={slt._localId}
                    slt={slt}
                    moduleCode={moduleCode}
                    isEditing={editingIndex === slt.moduleIndex}
                    isLocked={isLocked}
                    editingText={editingText}
                    onEditingTextChange={setEditingText}
                    onStartEditing={() => startEditing(slt)}
                    onCancelEditing={cancelEditing}
                    onUpdate={() => handleUpdate(slt.moduleIndex)}
                    onDelete={() => handleDelete(slt.moduleIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <WizardNavigation
        onPrevious={goPrevious}
        onNext={goNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel="Design the Assignment"
        isLoading={isSaving}
      />
    </WizardStep>
  );
}

/**
 * Sortable SLT Item Component
 */
interface SortableSltItemProps {
  slt: SLTDraft;
  moduleCode: string;
  isEditing: boolean;
  isLocked: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

function SortableSltItem({
  slt,
  moduleCode,
  isEditing,
  isLocked,
  editingText,
  onEditingTextChange,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
}: SortableSltItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slt._localId, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isNew = slt._isNew;
  const isModified = slt._isModified;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-sm border transition-all duration-150",
        isDragging
          ? "border-primary bg-primary/5 shadow-lg z-50"
          : isEditing
            ? "border-primary bg-primary/5"
            : isNew
              ? "border-primary/50 bg-primary/5"
              : isModified
                ? "border-secondary/50 bg-secondary/5"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
      )}
    >
      {/* Drag handle - hidden when locked */}
      {!isLocked && (
        <button
          type="button"
          className={cn(
            "flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors",
            isDragging && "cursor-grabbing"
          )}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon className="h-4 w-4" />
        </button>
      )}

      {/* SLT Reference: <module-code>.<moduleIndex> */}
      <span className={cn(
        "flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono font-medium",
        isNew ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
      )}>
        {moduleCode}.{slt.moduleIndex}
        {isNew && <span className="ml-1 text-[10px]">(new)</span>}
      </span>

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <AndamioInput
            value={editingText}
            onChange={(e) => onEditingTextChange(e.target.value)}
            className="h-9 flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEditing();
            }}
          />
          <AndamioButton
            size="icon"
            variant="ghost"
            onClick={onUpdate}
            disabled={!editingText.trim()}
            className="h-8 w-8 text-primary hover:text-primary"
          >
            <CompletedIcon className="h-4 w-4" />
          </AndamioButton>
          <AndamioButton
            size="icon"
            variant="ghost"
            onClick={onCancelEditing}
            className="h-8 w-8"
          >
            <CloseIcon className="h-4 w-4" />
          </AndamioButton>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">
            {slt.sltText}
          </span>
          {/* Edit/Delete buttons - hidden when locked */}
          {!isLocked && (
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <AndamioButton
                size="icon"
                variant="ghost"
                onClick={onStartEditing}
                className="h-7 w-7"
              >
                <EditIcon className="h-3.5 w-3.5" />
              </AndamioButton>
              <AndamioButton
                size="icon"
                variant="ghost"
                onClick={onDelete}
                className="h-7 w-7 hover:text-destructive"
              >
                <DeleteIcon className="h-3.5 w-3.5" />
              </AndamioButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
