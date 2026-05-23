import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectMarkdown } from "./detect-markdown";

// Helpers — `strict` and `permissive` make intent obvious at the call site.
const strict = true; // hasHtml = true  → clipboard carries text/html
const permissive = false; // hasHtml = false → clipboard is plain-text only

// =============================================================================
// Floor: minimum-length gate
// =============================================================================

describe("minimum length gate", () => {
  it("rejects empty string", () => {
    assert.equal(detectMarkdown("", strict), false);
    assert.equal(detectMarkdown("", permissive), false);
  });

  it("rejects strings shorter than 4 characters", () => {
    assert.equal(detectMarkdown("# h", strict), false); // valid ATX but len 3
    assert.equal(detectMarkdown("> x", strict), false); // valid blockquote but len 3
    assert.equal(detectMarkdown("abc", permissive), false);
  });

  it("accepts strings at exactly 4 characters when signal present", () => {
    assert.equal(detectMarkdown("# hi", permissive), true); // ATX heading, len 4
  });
});

// =============================================================================
// Strong signals — strict mode (hasHtml = true)
// =============================================================================

describe("strong signals (strict mode)", () => {
  describe("ATX headings", () => {
    it("detects h1 through h6", () => {
      assert.equal(detectMarkdown("# Heading 1", strict), true);
      assert.equal(detectMarkdown("## Heading 2", strict), true);
      assert.equal(detectMarkdown("### Heading 3", strict), true);
      assert.equal(detectMarkdown("#### Heading 4", strict), true);
      assert.equal(detectMarkdown("##### Heading 5", strict), true);
      assert.equal(detectMarkdown("###### Heading 6", strict), true);
    });

    it("rejects seven-level heading (not valid markdown)", () => {
      assert.equal(detectMarkdown("####### Not a heading", strict), false);
    });

    it("rejects hash without space (hashtag, not heading)", () => {
      assert.equal(detectMarkdown("#hashtag is a tag", strict), false);
    });

    it("rejects hash followed by space but nothing else", () => {
      assert.equal(detectMarkdown("#    ", strict), false);
    });
  });

  describe("fenced code blocks", () => {
    it("detects backtick fence", () => {
      assert.equal(detectMarkdown("```\ncode\n```", strict), true);
    });

    it("detects backtick fence with language tag", () => {
      assert.equal(detectMarkdown("```typescript\nconst x = 1;\n```", strict), true);
    });

    it("detects tilde fence", () => {
      assert.equal(detectMarkdown("~~~\ncode\n~~~", strict), true);
    });
  });

  describe("blockquotes", () => {
    it("detects blockquote", () => {
      assert.equal(detectMarkdown("> This is quoted", strict), true);
    });

    it("rejects > without space or content", () => {
      assert.equal(detectMarkdown(">no space", strict), false);
      assert.equal(detectMarkdown(">    ", strict), false);
    });
  });

  describe("task lists", () => {
    it("detects unchecked task", () => {
      assert.equal(detectMarkdown("- [ ] Todo item here", strict), true);
    });

    it("detects checked task (lowercase x)", () => {
      assert.equal(detectMarkdown("- [x] Done item here", strict), true);
    });

    it("detects checked task (uppercase X)", () => {
      assert.equal(detectMarkdown("* [X] Done item here", strict), true);
    });
  });

  describe("reference link definitions", () => {
    it("detects reference link def", () => {
      assert.equal(detectMarkdown("[link]: https://example.com", strict), true);
    });
  });

  describe("setext headings", () => {
    it("detects h1 with === underline", () => {
      assert.equal(detectMarkdown("Title\n===", strict), true);
    });

    it("detects h1 with longer === underline", () => {
      assert.equal(detectMarkdown("Title\n========", strict), true);
    });

    it("does NOT detect --- as setext h2 (ambiguous with thematic break)", () => {
      assert.equal(detectMarkdown("Title\n---", strict), false);
      assert.equal(detectMarkdown("Paragraph text\n---\nMore text", strict), false);
    });

    it("rejects single = (underline too short, len < 2)", () => {
      assert.equal(detectMarkdown("Title\n=", strict), false);
    });

    it("rejects === underline after empty line", () => {
      // Empty content line can't be a heading
      assert.equal(detectMarkdown("\n===", strict), false);
    });
  });

  describe("GFM tables", () => {
    it("detects two-column table", () => {
      const table = "| Col1 | Col2 |\n| --- | --- |\n| a | b |";
      assert.equal(detectMarkdown(table, strict), true);
    });

    it("detects table with alignment markers", () => {
      const table = "| Left | Center | Right |\n| :--- | :---: | ---: |\n| a | b | c |";
      assert.equal(detectMarkdown(table, strict), true);
    });

    it("does NOT detect single-column table (separator regex requires 2+ columns)", () => {
      const table = "| Col |\n| --- |\n| val |";
      // RE_TABLE_SEPARATOR uses (+) requiring two pipe-separated cells
      assert.equal(detectMarkdown(table, strict), false);
    });

    it("rejects table-like row without separator on next line", () => {
      assert.equal(detectMarkdown("| just | some | pipes |", strict), false);
    });
  });
});

