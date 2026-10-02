/**
 * Verification event capture.
 *
 * Every credential a graduate shares puts an employer on this domain. That
 * traffic is the only mechanic in the business that compounds, and until now
 * nothing measured it. This endpoint is the measurement.
 *
 * Deliberately first-party and deliberately minimal. No third-party analytics
 * vendor is installed, because that is a data-sharing decision for the
 * business to make rather than a default to inherit. Nothing identifying is
 * recorded: no IP address, no user agent, no cookie, no learner name. A
 * credential reference is a public identifier that already appears in the URL
 * the visitor typed.
 *
 * Events go to the server log as one JSON line each, which is queryable in
 * hosting logs today. Wiring them to a store is the next step and does not
 * change this contract.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { parseCredentialRef } from "~/lib/credential-verification";

/** Outcomes worth separating: a found credential is a very different signal. */
const outcomeSchema = z.enum(["verified", "not_found", "malformed"]);

const bodySchema = z.object({
  /** The `<policy>.<asset>` token, re-validated rather than trusted. */
  credential: z.string().max(200).optional(),
  outcome: outcomeSchema,
  /**
   * Where the visitor came from, reduced to a hostname by the client before
   * sending. A full referrer URL can carry identifiers in its query string.
   */
  referrerHost: z.string().max(255).optional(),
});

export async function POST(request: Request) {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const result = bodySchema.safeParse(parsedBody);
  if (!result.success) {
    return new NextResponse(null, { status: 400 });
  }

  const { credential, outcome, referrerHost } = result.data;

  // Re-parse rather than logging whatever arrived. A rejected token is still
  // worth counting, but it is counted without echoing the raw string back
  // into the log.
  const ref = credential ? parseCredentialRef(credential) : null;

  console.log(
    JSON.stringify({
      event: "credential_verification_viewed",
      at: new Date().toISOString(),
      outcome,
      policyId: ref?.policyId,
      assetNameHex: ref?.assetNameHex,
      referrerHost,
    }),
  );

  // No body: the client does not act on the response and should not wait.
  return new NextResponse(null, { status: 204 });
}
