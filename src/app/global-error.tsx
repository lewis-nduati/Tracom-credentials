"use client";

import { useEffect } from "react";

// Global error boundary replaces the root layout when it fires, so CSS tokens
// and Tailwind are unavailable. All styles are inline. Brand navy: #1a2748.
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
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#1a2748",
          color: "#ffffff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "22rem",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Tracom Academy
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#ffffff",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {error.digest}
            </p>
          )}
          <div style={{ paddingTop: "0.5rem" }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#ffffff",
                color: "#1a2748",
                padding: "0.625rem 1.5rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
