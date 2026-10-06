import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseOklch, contrastRatio } from "./oklch";

describe("parseOklch", () => {
  it("reads lightness, chroma and hue", () => {
    assert.deepEqual(parseOklch("oklch(0.282 0.09 252)"), { l: 0.282, c: 0.09, h: 252 });
  });

  it("rejects anything that is not oklch", () => {
    assert.throws(() => parseOklch("#ffffff"));
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    const ratio = contrastRatio("oklch(0 0 0)", "oklch(1 0 0)");
    assert.ok(Math.abs(ratio - 21) < 0.1, `got ${ratio}`);
  });

  it("is 1 for a colour against itself", () => {
    const ratio = contrastRatio("oklch(0.5 0.1 250)", "oklch(0.5 0.1 250)");
    assert.ok(Math.abs(ratio - 1) < 0.01, `got ${ratio}`);
  });

  it("puts brand navy on white well above AA", () => {
    assert.ok(contrastRatio("oklch(0.282 0.09 252)", "oklch(1 0 0)") > 10);
  });
});
