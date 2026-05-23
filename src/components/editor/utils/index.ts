import type { Editor } from "@tiptap/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract plain text from Tiptap editor content
 */
export function extractPlainText(editor: Editor | null): string {
  if (!editor) return "";
  return editor.getText();
}

/**
 * Convert ProseMirror JSON to HTML
 */
export function proseMirrorToHtml(editor: Editor | null): string {
  if (!editor) return "";
  return editor.getHTML();
}

/**
 * Get word count from editor
 */
export function getWordCount(editor: Editor | null): number {
  if (!editor) return 0;
  const text = extractPlainText(editor);
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Get character count from editor
 */
export function getCharacterCount(editor: Editor | null): number {
  if (!editor) return 0;
  return extractPlainText(editor).length;
}

/**
 * Check if editor is empty
 */
export function isEditorEmpty(editor: Editor | null): boolean {
  if (!editor) return true;
  return editor.isEmpty;
}
