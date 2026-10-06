import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio } from "~/lib/oklch";

const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

/** Last value of a custom property inside the first `selector { … }` block. */
function token(selector: ":root" | ".dark", name: string): string {
  const start = css.indexOf(`\n${selector} {`);
  assert.ok(start >= 0, `${selector} block not found`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const matches = [...block.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))];
  assert.ok(matches.length > 0, `--${name} not set in ${selector}`);
  return matches[matches.length - 1]![1]!.trim();
}

const AA = 4.5;
const pairs: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["secondary-foreground", "secondary"],
  ["sidebar-foreground", "sidebar"],
];

for (const theme of [":root", ".dark"] as const) {
  describe(`tokens in ${theme}`, () => {
    for (const [fg, bg] of pairs) {
      it(`${fg} on ${bg} meets AA`, () => {
        const ratio = contrastRatio(token(theme, fg), token(theme, bg));
        assert.ok(ratio >= AA, `${fg} on ${bg}: ${ratio.toFixed(2)} < ${AA}`);
      });
    }
  });
}

describe("paper look", () => {
  it("light background is warm paper, not pure white", () => {
    assert.notEqual(token(":root", "background"), "oklch(1 0 0)");
  });

  it("light primary is brand navy", () => {
    assert.equal(token(":root", "primary"), "oklch(0.282 0.09 252)");
  });
});
