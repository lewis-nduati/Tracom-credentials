import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  AndamioCard,
  AndamioCardContent,
} from "~/components/andamio/andamio-card";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ExternalLinkIcon } from "~/components/icons";
import {
  CertifiedSkillsSection,
  type CertifiedSkills,
} from "~/components/verify/certified-skills";
import { PoweredByAndamio } from "~/components/verify/powered-by-andamio";
import {
  CredentialBadgeImage,
  VerifyActions,
} from "~/components/verify/verify-actions";
import { VerifyBeacon } from "~/components/verify/verify-beacon";
import { VerifyShell } from "~/components/verify/verify-chrome";
import {
  andamioBadgeUrl,
  decodeAssetName,
  formatCredentialRef,
  shortenHex,
  type CredentialRef,
} from "~/lib/credential-verification";
import { explorerTxUrl, type AssetInfo } from "~/lib/koios";

/** Format a Unix timestamp deterministically, so server and client agree. */
export function formatUtc(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(unixSeconds * 1000));
}

/**
 * One label/value row. Not a card: these are fields, not objects.
 * `stacked` puts the label above the value, for the narrow sidebar.
 */
export function Field({
  label,
  stacked = false,
  children,
}: {
  label: string;
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        stacked
          ? "border-border flex flex-col gap-1 border-b py-3 last:border-b-0"
          : "border-border flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
      }
    >
      <dt
        className={
          stacked
            ? "text-muted-foreground text-xs font-medium tracking-wider uppercase"
            : "text-muted-foreground w-44 shrink-0 text-xs font-medium tracking-wider uppercase"
        }
      >
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm break-words">{children}</dd>
    </div>
  );
}

/**
 * The result an employer sees for a credential found on the ledger.
 *
 * `example` renders the same layout from made-up values, for the
 * /verify/example page. In that mode nothing links out (the transaction and
 * badge do not exist) and no view is reported.
 */
