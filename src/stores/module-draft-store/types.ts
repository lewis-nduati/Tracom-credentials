/**
 * Type definitions for Module Draft Store
 *
 * These types represent the local draft state for editing a course module.
 * They are optimized for UI editing and differ from API types.
 */

import type { JSONContent } from "@tiptap/core";

/**
 * Draft SLT (Student Learning Target)
 *
 * For new SLTs, `id` is undefined until saved to the server.
 * `_localId` provides a stable identifier for React keys during reorder/delete.
 */
export interface SLTDraft {
  /** Database ID (undefined for new SLTs) */
  id?: number;
  /** Stable local identifier for React keys */
  _localId: string;
  /** SLT text content ("I can..." statement) */
  sltText: string;
  /** 1-based index within the module */
  moduleIndex: number;
  /** Whether this SLT has been modified from server state */
  _isModified?: boolean;
  /** Whether this SLT is new (not yet on server) */
  _isNew?: boolean;
  /** Whether this SLT should be deleted on save */
  _isDeleted?: boolean;
}

/**
 * Draft Lesson content
 */
export interface LessonDraft {
  /** Database ID (undefined for new lessons) */
  id?: number;
  /** Lesson title */
  title: string;
  /** Lesson description */
  description?: string;
  /** TipTap JSON content */
  contentJson?: JSONContent | null;
  /** SLT index this lesson is linked to (1-based) */
  sltIndex: number;
  /** Image URL */
  imageUrl?: string;
  /** Video URL */
  videoUrl?: string;
  /** Whether this lesson has been modified */
  _isModified?: boolean;
  /** Whether this lesson is new (not yet on server) */
  _isNew?: boolean;
}

/**
 * Draft Assignment content
 */
export interface AssignmentDraft {
  /** Database ID (undefined for new assignments) */
  id?: number;
  /** Assignment title */
  title: string;
  /** Assignment description */
  description?: string;
  /** TipTap JSON content */
  contentJson?: JSONContent | null;
  /** Image URL */
  imageUrl?: string;
  /** Video URL */
  videoUrl?: string;
  /** Whether this assignment has been modified */
  _isModified?: boolean;
  /** Whether this assignment is new (not yet on server) */
  _isNew?: boolean;
  /** Whether this assignment should be deleted on save */
  _isDeleted?: boolean;
}

/**
 * Draft Introduction content
 */
export interface IntroDraft {
  /** Database ID (undefined for new introductions) */
  id?: number;
  /** Introduction title */
  title: string;
  /** Introduction description */
  description?: string;
  /** TipTap JSON content */
  contentJson?: JSONContent | null;
  /** Image URL */
  imageUrl?: string;
  /** Video URL */
  videoUrl?: string;
  /** Whether this introduction has been modified */
  _isModified?: boolean;
  /** Whether this introduction is new (not yet on server) */
  _isNew?: boolean;
  /** Whether this introduction should be deleted on save */
  _isDeleted?: boolean;
}

/**
 * Complete draft state for a module
 *
 * Represents all editable content within a course module.
 * This is the shape of data held in local state before saving.
 */
export interface ModuleDraft {
  /** Course ID (policy ID) */
  courseId: string;
  /** Module code identifier */
  moduleCode: string;

  /** Module metadata */
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;

  /** Student Learning Targets */
  slts: SLTDraft[];
  /** Whether SLTs are locked (module is approved/on-chain) - don't send in save requests */
  _sltsLocked?: boolean;

  /** Module assignment (null means no assignment) */
  assignment: AssignmentDraft | null;
  /** Explicitly request assignment deletion (when server had one) */
  _deleteAssignment?: boolean;

  /** Module introduction (null means no introduction) */
  introduction: IntroDraft | null;
  /** Explicitly request introduction deletion (when server had one) */
  _deleteIntroduction?: boolean;

  /** Lessons keyed by SLT index */
  lessons: Map<number, LessonDraft>;
}

/**
 * Save operation result from the API
 */
export interface SaveModuleDraftResult {
  success: boolean;
  error?: string;
  /** Summary of what changed */
  changes?: {
    moduleUpdated: boolean;
    sltsCreated: number;
    sltsUpdated: number;
    sltsDeleted: number;
    sltsReordered: boolean;
    assignmentCreated: boolean;
    assignmentUpdated: boolean;
    assignmentDeleted: boolean;
    introductionCreated: boolean;
    introductionUpdated: boolean;
    introductionDeleted: boolean;
    lessonsCreated: number;
    lessonsUpdated: number;
    lessonsDeleted: number;
  };
}

/**
 * Generate a unique local ID for draft entities
 */
let localIdCounter = 0;
export function generateLocalId(prefix = "draft"): string {
  return `${prefix}-${Date.now()}-${++localIdCounter}`;
}
