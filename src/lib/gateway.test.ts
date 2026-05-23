import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import {
  GatewayError,
  gateway,
  gatewayPost,
  gatewayAuthPost,
  gatewayAuth,
  gatewayValidated,
  gatewayAuthValidated,
  gatewayPostValidated,
  gatewayAuthPostValidated,
  isGatewayError,
  isNotFound,
  isUnauthorized,
  isForbidden,
  PROXY_BASE,
} from "./gateway";
import { ApiValidationError } from "./api-validation";

// ---- fetch stubbing ----------------------------------------------------------------

let _originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  _originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = _originalFetch;
});

function stubFetch(
  res: Response | ((url: string, init?: RequestInit) => Promise<Response>)
): void {
  globalThis.fetch =
    typeof res === "function"
      ? (res as typeof globalThis.fetch)
      : async () => res;
}

function jsonResponse(body: unknown, status = 200, statusText = "OK"): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, statusText: string, body?: unknown): Response {
  return new Response(body != null ? JSON.stringify(body) : null, {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

// ---- GatewayError ------------------------------------------------------------------

describe("GatewayError", () => {
  it("sets name, message, status, and details", () => {
    const err = new GatewayError("Something failed", 422, "Extra info");
    assert.equal(err.name, "GatewayError");
    assert.equal(err.message, "Something failed");
    assert.equal(err.status, 422);
    assert.equal(err.details, "Extra info");
    assert.ok(err instanceof Error);
    assert.ok(err instanceof GatewayError);
  });

  it("details is optional and defaults to undefined", () => {
    const err = new GatewayError("Oops", 500);
    assert.equal(err.details, undefined);
  });
});

// ---- gateway (GET) -----------------------------------------------------------------

describe("gateway", () => {
  it("returns parsed JSON on success", async () => {
    stubFetch(jsonResponse({ data: [1, 2, 3] }));
    const result = await gateway<{ data: number[] }>("/v2/test");
    assert.deepEqual(result, { data: [1, 2, 3] });
  });

  it("constructs URL from PROXY_BASE + path", async () => {
    let capturedUrl: string | undefined;
    stubFetch(async (url) => {
      capturedUrl = url;
      return jsonResponse({ ok: true });
    });
    await gateway("/v2/courses");
    assert.equal(capturedUrl, `${PROXY_BASE}/v2/courses`);
  });

  it("throws GatewayError with envelope shape {error: {message, details}}", async () => {
    stubFetch(
      errorResponse(400, "Bad Request", {
        error: { message: "Invalid param", details: "field X is required" },
      })
    );
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 400);
        assert.equal(err.message, "Invalid param");
        assert.equal(err.details, "field X is required");
        return true;
      }
    );
  });

  it("omits details when envelope details field is not a string", async () => {
    stubFetch(
      errorResponse(400, "Bad Request", {
        error: { message: "Invalid param", details: { nested: "object" } },
      })
    );
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.message, "Invalid param");
        assert.equal(err.details, undefined);
        return true;
      }
    );
  });

  it("throws GatewayError with legacy flat {details} shape", async () => {
    stubFetch(
      errorResponse(500, "Internal Server Error", { details: "DB connection lost" })
    );
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 500);
        assert.match(err.message, /500.*Internal Server Error/);
        assert.equal(err.details, "DB connection lost");
        return true;
      }
    );
  });

  it("throws GatewayError with legacy flat {message} shape when no details", async () => {
    stubFetch(errorResponse(502, "Bad Gateway", { message: "upstream timeout" }));
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.details, "upstream timeout");
        return true;
      }
    );
  });

  it("throws GatewayError with fallback message when body is not valid JSON", async () => {
    stubFetch(new Response("not json", { status: 503, statusText: "Service Unavailable" }));
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 503);
        assert.match(err.message, /503.*Service Unavailable/);
        return true;
      }
    );
  });

  it("throws GatewayError on 401", async () => {
    stubFetch(errorResponse(401, "Unauthorized", { error: { message: "Token expired" } }));
    await assert.rejects(
      () => gateway("/v2/test"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 401);
        assert.equal(err.message, "Token expired");
        return true;
      }
    );
  });

  it("throws GatewayError on 404", async () => {
    stubFetch(errorResponse(404, "Not Found", {}));
    await assert.rejects(
      () => gateway("/v2/missing"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 404);
        return true;
      }
    );
  });
});