export function VerifiedResult({
  credentialRef,
  asset,
  network,
  skills,
  skillsAreSample,
  mode = "live",
}: {
  credentialRef: CredentialRef;
  asset: AssetInfo;
  network: string;
  skills: CertifiedSkills;
  /** True while the course lookup returns sample content. */
  skillsAreSample: boolean;
  mode?: "live" | "example";
}) {
  const isExample = mode === "example";
  const token = formatCredentialRef(credentialRef);
  const isTestNetwork = network !== "mainnet";
  const badgeUrl = isExample ? null : andamioBadgeUrl(credentialRef);

  // Koios decodes the asset name when it is text; fall back to our own
  // decoder, then to nothing. A hash is not a name and should not be shown
  // as one.
  const readableName =
    (asset.assetNameAscii?.trim() ?? "") ||
    (decodeAssetName(asset.assetNameHex)?.trim() ?? "") ||
    null;

  const recorded = asset.creationTime ? formatUtc(asset.creationTime) : null;

  return (
    <VerifyShell width="wide" showExampleLink={!isExample}>
      {isExample ? null : (
        <VerifyBeacon credential={token} outcome="verified" />
      )}

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {isExample ? (
            <AndamioBadge status="pending">Example</AndamioBadge>
          ) : null}
          <AndamioBadge status="success">Found on the ledger</AndamioBadge>
        </div>
        <AndamioHeading level={1} size="4xl">
          {isExample
            ? "What a verified credential looks like"
            : "This credential is recorded on chain"}
        </AndamioHeading>
        <AndamioText variant="lead" className="max-w-prose">
          {isExample ? (
            <>
              This is the page an employer sees after checking a genuine
              credential. Every detail here is made up for illustration, so none
              of it refers to a real person or a real ledger record.
            </>
          ) : (
            <>
              A matching record exists on the Cardano {network} ledger and
              cannot be altered after the fact.
            </>
          )}
        </AndamioText>
      </header>

      {isTestNetwork && !isExample ? (
        <div className="border-warning/40 bg-warning/10 rounded-lg border p-4">
          <AndamioText variant="small" className="text-foreground">
            <strong className="font-semibold">
              This is a test credential.
            </strong>{" "}
            It was issued on the {network} test network, not on Cardano mainnet,
            and is not evidence of a real award.
          </AndamioText>
        </div>
      ) : null}

      {/* DOM order is the phone order: what it certifies, then the proof,
          then the explanation. On wide screens the proof moves to a sidebar. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <AndamioCard>
            <AndamioCardContent>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <CredentialBadgeImage src={badgeUrl} />
                <div className="min-w-0 flex-1">
                  <CertifiedSkillsSection
                    skills={skills}
                    isSample={skillsAreSample && !isExample}
                  />
                </div>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        </div>

        <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <AndamioCard>
            <AndamioCardContent>
              <AndamioHeading level={2} size="base">
                Verification details
              </AndamioHeading>
              <dl className="mt-2 flex flex-col">
                {readableName ? (
                  <Field label="Credential" stacked>
                    {readableName}
                  </Field>
                ) : null}
                <Field label="Issued by" stacked>
                  {skills.issuerName}
                </Field>
                <Field label="Recorded" stacked>
                  {recorded ?? "Unknown"}
                  {recorded ? (
                    <span className="text-muted-foreground"> UTC</span>
                  ) : null}
                </Field>
                <Field label="Network" stacked>
                  {network}
                </Field>
                <Field label="Issuing policy" stacked>
                  <code
                    className="font-mono text-xs"
                    title={credentialRef.policyId}
                  >
                    {shortenHex(credentialRef.policyId, 10)}
                  </code>
                </Field>
                {asset.fingerprint ? (
                  <Field label="Asset fingerprint" stacked>
                    <code className="font-mono text-xs">
                      {asset.fingerprint}
                    </code>
                  </Field>
                ) : null}
                {asset.mintingTxHash ? (
                  <Field label="Transaction" stacked>
                    {isExample ? (
                      <code className="font-mono text-xs">
                        {shortenHex(asset.mintingTxHash, 10)}
                      </code>
                    ) : (
                      <a
                        href={explorerTxUrl(asset.mintingTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-1 font-mono text-xs underline-offset-2 hover:underline"
                      >
                        {shortenHex(asset.mintingTxHash, 10)}
                        <ExternalLinkIcon
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          (opens a block explorer)
                        </span>
                      </a>
                    )}
                  </Field>
                ) : null}
              </dl>
              {isExample ? (
                <AndamioText
                  variant="small"
                  className="text-muted-foreground mt-4"
                >
                  On a real result, the transaction opens the public ledger
                  record and a link leads to the signed Open Badges record.
                </AndamioText>
              ) : badgeUrl ? (
                <AndamioText variant="small" className="mt-4">
                  <a
                    href={badgeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Open Badges record
                  </a>
                  <span className="text-muted-foreground">
                    : the signed proof, published by Andamio
                  </span>
                </AndamioText>
              ) : null}
            </AndamioCardContent>
          </AndamioCard>

          {isExample ? null : <VerifyActions />}
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-2">
          <section className="flex flex-col gap-2">
            <AndamioHeading level={2} size="base">
              What this confirms
            </AndamioHeading>
            <AndamioText variant="muted" className="max-w-prose text-sm">
              A credential was issued under this policy at the time shown, and
              the record has not been changed since. The ledger entry is public,
              so anyone can check it independently through the transaction link
              rather than taking our word for it.
            </AndamioText>
            <AndamioText variant="muted" className="max-w-prose text-sm">
              It does not by itself establish that the person presenting this
              certificate is the person it was awarded to. Match the name on the
              certificate against their identification, as you would with a
              paper one.
            </AndamioText>
          </section>

          <PoweredByAndamio />
        </div>
      </div>
    </VerifyShell>
  );
}
