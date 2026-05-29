# Tracom Academy Credentials — Project Build Document

**Lead Developer / Implementation Partner:** Lewis Nduati
**Updated:** May 2026
**Status:** Preprod — not yet live on mainnet

---

## 1. Project Title

Tracom Academy Credentials — On-Chain Credentialing Platform

---

## 2. Project Description

Tracom Services Limited sells banking solutions to financial institutions across East Africa. Its training arm, Tracom Academy, teaches software development and security for web, mobile, POS terminals, and ATMs.

Right now a student who finishes a programme gets a PDF or a printed certificate. It's only as credible as whoever receives it decides to treat it. Checking it means calling Tracom, and the student doesn't really own the record.

This project puts the credential on-chain instead. A native asset is minted on Cardano when the student completes the work, and it lives in their own wallet. Nobody can edit or delete it, an employer can verify it without calling anyone, and the student keeps it even if Tracom's systems change or disappear. The app is built so this feels like software a bank would ship, not a blockchain demo.

---

## 3. Project Objectives

- **Objective 1:** Ship a complete student journey: enroll, learn, submit assignments, and claim a verifiable credential to a personal Cardano wallet.
- **Objective 2:** Give Tracom Academy staff a creator studio to author courses, review assignments, and issue credentials, with no ambiguity about what state anything is in.
- **Objective 3:** Launch on Cardano mainnet with the first real Tracom Academy course running end to end.
- **Objective 4:** Demo a working version of the platform at the hackathon.

---

## 4. Scope of Work

### In-Scope

- Student flow: landing/wallet connection, sign-in and registration, access token minting (proof of enrollment), course browser, module view, assignment submission, credential claim.
- Creator studio: course management, module/lesson/introduction/assignment editors, learning targets (SLTs) editor, module import from compiled markdown.
- Infrastructure: Andamio design system (shadcn/ui based), human-readable Cardano transaction error messages, branded error and not-found pages, studio header with breadcrumbs and per-page actions.
- Course content: three compiled courses ready to import, plus one demo module for the hackathon.
- Andamio Database API integration (currently 58 of 74 endpoints).

### Out-of-Scope (current phase)

- Andamio OB 3.0 credential integration (deferred to pioneer programme).
- Task commitments and contributor flow (currently ~14% coverage).
- Prerequisites endpoints.
- Capstone project (Build a POS Integration) implemented as an Andamio project — designed and documented but not built.

---

## 5. Key Stakeholders and Roles

### Internal Stakeholders

- **Lewis Nduati** — Lead Developer / Implementation Partner. Builds and ships the platform.
- **Tracom Academy instructors / studio users** — Author course content, review assignments, issue credentials.
- **Tracom Services Limited** — Sponsoring organization; owner of the academy and brand.

### External Stakeholders

- **Students** — Kenyan fintech and technology professionals enrolled at the academy; working adults, mobile-first, often on lower-bandwidth connections. Primary end users.
- **Andamio** — On-chain protocol and Database API provider.
- **Employers / verifiers** — Third parties who verify credentials directly from the chain.

---

## 6. Timeline

- **Start Date:** September 2025
- **End Date (mainnet launch target):** September 2026

---

## 7. Milestones

- **Student flow complete (preprod)** — Done.
- **Creator studio complete (preprod)** — Done.
- **Live hackathon demo** — Blocker: access token multi-mint bug must be fixed first.
- **Mainnet launch** — First real Tracom Academy course running through the full student flow on Cardano mainnet. Target: September 2026.

---

## 8. Resources Needed

### Personnel

- Lewis Nduati — Lead Developer (build, integration, QA).
- Tracom Academy staff — course content authoring and review.

### Budget

- [Specify allocated budget]

### Equipment / Tooling

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind v4, shadcn/ui (via Andamio design system) |
| Blockchain | Cardano (preprod → mainnet) |
| Wallet integration | MeshJS |
| On-chain protocol | Andamio |
| API | Andamio Database API |
| Preprod gateway | `https://preprod.api.andamio.io` |
| Mainnet gateway | `https://mainnet.api.andamio.io` |

### External Resources

- Andamio protocol and API (a separate Andamio instance is required for mainnet).
- Cardano mainnet wallet and transaction parameters.

---

## 9. Dependencies

- **Live demo depends on** the access token multi-mint bug being fixed. (Done — fixed and gated in May 2026.)
- **Mainnet launch depends on:**
  - Endpoint coverage: no functional gap (see §10). The unused endpoints are off-chain mirrors of on-chain actions the app already performs via the `/tx/` endpoints.
  - A separate Andamio instance configured for mainnet.
  - Switching `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` to the mainnet policy ID.
  - Creating the remaining courses in Studio (POS Developer Fundamentals, Secure Payments and Cybersecurity).
  - Final QA pass on the full student flow on mainnet.
