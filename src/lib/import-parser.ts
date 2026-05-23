/**
 * Course Module Import Parser
 *
 * Parses a folder of markdown files into a structured module format
 * that can be submitted to the course module API.
 *
 * Expected folder structure:
 * ```
 * module-folder/
 * ├── outline.md          # Required - module title, code, and SLT list
 * ├── introduction.md     # Optional - module introduction content
 * ├── assignment.md       # Optional - module assignment content
 * ├── lesson-1.md         # Optional - lesson for SLT index 1
 * ├── lesson-2.md         # Optional - lesson for SLT index 2
 * └── ...
 * ```
 *
 * See docs/plans/2026-02-25-feat-course-content-import-plan.md for format specs.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Parsed outline from outline.md
 */
export interface ParsedOutline {
  /** Module title (from first # heading) */
  title: string;
  /** Module code (from "code: VALUE" line) */
  code: string;
  /** SLT texts in order (1-indexed) */
  slts: string[];
}

/**
 * Parsed lesson from lesson-N.md
 */
export interface ParsedLesson {
  /** SLT index this lesson belongs to (1-indexed) */
  sltIndex: number;
  /** Lesson title (from first # heading) */
  title: string;
  /** Raw markdown content (excluding title heading) */
  contentMarkdown: string;
}

/**
 * Parsed content section (introduction or assignment)
 */
export interface ParsedContentSection {
  /** Section title (from first # heading) */
  title: string;
  /** Raw markdown content (excluding title heading) */
  contentMarkdown: string;
}

/**
 * Complete parsed module from folder
 */
export interface ParsedModule {
  /** Parsed outline with title, code, SLTs */
  outline: ParsedOutline;
  /** Module introduction (optional) */
  introduction?: ParsedContentSection;
  /** Module assignment (optional) */
  assignment?: ParsedContentSection;
  /** Lessons keyed by SLT index */
  lessons: ParsedLesson[];
  /** Non-fatal warnings (e.g., orphan lessons) */
  warnings: string[];
  /** Image files found in folder (relative path → File) */
  imageFiles: Map<string, File>;
}

/**
 * Validation result with errors
 */
export interface ValidationResult {
  /** Whether the module is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Parse error with context
 */
export class ImportParseError extends Error {
  constructor(
    message: string,
    public readonly filename?: string,
    public readonly line?: number
  ) {
    super(filename ? `${filename}: ${message}` : message);
    this.name = "ImportParseError";
  }
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse outline.md content to extract title, code, and SLTs
 *
 * Expected format:
 * ```markdown
 * # Module Title
 *
 * code: MODULE-CODE-001
 *
 * ## SLTs
 *
 * 1. I can explain the concept of X
 * 2. I can demonstrate Y in practice
 * 3. I can evaluate Z for correctness
 * ```
 *
 * Parsing rules:
 * - First `# Heading` = module title
 * - `code: VALUE` line (case-insensitive) = module code
 * - Numbered list under `## SLTs` heading = SLT texts
 *
 * @param content - Raw markdown content of outline.md
 * @returns Parsed outline with title, code, and SLTs
 * @throws ImportParseError if required fields are missing
 */
export function parseOutline(content: string): ParsedOutline {
  const lines = content.split("\n");

  let title = "";
  let code = "";
  const slts: string[] = [];
  let inSltsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse title from first H1
    if (!title && trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }

    // Parse code from "code: VALUE" line (case-insensitive)
    if (!code) {
      const codeMatch = /^code:\s*(.+)$/i.exec(trimmed);
      if (codeMatch?.[1]) {
        code = codeMatch[1].trim();
        continue;
      }
    }

    // Detect SLTs section
    if (trimmed.toLowerCase() === "## slts" || trimmed.toLowerCase() === "## slt") {
      inSltsSection = true;
      continue;
    }

    // Exit SLTs section on next heading
    if (inSltsSection && trimmed.startsWith("## ")) {
      inSltsSection = false;
      continue;
    }

    // Parse numbered list items in SLTs section
    if (inSltsSection) {
      // Match numbered list: "1. Text", "2. Text", etc.
      const listMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (listMatch?.[1]) {
        slts.push(listMatch[1].trim());
        continue;
      }

      // Also support bullet lists: "- Text", "* Text"
      const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);
      if (bulletMatch?.[1]) {
        slts.push(bulletMatch[1].trim());
        continue;
      }
    }
  }

