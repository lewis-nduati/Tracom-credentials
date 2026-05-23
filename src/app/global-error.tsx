"use client";

import { useEffect } from "react";

/**
 * Global error boundary
 *
 * Catches errors that occur in the root layout.
 * This component must render its own <html> and <body> tags
 * since it replaces the root layout when triggered.
 *
 * This is a minimal fallback UI - for route-level errors,
 * see error.tsx which provides a better UX within the existing layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "#dc2626",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "1rem",
              maxWidth: "28rem",
              textAlign: "center",
            }}
          >
            {error.message || "An unexpected error occurred. Please try again."}
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#9ca3af",
                marginBottom: "1rem",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