- **Pioneer programme features depend on** mainnet being live and stable.

See `docs/andamio-integration.md` for the API proxy setup, authentication flow, policy IDs, and transaction map.

---

## 10. Risks and Mitigation Plans

### Identified Risks

- **Access token multi-mint bug — RESOLVED (May 2026).** A wallet could mint more than one access token in the same session. The cause was not a missing endpoint: the wallet-balance guards only saw *confirmed* tokens, so during the 20–90s confirmation window a second mint could be submitted. Fixed with an in-flight gate (`useHasPendingAccessTokenTx`) that blocks a second mint/claim until the first reaches a terminal state, applied to both mint surfaces and the v1→v2 migration. Verified by typecheck + unit tests; on-chain behaviour to be confirmed in the final mainnet QA pass.

- **API coverage — not a functional gap (reviewed May 2026).** An earlier tally counted "missing" endpoints, but checking the preprod gateway spec (123 paths) against the implemented hooks shows the 8 unused course endpoints are off-chain data mirrors of actions the app already performs on-chain via the `/tx/` endpoints (teacher management → `tx/.../teachers/manage`; module publish → `update-status`; commitment create/claim/leave → the `/tx/` commit and credential-claim flows). The core student and teacher flows are fully covered. The only open question is whether any *optional* feature behind an unused endpoint is wanted (e.g. a student "withdraw from commitment" / `commitment/leave`); none are required for launch.

- **Mainnet configuration drift.** Mainnet requires a separate Andamio instance, wallet parameters, and policy ID.
  - **Mitigation:** Treat mainnet config as an explicit checklist item with a dedicated QA pass before launch.

- **Low-bandwidth student access.** Many students are on mobile, lower-bandwidth connections.
  - **Mitigation:** Keep the student flow mobile-first and lightweight; QA on representative connections.

---

## 11. Success Criteria

How we know the launch worked, not just that it shipped.

- At least one full Tracom Academy course is live on mainnet and a real student can complete it end to end.
- A student can claim a credential to their own wallet and an outside party can verify it on-chain without contacting Tracom.
- One access token per wallet per course — the multi-mint bug is gone and stays gone.
- Studio users can author and publish a course without developer help.
- The full student flow works on a mid-range Android phone over mobile data.

---

## 12. Minting Fees and Treasury

Every mint on mainnet costs ADA in transaction fees, and that money has to come from somewhere.

**Decision (May 2026): Tracom sponsors the fees.** Students don't hold ADA, and asking them to fund a wallet would lose most of them before they ever finish a course. Tracom pays the fees from a sponsor wallet instead.

**How sponsorship works.** Andamio's gateway has a built-in sponsorship path. Most transaction types — including the access-token mint and credential claim — accept a `sponsor_data` block as an alternative to the self-funded `initiator_data`. The sponsor wallet (a prefunded "tank") pays the fee while the token or credential still goes to the student, who signs as the owner but spends no ADA. The sponsor wallet and its UTxOs are managed through the utxos.dev SDK (`@utxos/sdk`); the gateway enforces a sponsorship quota, so the tank can run dry and must be topped up.

**Current state — this is not yet wired.** The app currently mints on the self-funded path: it sends `initiator_data: walletAddress`, so today the student would pay. There is unused scaffolding (`getWeb3Sdk()` in `utxos-sdk.ts`, the `useSponsoredTransaction` hook), but `getWeb3Sdk` has no callers, the hook is unused, and the `/api/sponsor-migrate` route it calls does not exist. So sponsorship is supported by the gateway but not integrated here. (This corrects an earlier note that called it "mostly built" — the wiring is the work, not a flip of a switch.)

Still to do:

