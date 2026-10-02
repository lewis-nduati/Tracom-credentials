import Image from "next/image";
import Link from "next/link";

import { AndamioText } from "~/components/andamio/andamio-text";
import { BRANDING } from "~/config/branding";

/**
 * Header and footer for the public verification pages.
 *
 * A stranger lands here from a QR code or a forwarded link. The first thing
 * they need to know is whose page this is, so the issuer's logo leads and the
 * protocol stays in the footer.
 */
export function VerifyHeader() {
  return (
    <header className="border-border bg-background border-b print:border-b-0">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a
          href={BRANDING.links.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${BRANDING.name} website`}
        >
          <Image
            src={BRANDING.logo.horizontal}
            alt={BRANDING.name}
            width={136}
            height={32}
            priority
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src={BRANDING.logo.horizontalDark}
            alt={BRANDING.name}
            width={136}
            height={32}
            priority
            className="hidden h-8 w-auto dark:block"
          />
        </a>
        <Link
          href="/verify"
          className="text-muted-foreground hover:text-foreground text-sm font-medium print:hidden"
        >
          Verify a credential
        </Link>
      </div>
    </header>
  );
}

export function VerifyFooter() {
  const website = BRANDING.links.website.replace(/^https?:\/\//, "");

  return (
    <footer className="border-border mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <AndamioText variant="small" className="text-muted-foreground">
          Credentials issued by Tracom ·{" "}
          <a
            href={BRANDING.links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            {website}
          </a>{" "}
          ·{" "}
          <a
            href={`mailto:${BRANDING.support.email}`}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            {BRANDING.support.email}
          </a>
        </AndamioText>
        <AndamioText variant="small" className="text-muted-foreground">
          Recorded on Cardano with{" "}
          <a
            href={BRANDING.links.andamio}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Andamio
          </a>
        </AndamioText>
      </div>
    </footer>
  );
}

/**
 * Says plainly that the service is unfinished. The ledger checks are live,
 * but what a credential certifies still shows sample content, and a visitor
 * deserves to know that before they rely on the page.
 */
function DevelopmentBanner({ showExampleLink }: { showExampleLink: boolean }) {
  return (
    <div className="border-warning/40 bg-warning/10 border-b print:hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-2.5 sm:px-6">
        <AndamioText variant="small" className="text-foreground font-semibold">
          Under development.
        </AndamioText>
        <AndamioText variant="small" className="text-foreground">
          Ledger checks are real, but course details are samples for now.{" "}
          {showExampleLink ? (
            <Link
              href="/verify/example"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              See an example result
            </Link>
          ) : null}
        </AndamioText>
      </div>
    </div>
  );
}

/** Page frame shared by every verification state. */
export function VerifyShell({
  children,
  width = "narrow",
  showExampleLink = true,
}: {
  children: React.ReactNode;
  /** Off on the example page itself, where the link would point back here. */
  showExampleLink?: boolean;
  /** "wide" gives the verified result room for its two-column layout. */
  width?: "narrow" | "wide";
}) {
  const maxWidth = width === "wide" ? "max-w-5xl" : "max-w-2xl";

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <VerifyHeader />
      <DevelopmentBanner showExampleLink={showExampleLink} />
      <main
        className={`mx-auto flex w-full ${maxWidth} flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14`}
      >
        {children}
      </main>
      <VerifyFooter />
    </div>
  );
}