// ---- gatewayPost -------------------------------------------------------------------

describe("gatewayPost", () => {
  it("sends POST with JSON body and Content-Type header", async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    stubFetch(async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return jsonResponse({ created: true });
    });

    await gatewayPost("/v2/course/create", { title: "My Course" });

    assert.equal(capturedUrl, `${PROXY_BASE}/v2/course/create`);
    assert.equal(capturedInit?.method, "POST");
    assert.equal(
      (capturedInit?.headers as Record<string, string>)?.["Content-Type"],
      "application/json"
    );
    assert.equal(capturedInit?.body, JSON.stringify({ title: "My Course" }));
  });

  it("sends undefined body when body argument is omitted", async () => {
    let capturedInit: RequestInit | undefined;
    stubFetch(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ ok: true });
    });

    await gatewayPost("/v2/action");
    assert.equal(capturedInit?.body, undefined);
  });

  it("returns parsed JSON on success", async () => {
    stubFetch(jsonResponse({ id: "abc" }));
    const result = await gatewayPost<{ id: string }>("/v2/create", {});
    assert.deepEqual(result, { id: "abc" });
  });

  it("throws GatewayError on 422 with envelope error shape", async () => {
    stubFetch(
      errorResponse(422, "Unprocessable Entity", { error: { message: "Validation failed" } })
    );
    await assert.rejects(
      () => gatewayPost("/v2/course/create", { title: "" }),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 422);
        assert.equal(err.message, "Validation failed");
        return true;
      }
    );
  });

  it("throws GatewayError on 500", async () => {
    stubFetch(errorResponse(500, "Internal Server Error", {}));
    await assert.rejects(
      () => gatewayPost("/v2/action", {}),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 500);
        return true;
      }
    );
  });
});

// ---- gatewayAuthPost ---------------------------------------------------------------

describe("gatewayAuthPost", () => {
  const JWT = "test.jwt.token";

  it("includes Authorization Bearer header and sets method to POST", async () => {
    let capturedInit: RequestInit | undefined;
    stubFetch(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ ok: true });
    });

    await gatewayAuthPost("/v2/protected", JWT, { action: "do-it" });

    assert.equal(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers?.["Authorization"], `Bearer ${JWT}`);
    assert.equal(headers?.["Content-Type"], "application/json");
  });

  it("sends body serialized as JSON", async () => {
    let capturedInit: RequestInit | undefined;
    stubFetch(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({});
    });

    const body = { courseId: "c1", data: { x: 1 } };
    await gatewayAuthPost("/v2/protected", JWT, body);
    assert.equal(capturedInit?.body, JSON.stringify(body));
  });

  it("sends undefined body when body argument is omitted", async () => {
    let capturedInit: RequestInit | undefined;
    stubFetch(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({});
    });
    await gatewayAuthPost("/v2/protected", JWT);
    assert.equal(capturedInit?.body, undefined);
  });

  it("throws GatewayError on 403 Forbidden", async () => {
    stubFetch(errorResponse(403, "Forbidden", { error: { message: "Not allowed" } }));
    await assert.rejects(
      () => gatewayAuthPost("/v2/protected", JWT),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 403);
        assert.equal(err.message, "Not allowed");
        return true;
      }
    );
  });

  it("throws GatewayError on 401 Unauthorized", async () => {
    stubFetch(errorResponse(401, "Unauthorized", { error: { message: "Token expired" } }));
    await assert.rejects(
      () => gatewayAuthPost("/v2/protected", "expired-jwt"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 401);
        return true;
      }
    );
  });
});

// ---- gatewayAuth (authenticated GET) -----------------------------------------------

