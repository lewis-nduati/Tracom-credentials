# Product

## Register

product

## Users

Two primary users:

**Students** — Kenyan fintech and technology professionals enrolled at Tracom Academy. Working adults, not full-time students. They care about outcomes: a credential that helps them get hired or promoted. They are mobile-first, may be on lower-bandwidth connections, and expect institutional weight from Tracom — not an experiment. They interact with the app to enroll in courses, submit assignments, and claim credentials to their wallets.

**Instructors / Studio users** — Tracom Academy staff and course administrators who review assignments, manage course content, and issue credentials. They need efficiency and clarity: a clear queue of work to do, no ambiguity about state.

## Product Purpose

Tracom Academy issues blockchain credentials on Cardano via the Andamio protocol. This replaces paper certificates — which employers can't verify — with on-chain tokens that any employer can independently verify without contacting Tracom. The student's wallet holds the credential permanently. The product exists to make that flow feel like an institutional product, not a blockchain demo.

Success looks like: a student in Nairobi completes a course, earns a credential, and sends an employer a verifiable proof of it — all without those parties needing to understand Cardano.

## Brand Personality

Authoritative, clear, trustworthy.

Tracom is Kenya's leading payments and software training institution. The product should feel like it was built by people who take professional credentials seriously. Confident without being cold. Direct without being blunt. Institutional without being bureaucratic.

Voice: formal enough to convey weight, plain enough for anyone to follow. No hype, no jargon.

## Anti-references

- **Generic SaaS template** — blue-white default Tailwind apps that look like every other startup tool. No hero-metric cards. No identical card grids with icon + heading + text.
- **Crypto/web3 aesthetic** — neon gradients, dark glass cards, DeFi energy. The blockchain is the engine; it should be invisible. Students shouldn't feel like they're using a crypto app.
- **Overproduced edtech** — Coursera/Udemy style. No generic hero stock photos, no certificate clip-art, no emoji-heavy marketing.

## Design Principles

1. **The blockchain is invisible.** On-chain actions should feel as natural as clicking "Save". Wallet confirmations are shown clearly but without blockchain jargon. Students complete a course; the credential just appears.

2. **Institutional weight, not institutional boredom.** Tracom is a serious institution. The interface earns that trust through precision: clear hierarchy, unambiguous labels, deliberate spacing. Not through gray walls or endless forms.

3. **Earned progression.** The UI reflects what a student has actually done. Locked states are honest. Completed states are celebrated — briefly, without fanfare. No fake engagement mechanics.

4. **Every word is final.** Copy should read like something a professional training institution would sign off on. No "Oops!", no emoji, no casual hedging. Clear, complete, direct.

5. **Mobile is a first-class citizen.** Kenyan professionals are on phones. Every layout must work at 375px. Touch targets are minimum 44px. Nothing that requires hover to function.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Non-negotiable for any color pair used in the product.

Reduced-motion media query is already implemented in globals.css — preserve it in all animation work.

Consider: users on mobile data connections in Kenya. Avoid heavy images, unoptimized fonts, or animation that increases layout shift. Prefer text over images for critical credential content.
