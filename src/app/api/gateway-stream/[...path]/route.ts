import { type NextRequest } from "next/server";
import { env } from "~/env";

/**
 * SSE Streaming Proxy for Andamio Gateway
 *
 * Dedicated proxy for Server-Sent Events streams. Unlike the JSON gateway proxy,
 * this route streams the raw response body without JSON parsing, preserving the
 * SSE event stream format.
 *
 * Used by useTxStream to receive real-time transaction state updates.
 *
 * @see src/hooks/tx/use-tx-stream.ts - Consumer hook
 * @see src/app/api/gateway/[...path]/route.ts - JSON proxy (cannot handle SSE)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const gatewayPath = path.join("/");
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullPath = `${gatewayPath}${queryString ? `?${queryString}` : ""}`;
    const gatewayUrl = `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/${fullPath}`;

    console.log(`[Gateway Stream] Forwarding SSE request to: ${gatewayUrl}`);

    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "X-API-Key": env.ANDAMIO_API_KEY,
    };

    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(gatewayUrl, {
      headers,
      // Disable automatic response buffering for streaming
      cache: "no-store",
      // Fail fast if the gateway doesn't respond with headers within 15s.
      // This hands control to the polling fallback sooner rather than hanging
      // for minutes on undici's default 300s headersTimeout.
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Gateway Stream] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return new Response(
        JSON.stringify({
          error: `Gateway API error: ${response.status} ${response.statusText}`,
          details: errorBody,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "No response body from gateway" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream the raw response body back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    // Distinguish timeout (expected when gateway is slow) from other errors
    const isTimeout =
      error instanceof DOMException && error.name === "TimeoutError";
    console.warn(
      `[Gateway Stream] ${isTimeout ? "Connection timed out (15s) — client should fall back to polling" : "Error:"}`,
      isTimeout ? undefined : error
    );
    return new Response(
      JSON.stringify({
        error: isTimeout
          ? "Gateway stream connection timed out"
          : "Failed to connect to Gateway stream",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "polling",
      }),
      {
        // 504 for timeout (gateway didn't respond), 502 for other upstream errors
        status: isTimeout ? 504 : 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
