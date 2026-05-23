/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Read version from package.json (single source of truth)
const { version: appVersion } = JSON.parse(
  readFileSync("package.json", "utf-8"),
);

// Get short git commit hash
let gitCommit = "unknown";
try {
  gitCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
} catch {
  // Not a git repo or git not available — keep "unknown"
}

/** @type {import("next").NextConfig} */
const config = {
    output: 'standalone',
    env: {
      NEXT_PUBLIC_APP_VERSION: appVersion,
      NEXT_PUBLIC_BUILD_COMMIT: gitCommit,
      NEXT_PUBLIC_BUILD_ID: `${appVersion}+${gitCommit}`,
    },
    turbopack: {
      root: dirname(fileURLToPath(import.meta.url)),
    },
    transpilePackages: ["@andamio/core"],
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.andamio.io",
      },
      {
        protocol: "https",
        hostname: "andamio.io",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "gimbalabs.com",
      },
      {
        protocol: "https",
        hostname: "meshjs.dev",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
    ],
  },
};

export default config;
