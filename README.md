# Tracom Credentials

Blockchain credentialing infrastructure for Tracom Academy, built on Cardano.

---

## Status — May 2026

**Working:** Landing page, wallet connection, access token minting, user authentication, course browsing, dev environment, Vercel deployment at [tracom-credentials.vercel.app](https://tracom-credentials.vercel.app).

**In progress:** Creating the first Tracom course on Andamio preprod. Course ID needed before the credential flow can be tested end to end.

**Next:** Course creation → 3 test wallets → full credential flow on testnet → demo video.

---

## What Is Tracom Academy?

Tracom Academy is Kenya's leading payments and software training institution, based in Nairobi. They train thousands of professionals in financial technology, software development, and digital payments infrastructure.

Tracom has no existing credentialing system. Completing a course means getting a paper certificate — or nothing at all. Employers cannot verify what a candidate actually learned. The credentials are not portable, not permanent, and not trusted outside of Tracom's immediate network.

This project fills that gap.

---

## What This Project Does

Students who complete Tracom Academy courses earn on-chain credentials issued on Cardano through the Andamio protocol. These credentials live in the student's wallet, not in a database or behind a login.

- **Course enrollment** — Students connect a Cardano wallet and mint an access token, which becomes their on-chain identity.
- **Evidence submission** — Students commit their assignment work on-chain. Instructors review it through the Studio interface.
- **Credential issuance** — Once an instructor approves, a course credential token is minted to the student's wallet.
- **Credential portability** — The credential is a Cardano native asset. Any employer can verify it directly on-chain without contacting Tracom.

---

## What This Project Is Not

**Not a custom smart contract system.** All on-chain logic runs through Andamio's existing protocol contracts. This project is a branded interface on top of Andamio infrastructure.

**Not on mainnet.** Everything runs on Cardano preprod (testnet). Mainnet deployment is a separate milestone that requires a production Andamio instance provisioned for Tracom.

**Not a full Andamio replacement.** Andamio handles the protocol, API, and transaction layer. This project is Tracom's branded interface on top of that.

**Not enterprise-ready yet.** v1 covers the course credential flow only. Project coordination, treasury management, and multi-institution features are out of scope for this release.

---

## Design Principles

**Verifiable.** Every credential is anchored on Cardano. Any employer can check it directly on-chain, without calling Tracom or using a third-party registry.

**Permanent.** On-chain credentials don't expire and survive Tracom going offline. A credential issued today still verifies in 2040.

**Portable.** Credentials live in the student's wallet. They are not locked to Tracom's platform. A student who earned a credential in 2026 can prove it in 2036 without Tracom's involvement.

**Institution-first.** The design prioritises Tracom's identity and student experience over protocol visibility. Students should feel they are using a Tracom product, not a blockchain template.

---

## How It Works

The credential flow has six steps.

**1. Connect wallet.** The student connects a Cardano wallet (Eternl on preprod) at [tracom-credentials.vercel.app](https://tracom-credentials.vercel.app).

**2. Mint access token.** The student chooses an alias and signs a transaction that mints their Andamio Access Token on-chain. This token is their identity — it links their wallet address to their Tracom identity. The transaction is confirmed on Cardano, typically within 60–90 seconds.

**3. Enroll in a course.** With an access token, the student can enroll in any active Tracom course. Enrollment is recorded on-chain against the course's policy ID.

**4. Complete the course and commit evidence.** The student works through course modules and submits assignment evidence by signing a commitment transaction. The commitment hash is stored on-chain.

**5. Instructor assessment.** A Tracom instructor reviews the commitment through the Studio interface. Approval triggers an assessment transaction on-chain.

**6. Claim credential.** Once assessed, the student claims their course credential — a Cardano native asset minted to their wallet. The credential is now theirs permanently.

---

## Repo Layout

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes: dashboard, course, credentials
│   ├── (studio)/       # Instructor/admin routes: course and module management
│   ├── api/            # API routes: Andamio gateway proxy, health, tRPC
│   └── page.tsx        # Public landing page
├── components/
│   ├── andamio/        # Design system — shadcn/ui wrappers
│   ├── auth/           # Wallet connection and access token onboarding
│   ├── courses/        # Course listing, module cards, assignment UI
│   ├── dashboard/      # Dashboard summary cards and status
│   ├── editor/         # Rich text editor (TipTap) for course content
│   ├── landing/        # Public landing page sections
│   ├── layout/         # App sidebar, studio header, mobile nav
│   ├── learner/        # Assignment commitment and learning progress
│   ├── studio/         # Course and module creation wizard
│   └── tx/             # Transaction components for every on-chain action
├── config/             # Branding, navigation, feature flags, routes
├── hooks/              # API, auth, transaction, and UI hooks
├── lib/                # Utilities: gateway client, Cardano utils, SSE, errors
├── stores/             # Zustand stores: tx watcher, module draft, wizard state
└── types/              # TypeScript types including generated gateway types
```

---

## Environment Setup

Copy `.env.example` to `.env.local` and fill in four values:

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io
ANDAMIO_API_KEY=your-api-key
NEXT_PUBLIC_CARDANO_NETWORK=preprod
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID=your-policy-id
```

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will need the Eternl browser wallet extension set to the Pre-Production network.

---

## Links

- [Tracom Academy](https://tracom.co.ke)
- [Live app — preprod](https://tracom-credentials.vercel.app)
- [Andamio Protocol](https://andamio.io)
- [Andamio Docs](https://docs.andamio.io)
- [GitHub](https://github.com/lewis-nduati/Tracom-credentials)
