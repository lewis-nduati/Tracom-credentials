import { NextResponse } from "next/server";

/**
 * Health check endpoint for Cloud Run
 * Returns 200 OK if the service is healthy
 *
 * Used by:
 * - Cloud Run startup/liveness probes
 * - Load balancer health checks
 * - Monitoring systems
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "andamio-frontend",
    },
    { status: 200 }
  );
}
