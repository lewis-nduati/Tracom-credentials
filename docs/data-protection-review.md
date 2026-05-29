# Data Protection Review — Tracom Academy Credentials

**Author:** Lewis Nduati
**Date:** May 2026
**Status:** Engineering review, not legal sign-off

This is an engineering-side review of what personal data the platform handles, where it lives, and how that lines up with Kenya's Data Protection Act 2019 (DPA). It's meant to surface gaps before mainnet launch. It is not legal advice. Anything flagged as a question should go to someone who can give a legal opinion, especially registration with the Office of the Data Protection Commissioner (ODPC).

## What personal data we actually handle

The short version: very little, and most of it is pseudonymous. A student is identified on the platform by three things.

| Data | What it is | Where it lives | Why we have it |
|---|---|---|---|
| Wallet address (`cardanoBech32Addr`) | The student's Cardano address | Gateway DB, on-chain, JWT | Identifies the wallet that holds the credential |
| Access token alias | A handle the student chooses (e.g. `john_doe`) | Gateway DB, on-chain | The student's public identity across courses and credentials |
| Gateway user id | Internal record id | Gateway DB, JWT | Links the account to its data |
| Course progress and submissions | Lessons completed, assignment text | Gateway DB | Tracks learning and drives credential issuance |

Two things worth saying plainly:

- **We do not collect student names, emails, or phone numbers.** The email and verification code in `andamio-auth.ts` belongs to the operator's developer/API account (the account that holds the Andamio API key), not to students. Students authenticate by signing a message with their wallet.
- **A wallet address and an alias are still personal data under the DPA** if they can be linked back to a person. Pseudonymous is not the same as anonymous. Treat them as personal data.

The one place free-form personal data can leak in is **assignment submissions**. A student can type anything into an assignment, including details about themselves. That content sits in the gateway database.

## Where the data lives

Three places, with different rules for each.

1. **On-chain (Cardano).** The access token (alias) and credentials are minted as native assets. This is public, permanent, and cannot be edited or deleted by anyone — that's the whole point of the product, but it's also the sharpest tension with the DPA (see below).
2. **Andamio Gateway database (off-chain).** User records, course content, progress, and submissions. Operated by Andamio, reached through a server-side proxy in this app using the operator's API key.
3. **The browser.** A JWT in `localStorage` (the session token), plus small bookkeeping items: a pending alias, pending transaction registrations, a post-mint flag, and a pending project title in `sessionStorage`. No long-term personal data is stored client-side beyond the session token.

## Who can access it

- **The student** — their own data, through their wallet and session.
- **Tracom Academy staff** — studio users review submissions and issue credentials, so they see student aliases, wallet addresses, and submission content.
- **Andamio** — runs the gateway database and the chain indexing, so it processes the off-chain data on Tracom's behalf.
- **Anyone, for on-chain data** — credentials and the access token are public on Cardano by design.

## Wallet custody

The app never holds private keys. Wallet connection goes through MeshJS over CIP-30, so signing happens inside the student's own wallet (Lace, Eternl, and so on). The app only ever receives addresses and signatures. This is good for data protection: we are not a custodian, and we can't move a student's assets. It should be stated plainly to users somewhere they'll see it.

## How this maps to the DPA 2019

**Roles.** Tracom Academy is the data controller — it decides why and how student data is processed. Andamio is a data processor (and where it brings its own sub-processors, a sub-processor). That relationship should be covered by a written data processing agreement. Confirm one exists or put one in place.

**Lawful basis.** Processing needs a lawful basis under the DPA. For course delivery and credentialing, that's most likely performance of a contract with the student plus consent for anything beyond it. The enrollment flow should make clear what's collected and why, and capture consent where consent is the basis.

**Data subject rights.** The DPA gives people the right to access, correct, and delete their data, and to object to processing. This is where the on-chain design needs a clear answer:

- Off-chain data in the gateway can be corrected or deleted on request.
- **On-chain data cannot be deleted.** A minted credential and the access token alias are permanent. We need a documented position on how we handle a deletion request for on-chain data, and we need to tell students up front, before they mint, that the credential is permanent and public. Going in, informed, changes the analysis. Discovering it after the fact does not.

**Data minimisation.** The platform already does well here — it collects little, and most of it is pseudonymous. The main watch item is assignment submissions, where students can over-share. Worth a short note in the UI telling students not to put sensitive personal details in submissions.

**Cross-border transfers.** If the Andamio gateway or its infrastructure sits outside Kenya, that's a cross-border transfer of personal data, which the DPA regulates. Confirm where the gateway and its database are hosted, and make sure the transfer has a valid basis.

## Gaps and recommendations

Before mainnet:

- Confirm a data processing agreement is in place with Andamio.
- Add a privacy notice and consent step to the enrollment flow, stating what's collected, why, and that the credential and alias are permanent and public on-chain.
- Document the position on deletion requests for on-chain data, since the data genuinely cannot be removed.
- Add a line in the assignment UI warning students not to include sensitive personal details.
- Confirm where the gateway and its database are hosted, and whether that's a cross-border transfer.
- Check whether Tracom needs to register with the ODPC as a data controller.

Open questions for the team:

- Will students ever provide a name or email (for certificates, notifications, support)? If so, this review needs revisiting — that's a real expansion of the personal data we hold.
- Who is the named data protection contact at Tracom?

## Related documents

- `docs/build-document.md` — project build document (§13 Security and Data Protection)
- `docs/andamio-integration.md` — how the gateway proxy and auth work