// =============================================================================
// Weak signals — strict mode needs 2+ on distinct lines
// =============================================================================

describe("weak signals (strict mode)", () => {
  it("rejects single weak signal (one bullet list item)", () => {
    assert.equal(detectMarkdown("- single item", strict), false);
  });

  it("rejects single weak signal (one ordered list item)", () => {
    assert.equal(detectMarkdown("1. single item", strict), false);
  });

  it("rejects single weak signal (one inline link)", () => {
    assert.equal(detectMarkdown("see [text](https://example.com) for details", strict), false);
  });

  it("rejects single weak signal (one bold phrase)", () => {
    assert.equal(detectMarkdown("this is **bold** text", strict), false);
  });

  it("rejects single weak signal (one italic phrase)", () => {
    assert.equal(detectMarkdown("this is *italic* text", strict), false);
  });

  it("rejects single weak signal (one inline code)", () => {
    assert.equal(detectMarkdown("run `npm install` to start", strict), false);
  });

  it("accepts two weak signals on distinct lines", () => {
    assert.equal(detectMarkdown("- first item\n- second item", strict), true);
  });

  it("accepts two different weak signals on distinct lines", () => {
    assert.equal(detectMarkdown("run `npm install` to start\n- then configure", strict), true);
  });

  it("rejects two weak patterns on the SAME line (distinct-lines rule)", () => {
    // Both bold and inline code on one line = 1 weakLine, not 2
    assert.equal(detectMarkdown("run **this** `command` now", strict), false);
  });

  it("accepts three weak signals on distinct lines", () => {
    const text = "- first item\n- second item\n1. third item";
    assert.equal(detectMarkdown(text, strict), true);
  });

  it("counts bold correctly", () => {
    assert.equal(detectMarkdown("**bold one** here\n**bold two** there", strict), true);
  });

  it("counts __dunder bold__ correctly", () => {
    assert.equal(detectMarkdown("__bold one__ here\n__bold two__ there", strict), true);
  });

  it("counts inline link as weak", () => {
    assert.equal(
      detectMarkdown(
        "See [foo](https://foo.com)\nand [bar](https://bar.com)",
        strict,
      ),
      true,
    );
  });
});

// =============================================================================
// Permissive mode (hasHtml = false) — any single signal wins
// =============================================================================

describe("permissive mode (no HTML on clipboard)", () => {
  it("accepts single strong signal", () => {
    assert.equal(detectMarkdown("# Heading here", permissive), true);
  });

  it("accepts single weak signal (bullet)", () => {
    assert.equal(detectMarkdown("- single item", permissive), true);
  });

  it("accepts single weak signal (inline code)", () => {
    assert.equal(detectMarkdown("run `npm install` to start", permissive), true);
  });

  it("accepts single weak signal (ordered list)", () => {
    assert.equal(detectMarkdown("1. single item", permissive), true);
  });

  it("rejects plain prose with no signals", () => {
    assert.equal(detectMarkdown("Just a normal sentence.", permissive), false);
  });

  it("rejects below min length even with signal", () => {
    assert.equal(detectMarkdown("# h", permissive), false); // len 3
  });
});

// =============================================================================
// CRLF handling — Windows clipboard line endings
// =============================================================================

describe("CRLF line endings", () => {
  it("detects ATX heading with CRLF", () => {
    assert.equal(detectMarkdown("# Heading\r\nsome text", strict), true);
  });

  it("detects table with CRLF line endings", () => {
    const table = "| Col1 | Col2 |\r\n| --- | --- |\r\n| a | b |";
    assert.equal(detectMarkdown(table, strict), true);
  });

  it("detects setext h1 with CRLF", () => {
    assert.equal(detectMarkdown("Title\r\n===\r\n", strict), true);
  });

  it("detects fenced code with CRLF", () => {
    assert.equal(detectMarkdown("```typescript\r\ncode\r\n```", strict), true);
  });

  it("counts weak signals correctly with CRLF", () => {
    assert.equal(detectMarkdown("- item one\r\n- item two", strict), true);
  });
});

// =============================================================================
// No-signal inputs — should always return false
// =============================================================================

describe("plain prose (no markdown signals)", () => {
  it("rejects plain English paragraph", () => {
    assert.equal(
      detectMarkdown("This is a normal paragraph with no markdown formatting at all.", strict),
      false,
    );
  });

  it("rejects multi-paragraph prose", () => {
    const text = "First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.";
    assert.equal(detectMarkdown(text, strict), false);
  });

  it("rejects whitespace-only input above min length", () => {
    assert.equal(detectMarkdown("    \n    \n    ", strict), false);
  });

  it("rejects all-newline input above min length", () => {
    assert.equal(detectMarkdown("\n\n\n\n\n", strict), false);
  });
});

