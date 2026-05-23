"use client";

import { type ReactNode, useState, useEffect, type ComponentType } from "react";

/**
 * AuthProvider wrapper for Next.js App Router
 *
 * This component wraps the AndamioAuthProvider to make it compatible
 * with Next.js App Router. It dynamically imports the provider client-side
 * to avoid SSR compatibility issues with @meshsdk/react imports.
 *
 * Must be used inside MeshProvider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    // Dynamically import AndamioAuthProvider only on client-side to avoid
    // SSR issues with @meshsdk/react -> cardano-peer-connect chain
    void import("~/contexts/andamio-auth-context").then((mod) => {
      setProvider(() => mod.AndamioAuthProvider);
    });
  }, []);

  // Render children without AuthProvider during SSR/loading
  if (!Provider) {
    return <>{children}</>;
  }

  return <Provider>{children}</Provider>;
}
