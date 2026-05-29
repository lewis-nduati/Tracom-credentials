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

- **Start Date:** [Enter the project start date]
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

- **Live demo depends on** the access token multi-mint bug being fixed.
- **Mainnet launch depends on:**
  - Completing missing Course and Course Module endpoint coverage.
  - Implementing missing Assignment Commitment endpoints.
  - A separate Andamio instance configured for mainnet.
  - Switching `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` to the mainnet policy ID.
  - Creating the remaining courses in Studio (POS Developer Fundamentals, Secure Payments and Cybersecurity).
  - Final QA pass on the full student flow on mainnet.
- **Pioneer programme features depend on** mainnet being live and stable.

See `docs/andamio-integration.md` for the API proxy setup, authentication flow, policy IDs, and transaction map.

---

## 10. Risks and Mitigation Plans

### Identified Risks

- **Access token multi-mint bug (critical).** A wallet can mint more than one access token in the same session. Likely cause is the unimplemented third endpoint in the Access Token group — probably a pre-mint check for whether a wallet already holds an active token. Without it, the frontend cannot gate the minting flow.
  - **Mitigation:** Compare the three Access Token endpoints in the Andamio API docs (`https://mainnet.api.andamio.io/api/v1/docs/doc.json`) against the codebase to identify the missing endpoint, implement it, and gate the mint flow. Must be done before any live presentation or mainnet launch.

- **Incomplete API coverage.** 16 of 74 endpoints remain (Course, Course Module, Assignment Commitment gaps in current scope).
  - **Mitigation:** Prioritize Course, Course Module, and Assignment Commitment endpoints before mainnet; defer task commitments, contributor, and prerequisites to the pioneer programme.

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

Every mint on mainnet costs ADA in transaction fees, and that money has to come from somewhere. This needs a decision before launch.

- **Open question:** who pays the fee for minting an access token and a credential — Tracom (from a funded treasury wallet), or the student?
- Students are unlikely to hold ADA, so making them pay adds a wallet-funding step that will lose people. The likely answer is Tracom sponsors the fees.
- **To decide / do:** confirm the model, fund and secure a treasury wallet if Tracom sponsors, and estimate per-student cost (access token mint + credential mint) so the budget reflects it.

---

## 13. Security and Data Protection

A credentialing platform holds student records, so this is not optional. Tracom operates in Kenya, which means the Data Protection Act 2019 applies.

- **Student data:** identify what personal data is stored (names, emails, wallet addresses), where it lives, and who can access it. Map it against the Data Protection Act 2019.
- **Wallet custody:** students hold their own keys through their wallet (MeshJS). The app never takes custody — make sure that stays true and is stated clearly to users.
- **Treasury keys:** if Tracom sponsors minting, the treasury wallet's keys are a high-value secret. Decide how they're stored and who can sign.
- **Secrets:** API keys and policy IDs come from environment variables (`.env.example` documents them). Confirm no secrets are committed and mainnet values are kept separate from preprod.

---

## 14. Hosting, Deployment, and Rollback

- **Hosting:** not yet decided/committed (no deploy config in the repo). Pick a host and add the config before launch.
- **Build:** `npm run compile` generates Andamio types then builds; `npm run check` runs lint and typecheck.
- **Environments:** keep preprod and mainnet fully separate — different Andamio instance, gateway, and `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID`. A wrong env var here means minting against the wrong network.
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

58 of 74 endpoints implemented (78% overall).

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
