import { Suspense } from "react";
import { CliAuthFlow } from "~/components/auth/cli-auth-flow";
import {
  AndamioCard,
  AndamioCardContent,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { LoadingIcon, TerminalIcon } from "~/components/icons";

function CliAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border/50 bg-muted">
            <TerminalIcon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <AndamioHeading level={1} size="xl">
              CLI Authentication
            </AndamioHeading>
            <AndamioText variant="muted" className="text-sm font-mono">
              andamio-cli
            </AndamioText>
          </div>
        </div>
        <AndamioCard>
          <AndamioCardContent className="py-8">
            <div className="flex flex-col items-center gap-3">
              <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
              <AndamioText variant="muted">Loading...</AndamioText>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    </div>
  );
}

/**
 * CLI Authentication page - enables CLI tools to authenticate via browser wallet
 *
 * URL Parameters:
 * - redirect_uri: localhost callback URL for the CLI (required)
 * - state: CSRF protection token echoed back to CLI (required)
 */
export default function CliAuthPage() {
  return (
    <Suspense fallback={<CliAuthLoading />}>
      <CliAuthFlow />
    </Suspense>
  );
}
