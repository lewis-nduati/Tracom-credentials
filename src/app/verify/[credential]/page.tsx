import type { Metadata } from "next";
import Link from "next/link";

import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  AndamioCard,
  AndamioCardContent,
} from "~/components/andamio/andamio-card";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { SAMPLE_CERTIFIED_SKILLS } from "~/components/verify/certified-skills";
import { PoweredByAndamio } from "~/components/verify/powered-by-andamio";
import { VerifyBeacon } from "~/components/verify/verify-beacon";
import { VerifyShell } from "~/components/verify/verify-chrome";
import { VerifyForm } from "~/components/verify/verify-form";
import { Field, VerifiedResult } from "~/components/verify/verified-result";
import { BRANDING } from "~/config/branding";
import { env } from "~/env";
import {
  formatCredentialRef,
  parseCredentialRef,
  type CredentialRef,
} from "~/lib/credential-verification";
import { fetchAssetInfo } from "~/lib/koios";

interface PageProps {
  params: Promise<{ credential: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { credential } = await params;
  const ref = parseCredentialRef(credential);

  if (!ref) {
    return {
      title: "Credential not recognised",
      robots: { index: false },
    };
  }

  return {
    title: "Verify a credential",
    description:
      "Check a Tracom credential against the public ledger record of when it was issued.",
    // One page per credential is not something search engines should index:
    // the pages are unbounded in number and each one is about a private person.
    robots: { index: false, follow: true },
  };
}

/** A second try on the spot, plus who to ask when the code still fails. */
function RetryPanel() {
  return (
    <section className="flex flex-col gap-4">
      <AndamioHeading level={2} size="base">
        Try the code again
      </AndamioHeading>
      <VerifyForm />
      <AndamioText variant="small" className="text-muted-foreground">
        Still not working? Ask Tracom to confirm the award directly at{" "}
        <a
          href={`mailto:${BRANDING.support.email}`}
          className="text-primary underline-offset-2 hover:underline"
        >
          {BRANDING.support.email}
        </a>
        . Or{" "}
        <Link
          href="/verify/example"
          className="text-primary underline-offset-2 hover:underline"
        >
          see what a verified result looks like
        </Link>
        .
      </AndamioText>
    </section>
  );
}

export default async function VerifyCredentialPage({ params }: PageProps) {
  const { credential } = await params;
  const ref = parseCredentialRef(credential);

  if (!ref) return <MalformedState raw={credential} />;

  const asset = await fetchAssetInfo(ref.policyId, ref.assetNameHex);

  if (!asset) return <UnconfirmedState credentialRef={ref} />;

  return (
    <VerifiedResult
      credentialRef={ref}
      asset={asset}
      network={env.NEXT_PUBLIC_CARDANO_NETWORK}
      // Sample until the course lookup is wired up; see SAMPLE_CERTIFIED_SKILLS.
      skills={SAMPLE_CERTIFIED_SKILLS}
      skillsAreSample
    />
  );
}

function MalformedState({ raw }: { raw: string }) {
  return (
    <VerifyShell>
      <VerifyBeacon outcome="malformed" />

      <header className="flex flex-col gap-3">
        <AndamioBadge status="error">Not a valid code</AndamioBadge>
        <AndamioHeading level={1} size="4xl">
          That code is not in the right format
        </AndamioHeading>
        <AndamioText variant="lead" className="max-w-prose">
          A credential code is two long strings of letters and numbers separated
          by a full stop. The one in the link
          {raw.length <= 80 ? <> ({raw})</> : null} is not, so there is nothing
          to look up yet.
        </AndamioText>
      </header>

      <AndamioText variant="muted" className="max-w-prose">
        This usually means the link was cut short when it was copied or
        forwarded. Ask whoever sent it for the whole link, or type the code from
        the certificate below.
      </AndamioText>

      <RetryPanel />

      <PoweredByAndamio />
    </VerifyShell>
  );
}

function UnconfirmedState({ credentialRef }: { credentialRef: CredentialRef }) {
  const token = formatCredentialRef(credentialRef);

  return (
    <VerifyShell>
      <VerifyBeacon credential={token} outcome="not_found" />

      <header className="flex flex-col gap-3">
        <AndamioBadge status="pending">Not confirmed</AndamioBadge>
        <AndamioHeading level={1} size="4xl">
          We could not confirm this credential
        </AndamioHeading>
        <AndamioText variant="lead" className="max-w-prose">
          No record for this code was found on the{" "}
          {env.NEXT_PUBLIC_CARDANO_NETWORK} ledger.
        </AndamioText>
      </header>

      <AndamioCard>
        <AndamioCardContent>
          <AndamioHeading level={2} size="base">
            What this does and does not mean
          </AndamioHeading>
          <AndamioText variant="muted" className="mt-2 max-w-prose text-sm">
            It does not establish that the certificate is forged. The same
            result appears when a code was typed or copied slightly wrong, when
            a credential was issued on a different network, and when the ledger
            service is briefly unreachable. Those are far more common than
            forgery.
          </AndamioText>
        </AndamioCardContent>
      </AndamioCard>

      <dl className="flex flex-col">
        <Field label="Code checked">
          <code className="font-mono text-xs">{token}</code>
        </Field>
        <Field label="Network">{env.NEXT_PUBLIC_CARDANO_NETWORK}</Field>
      </dl>

      <RetryPanel />

      <PoweredByAndamio />
    </VerifyShell>
  );
}
