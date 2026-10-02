import type { Metadata } from "next";
import Link from "next/link";

import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { PoweredByAndamio } from "~/components/verify/powered-by-andamio";
import { VerifyShell } from "~/components/verify/verify-chrome";
import { VerifyForm } from "~/components/verify/verify-form";

export const metadata: Metadata = {
  title: "Verify a credential",
  description:
    "Check whether a Tracom certificate is genuine. Enter the code from the certificate to see what was awarded and when.",
};

const STEPS = [
  {
    title: "Find the code",
    body: "It sits beneath the QR on a printed certificate, or at the end of the verification link.",
  },
  {
    title: "Enter it here",
    body: "Paste the code or the whole link. Scanning the QR with a phone camera opens the result directly.",
  },
  {
    title: "Read the result",
    body: "You will see what was awarded, what it certifies, and when it was recorded.",
  },
];

/**
 * Public verification entry point.
 *
 * Reached by people who have a certificate in hand and a code to type, rather
 * than a link to click. No sign-in: an employer checking a certificate has no
 * relationship with us and should not need one.
 */
export default function VerifyLandingPage() {
  return (
    <VerifyShell>
      <header className="flex flex-col gap-3">
        <AndamioText variant="overline">Credential verification</AndamioText>
        <AndamioHeading level={1} size="4xl">
          Check whether a certificate is genuine
        </AndamioHeading>
        <AndamioText variant="lead" className="max-w-prose">
          Every credential Tracom issues is recorded on a public ledger. Enter
          the code printed on the certificate, or scan its QR, and you will see
          what was awarded and when it was recorded.
        </AndamioText>
      </header>

      <VerifyForm />

      <AndamioText variant="small" className="text-muted-foreground">
        No certificate to hand?{" "}
        <Link
          href="/verify/example"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          See an example of a verified credential
        </Link>
        .
      </AndamioText>

      <section
        aria-labelledby="how-to-check-heading"
        className="flex flex-col gap-4"
      >
        <AndamioHeading id="how-to-check-heading" level={2} size="base">
          How to check a certificate
        </AndamioHeading>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="border-border flex flex-col gap-2 rounded-lg border p-4"
            >
              <span className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold">
                {index + 1}
              </span>
              <AndamioText className="text-foreground font-semibold">
                {step.title}
              </AndamioText>
              <AndamioText variant="small" className="text-muted-foreground">
                {step.body}
              </AndamioText>
            </li>
          ))}
        </ol>
      </section>

      <PoweredByAndamio />
    </VerifyShell>
  );
}
