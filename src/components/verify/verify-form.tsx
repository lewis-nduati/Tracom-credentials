"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { parseCredentialRef, verifyPath } from "~/lib/credential-verification";

/**
 * Lookup form for someone holding a credential code but not a link.
 *
 * Validation runs here so a mistyped code gets an immediate message instead of
 * a page load that ends in "not found" — those are different problems and the
 * visitor should be able to tell them apart.
 */
export function VerifyForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ref = parseCredentialRef(value);
    if (!ref) {
      setError(
        "That does not look like a credential code. Paste the full link from the certificate, or the code beneath the QR.",
      );
      return;
    }

    setError(null);
    router.push(verifyPath(ref));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <AndamioLabel htmlFor="credential-code">
        Credential code or link
      </AndamioLabel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <AndamioInput
          id="credential-code"
          name="credential-code"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste the code or the verification link"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "credential-code-error" : undefined}
          className="font-mono sm:flex-1"
        />
        <AndamioButton type="submit">Verify</AndamioButton>
      </div>

      {error ? (
        <AndamioText
          id="credential-code-error"
          variant="small"
          role="alert"
          className="text-destructive"
        >
          {error}
        </AndamioText>
      ) : null}
    </form>
  );
}