// =============================================================================
// Thematic break regression — `---` must NOT trigger setext
// =============================================================================

describe("--- thematic break (setext regression)", () => {
  it("does not trigger on paragraph followed by ---", () => {
    assert.equal(detectMarkdown("Note the deadline\n---\nMeeting agenda", strict), false);
  });

  it("does not trigger on multi-paragraph with --- dividers", () => {
    const text = "Section one content\n---\nSection two content\n---\nSection three content";
    assert.equal(detectMarkdown(text, strict), false);
  });

  it("does not trigger on email-signature style ---", () => {
    assert.equal(detectMarkdown("Best regards\n---\nJohn Doe\nCEO, Acme Corp", strict), false);
  });

  it("still detects --- in permissive mode as bullet-ish (does not)", () => {
    // `---` alone doesn't match any weak or strong signal pattern:
    // - Not a bullet (no content after -)
    // - Not a heading (no # prefix)
    // - Not a setext (--- excluded)
    // So even in permissive mode, standalone `---` doesn't trigger
    assert.equal(detectMarkdown("Some text\n---", permissive), false);
  });
});

// =============================================================================
// Mixed strong + weak — strong always wins in strict mode
// =============================================================================

describe("mixed signals", () => {
  it("strong signal overrides weak-count check in strict mode", () => {
    // One ATX heading (strong) is enough even without 2 weak signals
    assert.equal(detectMarkdown("# Heading\nJust some plain text.", strict), true);
  });

  it("strong + weak signals together", () => {
    const text = "# Title\n\n- item one\n- item two\n\n> A quote";
    assert.equal(detectMarkdown(text, strict), true);
  });
});

// =============================================================================
// Real-world paste scenarios
// =============================================================================

describe("real-world scenarios", () => {
  it("detects a typical README.md snippet", () => {
    const readme = `# Installation

\`\`\`bash
npm install andamio-sdk
\`\`\`

## Usage

- Import the SDK
- Configure your API key
- Call the methods

See [documentation](https://docs.andamio.io) for details.`;
    assert.equal(detectMarkdown(readme, strict), true);
    assert.equal(detectMarkdown(readme, permissive), true);
  });

  it("detects markdown with GFM table", () => {
    const text = `## API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | /api/users | List users |
| POST | /api/users | Create user |`;
    assert.equal(detectMarkdown(text, strict), true);
  });

  it("rejects typical Slack message paste (no markdown signals)", () => {
    const slack = "Hey team, the deploy went well. Let's sync tomorrow at 10am.";
    assert.equal(detectMarkdown(slack, strict), false);
  });

  it("rejects HTML-rich paste from Google Docs (plain text is prose)", () => {
    const gdocs = "Project Overview\n\nThe Andamio platform enables contribution-centered learning on Cardano.";
    assert.equal(detectMarkdown(gdocs, strict), false);
  });

  it("detects task list from Obsidian / Notion", () => {
    const tasks = "- [x] Set up environment\n- [ ] Write tests\n- [ ] Deploy to staging";
    assert.equal(detectMarkdown(tasks, strict), true);
  });

  it("detects inline code + bullet from Stack Overflow (2 weak signals)", () => {
    const so = "Run `npm install` to get started\n- Configure your .env file";
    assert.equal(detectMarkdown(so, strict), true);
  });
});

// =============================================================================
// Known limitations (documenting current behavior, not asserting ideal)
// =============================================================================

describe("known limitations", () => {
  it("RE_BOLD misses bold with underscores (false negative)", () => {
    // **snake_case_var** fails because [^*_\n] excludes _
    // This is a known P3 limitation — documenting current behavior
    assert.equal(detectMarkdown("**snake_case_var** is a variable", strict), false);
    // But permissive mode also misses it since the regex doesn't match
    assert.equal(detectMarkdown("**snake_case_var** is a variable", permissive), false);
  });

  it("single-column table is not detected", () => {
    const table = "| Col |\n| --- |\n| val |";
    assert.equal(detectMarkdown(table, strict), false);
  });

  it("two weak signals from common web content triggers conversion (accepted trade-off)", () => {
    // This is finding #11 (advisory) — the threshold of 2 weak signals is
    // intentionally low to catch markdown-heavy technical content. The
    // trade-off: an HTML clipboard with one inline code + one bullet gets
    // routed through markdown, losing HTML formatting.
    const text = "Run `npm install` to get started\n- Configure your .env file";
    assert.equal(detectMarkdown(text, strict), true);
  });
});