describe("gatewayAuth", () => {
  const JWT = "auth.jwt.token";

  it("includes Authorization Bearer header", async () => {
    let capturedInit: RequestInit | undefined;
    stubFetch(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ data: "secure" });
    });

    await gatewayAuth("/v2/user/profile", JWT);
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers?.["Authorization"], `Bearer ${JWT}`);
  });

  it("constructs URL from PROXY_BASE + path", async () => {
    let capturedUrl: string | undefined;
    stubFetch(async (url) => {
      capturedUrl = url;
      return jsonResponse({});
    });
    await gatewayAuth("/v2/user/courses", JWT);
    assert.equal(capturedUrl, `${PROXY_BASE}/v2/user/courses`);
  });

  it("returns parsed JSON on success", async () => {
    stubFetch(jsonResponse({ courses: ["c1", "c2"] }));
    const result = await gatewayAuth<{ courses: string[] }>("/v2/user/courses", JWT);
    assert.deepEqual(result, { courses: ["c1", "c2"] });
  });

  it("throws GatewayError on 401 with envelope message", async () => {
    stubFetch(
      errorResponse(401, "Unauthorized", { error: { message: "Token expired" } })
    );
    await assert.rejects(
      () => gatewayAuth("/v2/user/profile", "expired-jwt"),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 401);
        assert.equal(err.message, "Token expired");
        return true;
      }
    );
  });

  it("throws GatewayError on 404", async () => {
    stubFetch(errorResponse(404, "Not Found", {}));
    await assert.rejects(
      () => gatewayAuth("/v2/nonexistent", JWT),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 404);
        return true;
      }
    );
  });
});

// ---- gatewayValidated --------------------------------------------------------------

describe("gatewayValidated", () => {
  const UserSchema = z.object({ id: z.string(), name: z.string() });

  it("returns validated data when schema matches (strict mode)", async () => {
    stubFetch(jsonResponse({ id: "u1", name: "Alice" }));
    const result = await gatewayValidated("/v2/user", UserSchema);
    assert.deepEqual(result, { id: "u1", name: "Alice" });
  });

  it("throws ApiValidationError when schema does not match (strict mode)", async () => {
    stubFetch(jsonResponse({ id: 999, name: "Alice" })); // id must be string
    await assert.rejects(
      () => gatewayValidated("/v2/user", UserSchema),
      (err: unknown) => {
        assert.ok(err instanceof ApiValidationError);
        assert.match(err.message, /\/v2\/user/);
        return true;
      }
    );
  });

  it("returns raw data even when schema does not match (soft mode)", async () => {
    stubFetch(jsonResponse({ id: 999, name: "Alice" }));
    const result = await gatewayValidated("/v2/user", UserSchema, { soft: true });
    assert.equal((result as unknown as { id: number }).id, 999);
  });

  it("still throws GatewayError on HTTP error before validation runs", async () => {
    stubFetch(errorResponse(500, "Internal Server Error", { error: { message: "Boom" } }));
    await assert.rejects(
      () => gatewayValidated("/v2/user", UserSchema),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 500);
        return true;
      }
    );
  });
});

// ---- gatewayAuthValidated ----------------------------------------------------------

describe("gatewayAuthValidated", () => {
  const JWT = "valid.jwt";
  const ItemSchema = z.object({ item: z.string() });

  it("validates and returns data on success", async () => {
    stubFetch(jsonResponse({ item: "hello" }));
    const result = await gatewayAuthValidated("/v2/items", JWT, ItemSchema);
    assert.deepEqual(result, { item: "hello" });
  });

  it("throws ApiValidationError on schema mismatch (strict mode)", async () => {
    stubFetch(jsonResponse({ item: 42 }));
    await assert.rejects(
      () => gatewayAuthValidated("/v2/items", JWT, ItemSchema),
      (err: unknown) => err instanceof ApiValidationError
    );
  });

  it("returns raw data on schema mismatch (soft mode)", async () => {
    stubFetch(jsonResponse({ item: 42 }));
    const result = await gatewayAuthValidated("/v2/items", JWT, ItemSchema, { soft: true });
    assert.equal((result as unknown as { item: number }).item, 42);
  });
});

// ---- gatewayPostValidated ----------------------------------------------------------

describe("gatewayPostValidated", () => {
  const ResultSchema = z.object({ success: z.boolean() });

  it("validates response from POST on success", async () => {
    stubFetch(jsonResponse({ success: true }));
    const result = await gatewayPostValidated("/v2/action", { key: "value" }, ResultSchema);
    assert.deepEqual(result, { success: true });
  });

  it("throws ApiValidationError on schema mismatch (strict mode)", async () => {
    stubFetch(jsonResponse({ success: "yes" })); // must be boolean
    await assert.rejects(
      () => gatewayPostValidated("/v2/action", {}, ResultSchema),
      (err: unknown) => err instanceof ApiValidationError
    );
  });

  it("throws GatewayError on HTTP error", async () => {
    stubFetch(errorResponse(400, "Bad Request", { error: { message: "Bad input" } }));
    await assert.rejects(
      () => gatewayPostValidated("/v2/action", {}, ResultSchema),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.equal(err.status, 400);
        return true;
      }
    );
  });
});