- Provision a utxos.dev project and a sponsor wallet (the tank); set `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY`, `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID`, `NEXT_PUBLIC_WEB3_SDK_NETWORK`, `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID`. Fund it with ADA.
- Add a server route/action that calls the SDK's `getStaticInfo()` to get `sponsor_address`, `static_utxo_ref`, and `collateral_utxo_ref`.
- Switch the mint and credential-claim flows to send `sponsor_data` (with `access_token_receiver` = the student's address) instead of `initiator_data`.
- Handle the "sponsorship quota exhausted" / tank-empty error so students see a clear message instead of a raw failure.
- Estimate per-student cost (access token mint + credential mint per completed course) so the budget reflects it.
- Test the full sponsored flow on a funded preprod tank before mainnet.

See §13 for treasury key custody and the build-out is tracked as its own task.

---

## 13. Security and Data Protection

A credentialing platform holds student records, so this is not optional. Tracom operates in Kenya, which means the Data Protection Act 2019 applies.

- **Student data:** reviewed (see `docs/data-protection-review.md`). The student identity is minimal and mostly pseudonymous — wallet address, chosen alias, and a gateway id. No student names or emails are collected today. The main watch items are assignment free-text and the fact that on-chain data can't be deleted. Open items there: a privacy notice + consent step, a documented position on deletion of on-chain data, and confirming where the gateway is hosted.
- **Wallet custody:** confirmed. Students hold their own keys through their wallet over MeshJS/CIP-30; the app only ever receives addresses and signatures, never private keys. Keep it that way and state it plainly to users.
- **Treasury keys:** Tracom sponsors minting (see §12), so the sponsor wallet's key is a high-value secret. With the utxos.dev path that key is `WEB3_SDK_PRIVATE_KEY`, held server-only in the deploy environment (Vercel) and never shipped to the client. Decide who can rotate it and how the tank is funded and monitored. The sponsor wallet only funds fees — it should hold no more ADA than the tank needs, to cap the blast radius if the key leaks.
- **Secrets:** audited May 2026 and clean. No env files are tracked or appear anywhere in git history, `.env`/`.env.local` are gitignored, `.env.example` holds only placeholders, and the real secrets (`ANDAMIO_API_KEY`, `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY`) are all server-only in the env schema, never shipped to the client. Keep mainnet values separate from preprod.

---

## 14. Hosting, Deployment, and Rollback

- **Hosting (decided May 2026): Vercel.** Native fit for Next.js 14 App Router and auto-detected, so no `vercel.json` is needed — the framework, build, and routing are inferred. Deploy config that matters lives in the Vercel project (env vars and which branch is production), not in the repo.
- **Build:** the committed generated types (`src/types/generated/`) mean Vercel's default `next build` works without a type-generation step. `npm run check` (lint + typecheck) is the gate to run in CI before a production deploy.
- **Environments:** map Vercel's Production environment to mainnet and Preview to preprod, and set these per-environment so a preview never points at mainnet:
  - `NEXT_PUBLIC_CARDANO_NETWORK` — `mainnet` vs `preprod`
  - `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` — mainnet vs preprod policy id
  - `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` — mainnet vs preprod gateway
  - `ANDAMIO_API_KEY`, `WEB3_SDK_API_KEY`, `WEB3_SDK_PRIVATE_KEY` — server-only, separate keys per environment
  - A wrong value here means minting against the wrong network, so treat the mainnet env set as a pre-launch checklist item.
- **Rollback:** decide the plan for reverting a bad mainnet deploy. On-chain mints can't be undone, so the priority is catching problems before a transaction is signed, not after.

---

## 15. Testing and QA

Current state is light: lint, typecheck, and a small `test:unit` script (Node's test runner via tsx). No end-to-end or component test framework is set up.

- **Now:** `npm run check` plus manual walkthroughs of the student and studio flows on preprod.
- **Before mainnet:** a full manual QA pass of the student flow on mainnet, including a real mint and a real credential claim, on mobile.
- **Worth adding:** automated coverage for the transaction-building paths, since those are where money and on-chain state are at stake.

---

## 16. Post-Launch Support and Maintenance

- **Owner:** Lewis Nduati maintains the platform after launch (bug fixes, dependency updates, Andamio API changes).
- **Support:** decide how students and studio users report problems and who responds.
- **Monitoring:** watch for failed transactions and minting errors so a broken flow is caught before students hit it at scale.

---

## Related Documents

- `PRODUCT.md` — product purpose, users, brand voice, and design principles
- `DESIGN.md` — Andamio design system rules and component conventions
- `docs/andamio-integration.md` — Andamio API and transaction reference
- `docs/course-structure.md` — course curriculum and module outlines

---

## Appendix: Andamio API Coverage Snapshot

58 of 74 endpoints implemented (78% overall). Note: the unimplemented count is not a functional gap — see §10. The unused endpoints are off-chain mirrors of on-chain actions the app already performs via the `/tx/` endpoints, plus optional features not required for launch.

| Area | Implemented | Total | Notes |
|---|---|---|---|
| Authentication | 2 | 2 | Complete |
| Introduction | 4 | 4 | Complete |
| Lesson | 6 | 6 | Complete |
| Assignment | 5 | 5 | Complete |
| Projects / Treasury | 3 | 3 | Complete |
| Task management | 4 | 4 | Complete |
| Credentials | 1 | 1 | Complete |
| My Learning | 1 | 1 | Complete |
| Transaction | 1 | 1 | Complete |
| Learning Target | 6 | 7 | 1 endpoint missing |
| Course Module | 10 | 11 | 1 endpoint missing |
| Course | 7 | 9 | 2 endpoints missing |
| Access Token | 2 | 3 | 1 endpoint missing — likely the pre-mint check |
| Assignment Commitment | 5 | 8 | 3 endpoints missing |
| Task Commitments | 1 | 7 | Not current scope |
| Contributor | 0 | 1 | Not current scope |
| Prerequisites | 0 | 1 | Not current scope |
