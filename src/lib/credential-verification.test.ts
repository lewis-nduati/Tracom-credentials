/**
 * Tests for public credential verification helpers.
 *
 * The parser's input is whatever a stranger pasted into a form — a bare token,
 * a link someone forwarded, a badge image URL with a query string attached by
 * an email client. It has to accept all of those and reject everything else
 * without throwing, because the caller renders a message rather than an error.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseCredentialRef,
  formatCredentialRef,
  verifyPath,
  andamioBadgeUrl,
  decodeAssetName,
  shortenHex,
} from "./credential-verification";

const POLICY = "a".repeat(56);
const ASSET = "547261636f6d"; // "Tracom"
const TOKEN = `${POLICY}.${ASSET}`;

describe("parseCredentialRef", () => {
  it("accepts a bare policy.asset token", () => {
    assert.deepEqual(parseCredentialRef(TOKEN), {
      policyId: POLICY,
      assetNameHex: ASSET,
    });
  });

  it("accepts a Tracom verification URL", () => {
    const parsed = parseCredentialRef(`https://tracom.co.ke/verify/${TOKEN}`);
    assert.deepEqual(parsed, { policyId: POLICY, assetNameHex: ASSET });
  });

  it("accepts an Andamio badge URL and drops the .svg suffix", () => {
    const parsed = parseCredentialRef(
      `https://credentials.andamio.io/badges/${TOKEN}.svg`,
    );
    assert.deepEqual(parsed, { policyId: POLICY, assetNameHex: ASSET });
  });

  it("ignores a query string and a fragment", () => {
    assert.deepEqual(parseCredentialRef(`${TOKEN}?utm_source=mail`), {
      policyId: POLICY,
      assetNameHex: ASSET,
    });
    assert.deepEqual(parseCredentialRef(`${TOKEN}#top`), {
      policyId: POLICY,
      assetNameHex: ASSET,
    });
  });

  it("tolerates surrounding whitespace and a trailing slash", () => {
    assert.deepEqual(parseCredentialRef(`  /verify/${TOKEN}/  `), {
      policyId: POLICY,
      assetNameHex: ASSET,
    });
  });

  it("normalises uppercase hex to lowercase", () => {
    const parsed = parseCredentialRef(TOKEN.toUpperCase());
    assert.deepEqual(parsed, { policyId: POLICY, assetNameHex: ASSET });
  });

  it("rejects a policy id of the wrong length", () => {
    assert.equal(parseCredentialRef(`${"a".repeat(55)}.${ASSET}`), null);
    assert.equal(parseCredentialRef(`${"a".repeat(57)}.${ASSET}`), null);
  });

  it("rejects non-hex characters in either half", () => {
    assert.equal(parseCredentialRef(`${"z".repeat(56)}.${ASSET}`), null);
    assert.equal(parseCredentialRef(`${POLICY}.zzzz`), null);
  });

  it("rejects an odd-length asset name", () => {
    assert.equal(parseCredentialRef(`${POLICY}.abc`), null);
  });

  it("rejects an empty asset name", () => {
    assert.equal(parseCredentialRef(`${POLICY}.`), null);
  });

  it("rejects an asset name longer than 32 bytes", () => {
    assert.equal(parseCredentialRef(`${POLICY}.${"ab".repeat(33)}`), null);
  });

  it("rejects a token with more than two parts rather than guessing", () => {
    assert.equal(parseCredentialRef(`${POLICY}.${ASSET}.png`), null);
  });

  it("returns null for empty, whitespace and non-string input", () => {
    assert.equal(parseCredentialRef(""), null);
    assert.equal(parseCredentialRef("   "), null);
    // @ts-expect-error exercising the runtime guard a form can hit
    assert.equal(parseCredentialRef(undefined), null);
  });
});

describe("formatting helpers", () => {
  const ref = { policyId: POLICY, assetNameHex: ASSET };

  it("round-trips a reference through format and parse", () => {
    assert.deepEqual(parseCredentialRef(formatCredentialRef(ref)), ref);
  });

  it("builds a verification path that parses back", () => {
    assert.equal(verifyPath(ref), `/verify/${TOKEN}`);
    assert.deepEqual(parseCredentialRef(verifyPath(ref)), ref);
  });

  it("builds the Andamio badge URL", () => {
    assert.equal(
      andamioBadgeUrl(ref),
      `https://credentials.andamio.io/badges/${TOKEN}.svg`,
    );
  });
});

describe("decodeAssetName", () => {
  it("decodes printable ASCII", () => {
    assert.equal(decodeAssetName("547261636f6d"), "Tracom");
  });

  it("returns null for bytes outside printable ASCII", () => {
    // A Blake2b hash prefix — not text, and must not render as mojibake.
    assert.equal(decodeAssetName("00ff1a2b"), null);
  });

  it("returns null for malformed hex", () => {
    assert.equal(decodeAssetName("abc"), null);
    assert.equal(decodeAssetName("zz"), null);
    assert.equal(decodeAssetName(""), null);
  });
});

describe("shortenHex", () => {
  it("leaves short strings alone", () => {
    assert.equal(shortenHex("abcd", 8), "abcd");
  });

  it("elides the middle of a long string", () => {
    assert.equal(shortenHex(POLICY, 4), "aaaa…aaaa");
  });

  it("returns the input unchanged when edge is not positive", () => {
    assert.equal(shortenHex(POLICY, 0), POLICY);
  });
});