  // Validate required fields
  if (!title) {
    throw new ImportParseError(
      "Missing module title. Add a # Heading at the top of the file.",
      "outline.md"
    );
  }

  if (!code) {
    throw new ImportParseError(
      "Missing module code. Add a 'code: YOUR-CODE' line.",
      "outline.md"
    );
  }

  return { title, code, slts };
}

/**
 * Parse a content section (introduction.md or assignment.md)
 *
 * Expected format:
 * ```markdown
 * # Section Title
 *
 * Content body in markdown...
 * ```
 *
 * @param content - Raw markdown content
 * @param filename - Filename for error messages
 * @returns Parsed content section with title and markdown body
 */
export function parseContentSection(
  content: string,
  filename: string
): ParsedContentSection {
  const lines = content.split("\n");

  let title = "";
  let titleLineIndex = -1;

  // Find first H1 heading
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]?.trim() ?? "";
    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      titleLineIndex = i;
      break;
    }
  }

  // Default title if not found
  if (!title) {
    title = filename.replace(".md", "").replace(/-/g, " ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    titleLineIndex = -1; // No line to skip
  }

  // Extract content after title
  const contentLines =
    titleLineIndex >= 0 ? lines.slice(titleLineIndex + 1) : lines;
  const contentMarkdown = contentLines.join("\n").trim();

  return { title, contentMarkdown };
}

/**
 * Parse a lesson file (lesson-N.md)
 *
 * Expected format:
 * ```markdown
 * # Lesson Title
 *
 * Lesson content in markdown...
 * ```
 *
 * @param content - Raw markdown content
 * @param filename - Filename (used to extract SLT index, e.g., "lesson-1.md")
 * @returns Parsed lesson with sltIndex, title, and content
 * @throws ImportParseError if filename format is invalid
 */
export function parseLesson(content: string, filename: string): ParsedLesson {
  // Extract SLT index from filename: lesson-1.md → 1
  const indexMatch = /lesson-(\d+)\.md$/i.exec(filename);
  if (!indexMatch?.[1]) {
    throw new ImportParseError(
      `Invalid lesson filename format. Expected "lesson-N.md" where N is a number.`,
      filename
    );
  }

  const sltIndex = parseInt(indexMatch[1], 10);

  // lesson-0.md is invalid (1-indexed)
  if (sltIndex < 1) {
    throw new ImportParseError(
      `Invalid lesson index 0. Lessons are 1-indexed (lesson-1.md, lesson-2.md, ...).`,
      filename
    );
  }

  const { title, contentMarkdown } = parseContentSection(content, filename);

  return {
    sltIndex,
    title,
    contentMarkdown,
  };
}

/**
 * Parse a folder of files into a complete module structure
 *
 * @param files - Array of File objects from folder upload
 * @returns Parsed module with outline, optional sections, and lessons
 * @throws ImportParseError if outline.md is missing or invalid
 */
