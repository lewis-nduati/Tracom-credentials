# Tracom Academy Credentials — Team Presentation

**Presenter:** Lewis Nduati
**Date:** _(set at scheduling)_
**Audience:** Tracom Services / Tracom Academy leadership and staff
**Status:** Running on Cardano preprod (testnet). Not yet on mainnet.

This is the running order for the meeting, with talking points under each slide and a live
demo script. Section numbers map to slides.

---

## 1. The one-line

Tracom Academy can now issue course credentials that live in the student's own wallet and
that any employer can verify without calling Tracom. It's built and running on a test
network today. This meeting is about what it takes to put it in front of real students.

---

## 2. The problem we're solving

- A student who finishes a Tracom programme gets a PDF or a printed certificate.
- It's only as credible as whoever receives it decides to treat it.
- Verifying it means phoning Tracom. The student doesn't really own the record, and it
  isn't portable.
- Tracom trains thousands of professionals a year with no system that makes those
  qualifications checkable or permanent.

## 3. What we built instead

When a student completes the work, a credential is minted on Cardano and lands in their
own wallet.

- Nobody can edit or delete it, not even us.
- An employer verifies it directly on-chain, without calling Tracom.
- The student keeps it even if Tracom's systems change or go offline. A credential issued
  in 2026 still checks out in 2040.
- It's designed to feel like software a bank would ship, not a blockchain demo. The student
  never has to understand Cardano.

One point worth making out loud: this is Tracom's branded interface on top of the Andamio
protocol. We are not writing or auditing smart contracts. Andamio handles the on-chain
layer, which keeps our cost and risk down.

---

## 4. What's working today (preprod)

Both sides of the product are built and running.

**Student journey**
- Connect a Cardano wallet and mint an access token. This is the student's enrollment and
  on-chain identity.
- Browse courses, read modules and lessons.
- Submit assignment evidence on-chain.
- Claim the course credential to their wallet once an instructor approves.

**Creator studio (for Tracom staff)**
- Author courses, modules, lessons, introductions, and assignments.
- Define student learning targets.
- Import course content from prepared markdown.
- Review student submissions and issue credentials, with no ambiguity about what state
  anything is in.

**Under the hood**
- Andamio API integration covering the full student and teacher flows.
- Plain-English messages when a transaction fails, instead of raw blockchain errors.
- Branded throughout, and deployed to Vercel.

---

## 5. Live demo

> Run against the local app (http://localhost:3000) or the preprod deployment. Have the
> Eternl wallet extension set to Pre-Production before you start, and a wallet with faucet
> tADA. None of this costs real money; it's a test network.

Suggested path, about five minutes:

1. **Landing page.** Show the public page, the first thing a prospective student sees. Point
   out that it reads like Tracom, not like a crypto product.
2. **Connect wallet and mint access token.** Connect Eternl, choose an alias, sign. Narrate
   that this is enrollment and the token is the student's identity. Confirmation takes
   roughly 60 to 90 seconds on-chain, so have a pre-minted wallet ready and don't wait on
   stage.
3. **Browse a course and open a module.** Show the reading view and an assignment.
4. **Studio side.** Switch to the studio: the course and module editor, and the assignment
   review queue. This is the staff experience.
5. **The credential.** Show a claimed credential on the credentials page, and make the
   verification point: anyone can check this on-chain without Tracom.

A note on demo safety: rehearse once beforehand on the exact wallet you'll use. The
on-chain confirmation wait is the only thing that can make the demo feel slow, so pre-mint
where you can and keep a backup screen recording in case the network is sluggish.

---

## 6. What's left before real students (mainnet)

We've kept everything on the free test network while building. Going live with real
students means moving to Cardano mainnet, where every transaction costs real ADA. The
remaining work is mostly setup and decisions, not new features.

- **Fee sponsorship**, so students pay nothing and Tracom covers the small per-transaction
  fee from a funded "tank" wallet. This code path isn't wired yet, and it depends on a paid
  plan (see §7).
- **Mainnet accounts and keys**: a mainnet Andamio API key, a Blockfrost key, and funded
  Tracom wallets.
- **Create the real courses on mainnet.** The preprod courses don't carry over.
- **A privacy notice and consent step**, because Kenya's Data Protection Act applies and
  on-chain records can't be deleted.
- **One careful smoke test on mainnet**, then open it to students.

The full tickable list lives in `docs/mainnet-launch-checklist.md`.

---

## 7. Decisions and costs for Tracom

These are the things I can't decide alone. They need Tracom to weigh in.

- **Fee sponsorship is a paid feature.** For students to pay nothing, we use a fee
  sponsorship service (utxos.dev), which needs a paid plan plus ADA in the tank wallet.
  That's a recurring cost. The alternative, students funding their own wallets, would lose
  most of them before they finish. My recommendation is that Tracom sponsors. It needs a
  budget line.
- **Per-student cost.** Each student costs an access-token mint plus a credential claim in
  ADA fees. We'll put a firm figure against expected student numbers once we've measured
  mainnet fees.
- **Who owns the wallets and keys.** The sponsor tank wallet and the course-owner wallet
  are Tracom's. We need to agree who holds them, who tops them up, and who rotates the keys.
- **Data protection.** We collect very little (a wallet address and an alias) and no names
  or emails today. Before real students we need a privacy notice, a consent step, and a
  clear position that the credential is permanent and public on-chain.
- **Which courses launch first.** We have content prepared for three. We need Tracom to
  confirm the first one to take live.

---

## 8. Timeline

- Build started September 2025.
- Now: full student and studio flows working on preprod.
- Mainnet launch target: September 2026, with the first real Tracom Academy course running
  end to end.

## 9. The ask

1. Agreement on fee sponsorship and the budget for it.
2. A decision on which course launches first.
3. Owners named for the Tracom wallets and keys.
4. Go-ahead to start the privacy and consent work.

---

## Appendix — quick facts for Q&A

- **Is this on the real blockchain yet?** No. It runs on Cardano's test network (preprod),
  where transactions are free. Mainnet is the launch step.
- **Did you build the blockchain part?** No. We use Andamio's existing protocol and built
  Tracom's interface on top. Lower cost, lower risk, no contracts to audit.
- **Can a student lose their credential?** It's in their wallet, like cash, so normal wallet
  backup applies. Nobody can revoke or edit it, including us.
- **What does an employer do to check it?** They verify the credential directly on-chain.
  No call to Tracom, no third-party registry.
- **What does it cost to run?** Per-transaction ADA fees, a fraction of an ADA each, plus
  the fee-sponsorship subscription. Firm numbers come after the first mainnet measurements.
</content>
