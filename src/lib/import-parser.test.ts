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

describe("parseOutline — Coach compile output", () => {
  // Coach's compile skill writes title and code into YAML frontmatter and
  // explicitly tells authors NOT to add a `# Title` heading. Before this was
  // supported, every Coach-compiled module failed with "Module title is
  // required" and could not be imported at all.
  it("reads title and code from frontmatter with no # heading", () => {
    const md = [
      "---",
      "title: Your On-Chain Identity",
      'code: "101"',
      "---",
      "",
      "## SLTs",
      "",
      "1. I can mint an access token.",
      "2. I can explain what the token proves.",
    ].join("\n");

    const outline = parseOutline(md);
    assert.equal(outline.title, "Your On-Chain Identity");
    assert.equal(outline.code, "101");
    assert.deepEqual(outline.slts, [
      "I can mint an access token.",
      "I can explain what the token proves.",
    ]);
  });

  it("accepts an unquoted numeric code from frontmatter", () => {
    const md = ["---", "title: Browsing Courses", "code: 102", "---", "", "## SLTs", "", "- I can find a course."].join("\n");
    const outline = parseOutline(md);
    assert.equal(outline.code, "102");
    assert.deepEqual(outline.slts, ["I can find a course."]);
  });

  it("accepts a slug code, as the compile skill allows", () => {
    const md = ["---", "title: Intro to Cardano", "code: intro-cardano", "---", "", "## SLTs", "", "1. I can define a UTxO."].join("\n");
    assert.equal(parseOutline(md).code, "intro-cardano");
  });

  it("still parses a hand-written outline that uses a # heading", () => {
    const md = [
      "# Chemical Safety Basics",
      "",
      "code: SAFETY-101",
      "",
      "## SLTs",
      "",
      "1. I can identify the four hazard classes.",
    ].join("\n");

    const outline = parseOutline(md);
    assert.equal(outline.title, "Chemical Safety Basics");
    assert.equal(outline.code, "SAFETY-101");
    assert.deepEqual(outline.slts, ["I can identify the four hazard classes."]);
  });

  it("prefers the frontmatter title when a body heading is also present", () => {
    const md = ["---", "title: Canonical Title", "code: 201", "---", "", "# Leftover Heading", "", "## SLTs", "", "1. I can do the thing."].join("\n");
    assert.equal(parseOutline(md).title, "Canonical Title");
  });

  it("does not treat a horizontal rule as frontmatter", () => {
    const md = ["# Real Title", "", "code: HR-1", "", "---", "", "## SLTs", "", "1. I can survive a horizontal rule."].join("\n");
    const outline = parseOutline(md);
    assert.equal(outline.title, "Real Title");
    assert.equal(outline.code, "HR-1");
  });

  it("still throws when frontmatter carries no title", () => {
    const md = ["---", 'code: "301"', "---", "", "## SLTs", "", "1. I can fail loudly."].join("\n");
    assert.throws(() => parseOutline(md), ImportParseError);
  });
});
