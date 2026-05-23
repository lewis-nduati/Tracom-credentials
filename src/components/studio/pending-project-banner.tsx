"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InfoIcon, CloseIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { pendingProject } from "~/lib/pending-project";

interface PendingProjectBannerProps {
  /** When true, shows "Return to Project Creation" link alongside dismiss */
  hasActiveModules?: boolean;
}

export function PendingProjectBanner({ hasActiveModules = false }: PendingProjectBannerProps) {
  const router = useRouter();
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    setTitle(pendingProject.get());
  }, []);

  if (!title) return null;

  const handleDismiss = () => {
    pendingProject.clear();
    setTitle(null);
  };

  const handleReturn = () => {
    router.push("/studio?create=project");
  };

  return (
    <div className="flex items-center gap-3 rounded-sm border border-secondary/30 bg-secondary/5 px-4 py-3 mb-4">
      <InfoIcon className="h-4 w-4 text-secondary shrink-0" />
      <AndamioText variant="small" className="flex-1 text-sm">
        {hasActiveModules ? (
          <>Creating a course for project <span className="font-semibold">&ldquo;{title}&rdquo;</span></>
        ) : (
          <>Creating a course for project <span className="font-semibold">&ldquo;{title}&rdquo;</span> — you&apos;ll return to project creation after minting a module.</>
        )}
      </AndamioText>
      {hasActiveModules && (
        <AndamioButton variant="outline" size="sm" onClick={handleReturn} className="shrink-0">
          Return to Project Creation
        </AndamioButton>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
