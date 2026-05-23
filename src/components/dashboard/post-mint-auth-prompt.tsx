"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  LoadingIcon,
  VerifiedIcon,
  WalletIcon,
  AccessTokenIcon,
  LearnerIcon,
  NeutralIcon,
  InfoIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";

const POST_MINT_FLAG_KEY = "andamio_just_minted";

/**
 * Check if user just minted an access token (for showing contextual auth prompt)
 */
export function setJustMintedFlag() {
  if (typeof window !== "undefined") {
    localStorage.setItem(POST_MINT_FLAG_KEY, Date.now().toString());
  }
}

/**
 * Check and clear the just-minted flag
 */
export function checkAndClearJustMintedFlag(): boolean {
  if (typeof window === "undefined") return false;

  const timestamp = localStorage.getItem(POST_MINT_FLAG_KEY);
  if (!timestamp) return false;

  // Flag is valid for 5 minutes
  const isRecent = Date.now() - parseInt(timestamp) < 5 * 60 * 1000;

  // Clear the flag
  localStorage.removeItem(POST_MINT_FLAG_KEY);

  return isRecent;
}

interface PostMintAuthPromptProps {
  /** Called after successful authentication */
  onAuthenticated?: () => void;
}

/**
 * Post-mint authentication prompt with clear context
 *
 * Shows after user mints an access token, explaining:
 * - What just happened (token minted successfully)
 * - What's next (sign to start session)
 * - Why it's needed (different from transaction signature)
 */
export function PostMintAuthPrompt({ onAuthenticated }: PostMintAuthPromptProps) {
  const {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
  } = useAndamioAuth();

  // If authenticated, call callback and render nothing
  React.useEffect(() => {
    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  // Steps for the progress tracker
  const steps = [
    { id: "connect", title: "Connect Wallet", completed: true, icon: WalletIcon },
    { id: "mint", title: "Mint Access Token", completed: true, icon: AccessTokenIcon },
    { id: "sign", title: "Sign In", completed: false, icon: LearnerIcon },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      {/* Step Progress Tracker */}
      <div className="w-full max-w-lg">
        <AndamioCard className="border-muted-foreground/30 bg-primary/5">
          <AndamioCardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <LearnerIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <AndamioText variant="small" className="font-semibold text-foreground">
                    Getting Started
                  </AndamioText>
                  <AndamioText variant="small" className="text-xs">
                    2 of 3 steps complete
                  </AndamioText>
                </div>
              </div>

              {/* Steps - horizontal on desktop */}
              <div className="flex-1 flex items-center gap-2 sm:justify-end">
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1;

                  return (
                    <React.Fragment key={step.id}>
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                          step.completed
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.completed ? (
                          <VerifiedIcon className="h-4 w-4" />
                        ) : (
                          <NeutralIcon className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline font-medium">{step.title}</span>
                      </div>
                      {!isLast && (
                        <div className="hidden sm:block h-px w-4 bg-border" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* Celebration + Auth Card */}
      <div className="w-full max-w-md">
        <AndamioCard>
          <AndamioCardHeader className="text-center pb-2">
            {/* Celebration emoji */}
            <div className="flex justify-center mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🎉</span>
              </div>
            </div>
            <AndamioCardTitle className="text-xl">Access Token Created!</AndamioCardTitle>
            <AndamioCardDescription>
              Your on-chain identity is ready. One last step to go.
            </AndamioCardDescription>
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-4">
            {/* Auth error */}
            {authError && (
              <AndamioAlert variant="destructive">
                <AndamioAlertDescription>{authError}</AndamioAlertDescription>
              </AndamioAlert>
            )}

            {/* Sign button */}
            {isAuthenticating ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                <AndamioText variant="small">Waiting for wallet signature...</AndamioText>
              </div>
            ) : (
              <AndamioButton
                onClick={authenticate}
                disabled={isAuthenticating}
                className="w-full"
                size="lg"
              >
                {authError ? "Try Again" : "Sign & Continue"}
              </AndamioButton>
            )}

            {/* Explanation */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <AndamioText variant="small" className="text-muted-foreground">
                This signature proves you own the wallet. It&apos;s different from the
                transaction you just signed — no blockchain fees involved.
              </AndamioText>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    </div>
  );
}
