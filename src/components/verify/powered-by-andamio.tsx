import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { BRANDING } from "~/config/branding";

/**
 * Credits the protocol on the verification page.
 *
 * This page speaks for Tracom and nobody else, so it names Andamio as the
 * infrastructure and stops there. Kept quiet on purpose: the visitor came to
 * check a certificate, not to read about the stack behind it.
 */
export function PoweredByAndamio() {
  return (
    <aside
      aria-labelledby="powered-by-andamio-heading"
      className="border-border bg-muted/50 rounded-lg border p-6"
    >
      <AndamioHeading id="powered-by-andamio-heading" level={2} size="base">
        How this check works
      </AndamioHeading>

      <AndamioText variant="muted" className="mt-2 max-w-prose text-sm">
        Tracom issues its credentials with Andamio, an open protocol for courses
        and credentials on Cardano. Each credential is recorded publicly, so
        anyone can confirm it without an account or a phone call to Tracom.
      </AndamioText>

      <AndamioText variant="small" className="mt-4">
        <a
          href={BRANDING.links.andamio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          About Andamio
        </a>
      </AndamioText>
    </aside>
  );
}
