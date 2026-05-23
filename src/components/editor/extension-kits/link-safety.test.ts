import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isAllowedLinkUri } from "./link-safety";

// Mocked `defaultValidate` lets us isolate the helper's own defense from
// Tiptap's built-in protocol filter. `accept` / `reject` at the call site
// makes each scenario's intent obvious.
const accept = () => true;
const reject = () => false;

describe("isAllowedLinkUri — happy path", () => {
  it("accepts https when defaultValidate accepts", () => {
    assert.equal(
      isAllowedLinkUri("https://example.com", { defaultValidate: accept }),
      true,
    );
  });

  it("accepts mailto when defaultValidate accepts", () => {
    assert.equal(
      isAllowedLinkUri("mailto:user@example.com", { defaultValidate: accept }),
      true,
    );
  });
});

describe("isAllowedLinkUri — belt-and-braces against permissive defaultValidate", () => {
  it("rejects javascript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("javascript:alert(1)", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects mixed-case JavaScript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("JavaScript:alert(1)", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects data: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("data:text/html,<script>alert(1)</script>", {
        defaultValidate: accept,
      }),
      false,
    );
  });

  it("rejects vbscript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("vbscript:msgbox(1)", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects newline-bypassed java\\nscript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("java\nscript:alert(1)", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects tab-prefixed \\tjavascript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("\tjavascript:alert(1)", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects zero-width-space bypass java\\u200Bscript: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("java\u200Bscript:alert(1)", {
        defaultValidate: accept,
      }),
      false,
    );
  });

  it("rejects NBSP-bypassed java\\u00A0script: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("java\u00A0script:alert(1)", {
        defaultValidate: accept,
      }),
      false,
    );
  });
});

describe("isAllowedLinkUri — defensive guards", () => {
  it("rejects empty string", () => {
    assert.equal(isAllowedLinkUri("", { defaultValidate: accept }), false);
  });
});

describe("isAllowedLinkUri — explicit scheme allow-list", () => {
  it("rejects tel: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("tel:+1-555-0100", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects ftp: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("ftp://files.example.com/doc", {
        defaultValidate: accept,
      }),
      false,
    );
  });

  it("rejects sms: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("sms:+1-555-0100", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects file: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("file:///etc/passwd", { defaultValidate: accept }),
      false,
    );
  });

  it("accepts relative URL (no scheme) when defaultValidate accepts", () => {
    // Relative links are safe (same-origin) and must pass through.
    assert.equal(
      isAllowedLinkUri("/docs/page", { defaultValidate: accept }),
      true,
    );
  });

  it("accepts fragment-only URL (no scheme) when defaultValidate accepts", () => {
    assert.equal(
      isAllowedLinkUri("#section", { defaultValidate: accept }),
      true,
    );
  });
});

describe("isAllowedLinkUri — RFC 3986 scheme grammar", () => {
  // Schemes with `+`, `.`, or `-` are valid per RFC 3986 and not in our
  // allow-list. Exercise them explicitly so future regex changes to
  // SCHEME_REGEX don't silently start accepting (or start mis-rejecting as
  // relative paths) structured schemes like svn+ssh or ms-teams.
  it("rejects svn+ssh: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("svn+ssh://host/repo", { defaultValidate: accept }),
      false,
    );
  });

  it("rejects ms-teams: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("ms-teams:/l/meetup-join/xyz", {
        defaultValidate: accept,
      }),
      false,
    );
  });

  it("rejects a+b.c-d: even when defaultValidate would accept", () => {
    assert.equal(
      isAllowedLinkUri("a+b.c-d:payload", { defaultValidate: accept }),
      false,
    );
  });
});

describe("isAllowedLinkUri — belt-and-braces exercised in isolation", () => {
  // These scenarios isolate the DANGEROUS_SCHEME_REGEX branch by asserting
  // rejection when the app-level scheme narrowing path is NOT what trips —
  // e.g., a scheme that parses as `javascript` would be blocked by
  // ALLOWED_SCHEMES anyway. To really exercise only the belt-and-braces
  // regex, we pair a permissive defaultValidate with a url that is already
  // outside the allow-list; the scheme check rejects first and the regex
  // never fires. To directly hit the regex branch we'd need to invert the
  // scheme narrowing; instead we document that scheme narrowing and the
  // regex agree on `javascript:` / `data:` / `vbscript:` and assert the
  // composite outcome.
  it("rejects javascript: via scheme narrowing before regex can fire", () => {
    // Documents the ordering: ALLOWED_SCHEMES.has("javascript") is false,
    // so we return false before DANGEROUS_SCHEME_REGEX is tested. This is
    // intentional — the regex exists for cases where a future maintainer
    // broadens ALLOWED_SCHEMES or replaces the scheme check, not as the
    // primary defense.
    assert.equal(
      isAllowedLinkUri("javascript:alert(1)", { defaultValidate: accept }),
      false,
    );
  });
});

describe("isAllowedLinkUri — defaultValidate rejection is honored", () => {
  it("rejects data: when defaultValidate rejects", () => {
    assert.equal(
      isAllowedLinkUri("data:text/html,<script>alert(1)</script>", {
        defaultValidate: reject,
      }),
      false,
    );
  });

  it("rejects an otherwise-valid https URL when defaultValidate rejects", () => {
    // Proves the helper does NOT override defaultValidate on legitimate schemes.
    assert.equal(
      isAllowedLinkUri("https://evil.example", { defaultValidate: reject }),
      false,
    );
  });
});
