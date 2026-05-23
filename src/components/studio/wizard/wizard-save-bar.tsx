"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AlertIcon, SaveIcon, LoadingIcon, UndoIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

interface WizardSaveBarProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Callback to save changes */
  onSave: () => void;
  /** Callback to discard changes */
  onDiscard: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * WizardSaveBar - Contextual save bar for the module wizard
 *
 * Appears at the bottom of the content area when there are unsaved changes.
 * Provides prominent Save and Discard actions to prevent users from
 * navigating away without saving.
 */
export function WizardSaveBar({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  className,
}: WizardSaveBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center justify-between gap-4 rounded-sm border border-warning/30 bg-warning/5 px-4 py-3",
            className
          )}
        >
          {/* Warning message */}
          <div className="flex items-center gap-2">
            <AlertIcon className="h-4 w-4 text-warning shrink-0" />
            <AndamioText variant="small" className="font-medium text-warning-foreground">
              You have unsaved changes
            </AndamioText>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={isSaving}
              className="h-8"
            >
              <UndoIcon className="h-4 w-4 mr-1.5" />
              Discard
            </AndamioButton>
            <AndamioButton
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-8"
            >
              {isSaving ? (
                <>
                  <LoadingIcon className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-1.5" />
                  Save
                </>
              )}
            </AndamioButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
