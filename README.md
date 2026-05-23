# Tracom Academy — Blockchain Credential Platform

A course credential platform for [Tracom Academy](https://tracom.co.ke), built on Cardano using the [Andamio](https://andamio.io) protocol.

Students complete courses, earn verifiable on-chain credentials, and build a blockchain-backed learning record.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Cardano / Andamio Protocol** — smart contracts for credentials and course management
- **Mesh SDK** — wallet integration (CIP-30)
- **tRPC + TanStack Query** — API layer
- **Tailwind CSS + shadcn/ui** — UI components

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Andamio API key and Access Token Policy ID
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANDAMIO_API_KEY` | Yes | Server-side key for the Andamio Gateway |
| `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` | Yes | Gateway URL (preprod or mainnet) |
| `NEXT_PUBLIC_CARDANO_NETWORK` | Yes | `preprod` \| `mainnet` \| `preview` |
| `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` | Yes | Andamio Access Token policy ID |
| `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` | No | Required for social wallet TX submission |

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run check      # lint + typecheck
```

## Scope (v1)

Course credential flow only. Project and treasury features are disabled in this release.

## Links

- [Tracom Academy](https://tracom.co.ke)
- [Andamio Docs](https://docs.andamio.io)
- [GitHub](https://github.com/lewis-nduati/Tracom-credentials)