// ---- gatewayAuthPostValidated ------------------------------------------------------

describe("gatewayAuthPostValidated", () => {
  const JWT = "valid.jwt";
  const ResultSchema = z.object({ id: z.string() });

  it("validates response from authenticated POST", async () => {
    stubFetch(jsonResponse({ id: "new-item" }));
    const result = await gatewayAuthPostValidated("/v2/create", JWT, { name: "X" }, ResultSchema);
    assert.deepEqual(result, { id: "new-item" });
  });

  it("throws ApiValidationError on schema mismatch (strict mode)", async () => {
    stubFetch(jsonResponse({ id: 123 })); // must be string
    await assert.rejects(
      () => gatewayAuthPostValidated("/v2/create", JWT, {}, ResultSchema),
      (err: unknown) => err instanceof ApiValidationError
    );
  });

  it("returns raw data on schema mismatch (soft mode)", async () => {
    stubFetch(jsonResponse({ id: 123 }));
    const result = await gatewayAuthPostValidated("/v2/create", JWT, {}, ResultSchema, {
      soft: true,
    });
    assert.equal((result as unknown as { id: number }).id, 123);
  });
});

// ---- isGatewayError ----------------------------------------------------------------

describe("isGatewayError", () => {
  it("returns true for GatewayError instances", () => {
    assert.ok(isGatewayError(new GatewayError("err", 500)));
  });

  it("returns false for plain Error", () => {
    assert.equal(isGatewayError(new Error("plain")), false);
  });

  it("returns false for null", () => {
    assert.equal(isGatewayError(null), false);
  });

  it("returns false for strings", () => {
    assert.equal(isGatewayError("error string"), false);
  });

  it("returns false for objects that look like GatewayError", () => {
    assert.equal(isGatewayError({ name: "GatewayError", status: 404 }), false);
  });
});

// ---- isNotFound --------------------------------------------------------------------

describe("isNotFound", () => {
  it("returns true for 404 GatewayError", () => {
    assert.ok(isNotFound(new GatewayError("Not found", 404)));
  });

  it("returns false for 403 GatewayError", () => {
    assert.equal(isNotFound(new GatewayError("Forbidden", 403)), false);
  });

  it("returns false for 401 GatewayError", () => {
    assert.equal(isNotFound(new GatewayError("Unauthorized", 401)), false);
  });

  it("returns false for plain Error", () => {
    assert.equal(isNotFound(new Error("404 not found")), false);
  });

  it("returns false for null", () => {
    assert.equal(isNotFound(null), false);
  });
});

// ---- isUnauthorized ----------------------------------------------------------------

describe("isUnauthorized", () => {
  it("returns true for 401 GatewayError", () => {
    assert.ok(isUnauthorized(new GatewayError("Unauthorized", 401)));
  });

  it("returns false for 403 GatewayError", () => {
    assert.equal(isUnauthorized(new GatewayError("Forbidden", 403)), false);
  });

  it("returns false for 404 GatewayError", () => {
    assert.equal(isUnauthorized(new GatewayError("Not Found", 404)), false);
  });

  it("returns false for non-GatewayError", () => {
    assert.equal(isUnauthorized(new Error("401")), false);
  });
});

// ---- isForbidden -------------------------------------------------------------------

describe("isForbidden", () => {
  it("returns true for 403 GatewayError", () => {
    assert.ok(isForbidden(new GatewayError("Forbidden", 403)));
  });

  it("returns false for 401 GatewayError", () => {
    assert.equal(isForbidden(new GatewayError("Unauthorized", 401)), false);
  });

  it("returns false for 404 GatewayError", () => {
    assert.equal(isForbidden(new GatewayError("Not Found", 404)), false);
  });

  it("returns false for non-GatewayError", () => {
    assert.equal(isForbidden(new Error("403")), false);
  });
});
