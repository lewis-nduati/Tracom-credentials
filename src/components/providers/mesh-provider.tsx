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
    // Initialize libsodium WASM before mounting the Mesh wallet context.
    // Ed25519PrivateKey and Bip32PrivateKey call sodium functions synchronously,
    // so any wallet operation that reaches @cardano-sdk/crypto before sodium.ready
    // resolves will throw "libsodium not initialized". Awaiting here guarantees
    // sodium is ready before the first wallet connect/auth attempt.
    const init = async () => {
      const sodium = await import("libsodium-wrappers-sumo");
      await sodium.default.ready;
      const mod = await import("@meshsdk/react");
      setProvider(() => mod.MeshProvider);
    };
    void init();
  }, []);

  // Render children without MeshProvider during SSR/loading
  if (!Provider) {
    return <>{children}</>;
  }

  return <Provider>{children}</Provider>;
}