export async function parseModuleFolder(files: File[]): Promise<ParsedModule> {
  const warnings: string[] = [];
  const imageFiles = new Map<string, File>();
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

  // Index files by lowercase name for case-insensitive matching
  const fileMap = new Map<string, File>();
  for (const file of files) {
    // Get just the filename, not the full path
    const name = file.name.toLowerCase();
    fileMap.set(name, file);

    // Check if this is an image file
    const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
    if (imageExtensions.includes(ext)) {
      // Store with relative path for matching in markdown
      // webkitRelativePath gives us "folder/assets/image.png" format
      const relativePath = file.webkitRelativePath;
      // Extract path relative to module folder (remove top folder name)
      const pathParts = relativePath.split("/");
      if (pathParts.length > 1) {
        // e.g., "module-folder/assets/img.png" → "assets/img.png"
        const relativeToModule = pathParts.slice(1).join("/");
        imageFiles.set(relativeToModule, file);
      }
    }
  }

  // Find and parse outline.md (required)
  const outlineFile = fileMap.get("outline.md");
  if (!outlineFile) {
    throw new ImportParseError(
      "Missing outline.md file. This file is required and must contain the module title, code, and SLTs."
    );
  }

  const outlineContent = await outlineFile.text();
  const outline = parseOutline(outlineContent);

  // Parse introduction.md (optional)
  let introduction: ParsedContentSection | undefined;
  const introFile = fileMap.get("introduction.md");
  if (introFile) {
    const introContent = await introFile.text();
    introduction = parseContentSection(introContent, "introduction.md");
  }

  // Parse assignment.md (optional)
  let assignment: ParsedContentSection | undefined;
  const assignmentFile = fileMap.get("assignment.md");
  if (assignmentFile) {
    const assignmentContent = await assignmentFile.text();
    assignment = parseContentSection(assignmentContent, "assignment.md");
  }

  // Parse lesson files
  const lessons: ParsedLesson[] = [];
  const lessonPattern = /^lesson-(\d+)\.md$/i;

  for (const [name, file] of fileMap) {
    if (lessonPattern.test(name)) {
      try {
        const lessonContent = await file.text();
        const lesson = parseLesson(lessonContent, file.name);
        lessons.push(lesson);
      } catch (error) {
        if (error instanceof ImportParseError) {
          warnings.push(error.message);
        } else {
          warnings.push(`Failed to parse ${file.name}: ${String(error)}`);
        }
      }
    }
  }

  // Sort lessons by SLT index
  lessons.sort((a, b) => a.sltIndex - b.sltIndex);

  // Handle orphan lessons (lessons with index > SLT count)
  const maxLessonIndex = Math.max(0, ...lessons.map((l) => l.sltIndex));
  const sltCount = outline.slts.length;

  if (maxLessonIndex > sltCount) {
    // Create placeholder SLTs for orphan lessons
    for (let i = sltCount + 1; i <= maxLessonIndex; i++) {
      const orphanLesson = lessons.find((l) => l.sltIndex === i);
      if (orphanLesson) {
        // Create placeholder SLT from lesson title
        const placeholderText = `[Imported] ${orphanLesson.title}`;
        outline.slts.push(placeholderText);
        warnings.push(
          `Created placeholder SLT #${i} for orphan lesson: ${orphanLesson.title}`
        );
      } else {
        // Create generic placeholder for gaps
        outline.slts.push(`[Placeholder SLT #${i}]`);
        warnings.push(`Created placeholder SLT #${i} to fill gap in lesson indices.`);
      }
    }
  }

  return {
    outline,
    introduction,
    assignment,
    lessons,
    warnings,
    imageFiles,
  };
}

/**
 * Validate a parsed module for completeness and correctness
 *
 * @param parsed - The parsed module to validate
 * @returns Validation result with errors and warnings
 */
export function validateParsedModule(parsed: ParsedModule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [...parsed.warnings];

  // Validate outline
  if (!parsed.outline.title) {
    errors.push("Module title is required.");
  }

  if (!parsed.outline.code) {
    errors.push("Module code is required.");
  } else {
    // Validate code format (alphanumeric, hyphens, underscores)
    const codePattern = /^[A-Za-z0-9_-]+$/;
    if (!codePattern.test(parsed.outline.code)) {
      errors.push(
        "Module code can only contain letters, numbers, hyphens, and underscores."
      );
    }
  }

  // Warn if no SLTs
  if (parsed.outline.slts.length === 0) {
    warnings.push("No SLTs defined. The module will be empty.");
  }

  // Warn if no content at all
  const hasContent =
    parsed.introduction ||
    parsed.assignment ||
    parsed.lessons.length > 0;

  if (!hasContent && parsed.outline.slts.length > 0) {
    warnings.push(
      "No content files found (introduction, assignment, or lessons). " +
        "Only the module structure will be imported."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a summary of what will be imported
 *
 * @param parsed - The parsed module
 * @returns Human-readable summary string
 */
export function getImportSummary(parsed: ParsedModule): string {
  const parts: string[] = [];

  parts.push(`Module: "${parsed.outline.title}" (${parsed.outline.code})`);
  parts.push(`SLTs: ${parsed.outline.slts.length}`);

  if (parsed.introduction) {
    parts.push("Introduction: Yes");
  }

  if (parsed.assignment) {
    parts.push("Assignment: Yes");
  }

  if (parsed.lessons.length > 0) {
    parts.push(`Lessons: ${parsed.lessons.length}`);
  }

  if (parsed.warnings.length > 0) {
    parts.push(`Warnings: ${parsed.warnings.length}`);
  }

  return parts.join(" | ");
}
