"use client";

import { useCallback, useState } from "react";

import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  CheckIcon,
  CopyIcon,
  CredentialIcon,
  DownloadIcon,
} from "~/components/icons";

/**
 * Things a checker does once the result is in: keep a copy for an HR file or
 * pass the link on. Hidden when printing, since the printout is the copy.
 */
export function VerifyActions() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). The address
      // bar still has the link, so failing quietly is acceptable here.
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <AndamioButton
        variant="outline"
        size="sm"
        onClick={copyLink}
        leftIcon={
          copied ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )
        }
      >
        {copied ? "Link copied" : "Copy link"}
      </AndamioButton>
      <AndamioButton
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        leftIcon={<DownloadIcon className="h-4 w-4" />}
      >
        Print or save as PDF
      </AndamioButton>
    </div>
  );
}

/**
 * The badge Andamio renders for a credential.
 *
 * Not every on-chain asset has one, and a broken image on a trust page reads
 * as something wrong with the credential. Fall back to a neutral icon.
 */
export function CredentialBadgeImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  // The image can fail before React hydrates, and then onError never fires.
  // Catch that case by checking the element when React attaches to it.
  const checkAlreadyFailed = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || !src) {
    return (
      <div className="border-border bg-muted text-muted-foreground flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border">
        <CredentialIcon className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    // Rendered by Andamio, not by us. Plain img: the badge host is outside the
    // Next image allowlist, and this is decorative.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={checkAlreadyFailed}
      src={src}
      alt=""
      width={112}
      height={112}
      onError={() => setFailed(true)}
      className="border-border bg-muted h-28 w-28 shrink-0 rounded-lg border object-contain"
    />
  );
}
