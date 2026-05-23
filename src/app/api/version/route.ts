import { NextResponse } from "next/server";

/**
 * GET /api/version
 *
 * Returns the app version, build commit, and composite build ID.
 * Mirrors the pattern from andamio-api's versioned Swagger metadata.
 */
export function GET() {
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "unknown",
    build_id: process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown",
  });
}
