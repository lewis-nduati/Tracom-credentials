# Mainnet Launch Checklist

**Owner:** Lewis Nduati
**Status:** Pre-launch (app runs on preprod today)

A tickable list for taking Tracom Academy Credentials to Cardano mainnet. Hand the Andamio/billing parts to whoever at Tracom owns the accounts.

## Read this first: test on preprod, not mainnet

The app runs on **preprod** today, and that's where all testing and debugging should stay. Preprod uses **free test ADA** from the faucet, so you can mint, claim, create courses, and break things at no cost.

**Mainnet is real money on every transaction.** Two ways it costs you:

1. Every submitted transaction pays a fee — usually a fraction of an ADA, up to about 1 ADA.
2. If a smart-contract transaction *fails validation on-chain*, the **collateral you set aside (around 5 ADA) is forfeited**. A buggy mainnet transaction can burn real ADA, not just a fee.

So: iterate and debug on preprod, and reserve mainnet for a single careful smoke test once preprod is solid. There is no reason to debug on mainnet.

A small amount of ADA (~1.5) also stays locked in the UTxO that holds each minted token — it isn't a fee, but it's ADA tied up per token.

## What to obtain

- [ ] **Mainnet Andamio account + API key.** Mint a mainnet Andamio access token for Tracom's operator wallet (`mainnet.app.andamio.io`), register with the mainnet gateway, and generate a mainnet API key. API usage is billed to that key's account, so confirm Andamio's mainnet pricing/plan.
- [ ] **Mainnet Blockfrost project ID.** Free at blockfrost.io, but a mainnet key (must not start with `preprod`). Used for social-wallet transaction submission and the indexer fallback.
- [ ] **utxos.dev project on mainnet** (this is the fee-sponsorship "tank"). Create a project, generate an API key, create a Sponsorship, and note the sponsorship and project IDs.
- [ ] **Funded wallets, in real ADA:**
  - [ ] The **course-owner wallet** (Tracom's), to create courses and register modules on-chain.
  - [ ] The **sponsor tank** (utxos.dev), to cover each student's access-token mint and credential claim.

### Rough budget

- One-time: course creation + module registration for each course (owner pays).
- Per student: access-token mint + credential claim (sponsor tank pays, once sponsorship is wired).
- Plus a buffer. Fill the exact figure into `build-document.md` §8 once you know the per-transaction fees and expected student numbers.

## Who pays for what

- **Students:** nothing, once sponsorship is wired (the tank covers their mint and claim).
- **Sponsor tank (Tracom):** student mints and credential claims.
- **Course-owner wallet (Tracom):** course creation and module registration — these are owner actions, not sponsored.

## Set these in Vercel (Production environment)

Map Vercel **Production** to mainnet and **Preview** to preprod so a preview deploy never points at mainnet.

| Variable | Mainnet value |
|---|---|
| `NEXT_PUBLIC_CARDANO_NETWORK` | `mainnet` |
| `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` | `https://mainnet.api.andamio.io` |
| `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` | `ff5d0640b5a2717646d3f3151d100d57d194fdfa88cacf03f9edc568` |
| `ANDAMIO_API_KEY` | mainnet key |
| `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` | mainnet Blockfrost key |
| `NEXT_PUBLIC_WEB3_SDK_PROJECT_ID` | utxos.dev project id |
| `WEB3_SDK_API_KEY` | utxos.dev api key (server-only) |
| `WEB3_SDK_PRIVATE_KEY` | sponsor wallet key (server-only) |
| `UTXOS_SPONSORSHIP_ID` | utxos.dev sponsorship id |
| `NEXT_PUBLIC_WEB3_SDK_NETWORK` | `mainnet` |
| `NEXT_PUBLIC_COURSE_OWNER` | Tracom's mainnet owner alias (if used) |

The mainnet access-token policy ID above is taken from `.env.example` — confirm it's still current with Andamio before launch.

## Order of operations (the critical path)

The sponsorship code isn't wired yet — today the app mints self-funded, so if you flip to mainnet first, students would be asked to pay real ADA themselves. Do it in this order:

1. [ ] Set up utxos.dev (project, sponsorship, funded tank).
2. [ ] Wire fee sponsorship into the mint and credential-claim flows (build-document §12; tracked task). Test it on a funded **preprod** tank first.
3. [ ] Obtain the mainnet Andamio API key and Blockfrost key.
4. [ ] Set the Production env vars above in Vercel.
5. [ ] Create the courses on mainnet (the preprod courses don't carry over).
6. [ ] Final smoke test on mainnet: one real mint, one real credential claim, on mobile.

## Before real students

- [ ] Add the privacy notice + consent step (see `docs/data-protection-review.md`), and tell students up front that the credential is permanent and public on-chain.
- [ ] Confirm where the Andamio gateway is hosted (cross-border data transfer under Kenya's DPA).

## Related documents

- `docs/build-document.md` — §12 (fees/treasury), §13 (security), §14 (hosting/env)
- `docs/data-protection-review.md` — privacy obligations before launch
