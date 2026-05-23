"use client";

import { type ReactNode, useState, useEffect, type ComponentType } from "react";

/**
 * MeshProvider wrapper for Next.js App Router
 *
 * This component wraps the Mesh SDK's MeshProvider to make it compatible
 * with Next.js App Router. It dynamically imports the provider client-side
 * to avoid SSR compatibility issues with @fabianbormann/cardano-peer-connect.
 *
 * Usage:
 * - Wrap your app in this provider in the root layout
 * - Use the useWallet hook from @meshsdk/react to access wallet functionality
 *
 * @example
 * ```tsx
 * import { MeshProvider } from "~/components/providers/mesh-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <MeshProvider>
 *           {children}
 *         </MeshProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function MeshProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    // Dynamically import MeshProvider only on client-side to avoid
    // "Cannot redefine property: chunk" error from cardano-peer-connect
    void import("@meshsdk/react").then((mod) => {
      setProvider(() => mod.MeshProvider);
    });
  }, []);

  // Render children without MeshProvider during SSR/loading
  if (!Provider) {
    return <>{children}</>;
  }

  return <Provider>{children}</Provider>;
}
