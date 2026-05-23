/**
 * Koios API Proxy
 *
 * Proxies requests to Koios API to avoid CORS issues in the browser.
 * All client-side Koios requests should go through this proxy.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";

const KOIOS_URLS = {
  mainnet: "https://api.koios.rest/api/v1",
  preprod: "https://preprod.koios.rest/api/v1",
  preview: "https://preview.koios.rest/api/v1",
} as const;

const KOIOS_API_BASE = KOIOS_URLS[env.NEXT_PUBLIC_CARDANO_NETWORK];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const { path } = await params;
    const koiosPath = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const koiosUrl = `${KOIOS_API_BASE}/${koiosPath}${searchParams ? `?${searchParams}` : ""}`;

    if (isDev) {
      console.log(`[Koios Proxy] Proxying request to: ${koiosUrl}`);
    }

    const response = await fetch(koiosUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Koios Proxy] Error response from Koios:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: koiosUrl,
      });
      return NextResponse.json(
        {
          error: `Koios API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as unknown;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[Koios Proxy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const { path } = await params;
    const koiosPath = path.join("/");
    const body = await request.text();
    const koiosUrl = `${KOIOS_API_BASE}/${koiosPath}`;

    if (isDev) {
      console.log(`[Koios Proxy] Proxying POST request to: ${koiosUrl}`);
    }

    const response = await fetch(koiosUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Koios Proxy] Error response from Koios:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: koiosUrl,
      });
      return NextResponse.json(
        {
          error: `Koios API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as unknown;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Koios Proxy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
