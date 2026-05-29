/**
 * Tests for the course-module import parser.
 *
 * The compiled course content uses YAML frontmatter with quoted values
 * (code: "201"), so the outline parser must strip surrounding quotes —
 * otherwise the code fails validation and the module won't import.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseOutline,
  parseLesson,
  ImportParseError,
} from "./import-parser";

describe("parseOutline", () => {
  it("strips surrounding double quotes from a frontmatter code value", () => {
    const md = [
      '---',
      'title: "Anatomy of a POS System"',
      'code: "201"',
      '---',
      '',
      '# Anatomy of a POS System',
      '',
      '## SLTs',
      '',
      '1. Identify the components',
      '2. Describe the payment path',
      '3. Distinguish transaction types',
    ].join("\n");

    const out = parseOutline(md);
    assert.equal(out.title, "Anatomy of a POS System");
    assert.equal(out.code, "201");
    assert.deepEqual(out.slts.length, 3);
  });

  it("strips single quotes too", () => {
    const out = parseOutline("# T\ncode: '301'\n## SLTs\n1. a");
    assert.equal(out.code, "301");
  });

  it("leaves an unquoted code untouched", () => {
    const out = parseOutline("# T\ncode: MODULE-001\n## SLTs\n1. a");
    assert.equal(out.code, "MODULE-001");
  });

  it("takes the title from the first H1, not the frontmatter title line", () => {
    const out = parseOutline('title: "Frontmatter"\n# Real Title\ncode: 1\n## SLTs\n1. a');
    assert.equal(out.title, "Real Title");
  });

  it("throws when the title is missing", () => {
    assert.throws(() => parseOutline("code: 201\n## SLTs\n1. a"), ImportParseError);
  });

  it("throws when the code is missing", () => {
    assert.throws(() => parseOutline("# T\n## SLTs\n1. a"), ImportParseError);
  });
});

describe("parseLesson", () => {
  it("extracts the 1-indexed SLT index from the filename", () => {
    const lesson = parseLesson("# Lesson One\n\nBody", "lesson-1.md");
    assert.equal(lesson.sltIndex, 1);
    assert.equal(lesson.title, "Lesson One");
    assert.equal(lesson.contentMarkdown, "Body");
  });

  it("rejects lesson-0.md (lessons are 1-indexed)", () => {
    assert.throws(() => parseLesson("# X", "lesson-0.md"), ImportParseError);
  });

  it("rejects a filename that isn't lesson-N.md", () => {
    assert.throws(() => parseLesson("# X", "notes.md"), ImportParseError);
  });
});
