import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Unified Andamio Gateway API Proxy
 *
 * Single proxy route for all Andamio API services via the unified gateway:
 * - On-chain indexed data (Andamioscan passthrough)
 * - Database API (course/project CRUD)
 * - Transaction building (Atlas TX API)
 * - Authentication
 *
 * Architecture:
 * - CORS-free access to the gateway API
 * - App-level billing (usage billed to app developer, not end users)
 * - Centralized API key management
 * - Upstream gateway handles caching
 *
 * Two-Layer Authentication Model:
 * 1. App Authentication (X-API-Key) - Always required for all v2 endpoints
 *    - Validates the app has gateway access
 *    - Billed to app developer
 *
 * 2. User Authentication (Authorization: Bearer) - For user-specific endpoints
 *    - Validates the end user (JWT from login/validate)
 *    - Optional for public endpoints, required for user-specific ones
 *
 * Login flow:
 *   POST /api/v2/auth/login/session  - X-API-Key only → returns nonce
 *   POST /api/v2/auth/login/validate - X-API-Key only → returns user JWT
 *   POST /api/v2/user/*              - X-API-Key + Authorization: Bearer
 *
 * Gateway Base: NEXT_PUBLIC_ANDAMIO_GATEWAY_URL
 *
 * @see .claude/skills/audit-api-coverage/unified-api-endpoints.md
 */

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST"
) {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const { path } = await params;
    const gatewayPath = path.join("/");
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullPath = `${gatewayPath}${queryString ? `?${queryString}` : ""}`;
    const gatewayUrl = `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/${fullPath}`;

    if (isDev) {
      console.log(`[Gateway Proxy] Forwarding ${method} request to: ${gatewayUrl}`);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=utf-8",
      "Accept": "application/json;charset=utf-8",
      // App-level authentication - always required
      "X-API-Key": env.ANDAMIO_API_KEY,
    };

    // User-level authentication - add JWT when user is logged in
    // Two-layer auth model:
    // - X-API-Key: App authentication (always required)
    // - Authorization: Bearer: User authentication (for user-specific endpoints)
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST") {
      const bodyText = await request.text();
      fetchOptions.body = bodyText;
    }

    const response = await fetch(gatewayUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Gateway Proxy] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return NextResponse.json(
        { error: `Gateway API error: ${response.status} ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();

    if (isDev) {
      console.log(`[Gateway Proxy] Success response from ${gatewayPath}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Gateway Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Gateway", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "POST");
}
