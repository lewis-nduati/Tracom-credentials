# Andamio Integration

This document explains how Tracom Academy connects to the Andamio protocol — which endpoints are used, how authentication works, and how each step of the credential flow maps to an on-chain transaction.

---

## Overview

Tracom Academy uses Andamio as its credentialing infrastructure. Andamio provides:

- A unified API gateway that combines on-chain data (from Cardano) with off-chain content (course metadata, module content)
- Transaction building endpoints that construct Cardano transactions without requiring the app to handle raw CBOR
- An SSE-based transaction watcher that streams confirmation status back to the client
- A JWT authentication system tied to Cardano wallet signatures

Tracom's app is a Next.js frontend that calls Andamio's API through a server-side proxy. The proxy injects the API key so it is never exposed to the client.

---

## Environments

| Environment | Gateway URL | Network |
|---|---|---|
| Preprod (current) | `https://preprod.api.andamio.io` | Cardano Pre-Production |
| Mainnet (future) | `https://api.andamio.io` | Cardano Mainnet |

All current deployments run on preprod. Mainnet requires a separate Andamio instance provisioned for Tracom.

---

## Authentication

### API Key
Server-side requests to the Andamio gateway use an API key set in `ANDAMIO_API_KEY`. This key is injected by the Next.js API proxy at `/api/gateway/[...path]` and never sent to the browser.

### User JWT
Users authenticate by connecting a Cardano wallet and signing a challenge message. Andamio issues a JWT tied to the wallet's Access Token alias. This JWT is stored client-side and sent with authenticated requests.

The JWT contains:
- `accessTokenAlias` — the user's chosen on-chain identity
- `walletAddress` — the Cardano address that holds the Access Token
- Standard expiry claims

JWTs expire and must be refreshed by re-signing with the wallet. The CLI stores its own JWT separately at `~/.andamio/config.json`.

---

## Key Policy IDs

| Token | Policy ID | Network |
|---|---|---|
| Access Token (preprod) | `29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78` | Preprod |
| Access Token (mainnet) | `ff5d0640b5a2717646d3f3151d100d57d194fdfa88cacf03f9edc568` | Mainnet |

The Access Token policy ID is set in `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID`. It determines which token the wallet connection flow looks for when authenticating a user.

---

## Course Registry

| Course | Course ID (Policy ID) | Status |
|---|---|---|
| Introduction to Blockchain | `72b318fb2a8add8e92d73c73dd187fd6cd70af7e98f5e3781f422079` | Live on preprod |
| POS Developer Fundamentals | TBD | Pending creation |
| Secure Payments and Cybersecurity | TBD | Pending creation |

The course owner alias is `EverydayLewis_test`. This is set in `NEXT_PUBLIC_COURSE_OWNER` to filter the course browse page.

---

## API Proxy

All client requests to Andamio go through two Next.js proxy routes:

```
/api/gateway/[...path]        → standard requests (REST)
/api/gateway-stream/[...path] → SSE streams (transaction status)
```

The proxy appends the `x-api-key` header and forwards the request to the configured gateway URL. This keeps the API key server-side and allows the gateway URL to be changed without a client redeploy.

---

## Credential Flow — Transaction Map

Each step in the student credential journey corresponds to a specific Andamio transaction type.

### 1. Mint Access Token
**Transaction:** `GLOBAL_ACCESS_TOKEN_MINT`
**Who:** Student
**What happens:** A Cardano native token is minted to the student's wallet. The token name encodes the student's chosen alias. This is the student's on-chain identity — required before any other action.
**Component:** `src/components/tx/mint-access-token.tsx`

### 2. Enroll in Course
Enrollment is implicit — holding an Access Token grants access to any public course. No separate enrollment transaction required.

### 3. Commit Assignment
**Transaction:** `COURSE_STUDENT_ASSIGNMENT_COMMIT`
**Who:** Student
**What happens:** The student submits their assignment evidence. A hash of the submission is recorded on-chain against the course module. The student cannot modify their submission after this point without a separate update transaction.
**Component:** `src/components/tx/assignment-commitment.tsx`

### 4. Assess Assignment
**Transaction:** `COURSE_TEACHER_ASSIGNMENT_ASSESS`
**Who:** Instructor
**What happens:** The instructor reviews the student's commitment and signs an approval transaction. This is a permanent, on-chain record of the assessment decision.
**Component:** `src/components/tx/assess-assignment.tsx`

### 5. Claim Credential
**Transaction:** `COURSE_STUDENT_CREDENTIAL_CLAIM`
**Who:** Student
**What happens:** Once assessed, the student claims their course credential — a Cardano native asset minted to their wallet. The credential token name encodes the course ID and the student's alias. It is permanent and non-transferable in practice (though technically a native token).
**Component:** `src/components/tx/credential-claim.tsx`

---

## Module Credentials

Each course module is itself an on-chain credential (an SLT — Student Learning Target hash). When a student completes a module, the module's SLT hash is recorded against their alias.

Course 1 module hashes:

| Module | Code | SLT Hash |
|---|---|---|
| What Is Blockchain? | 101 | `bb7182f2aa625fd58a1bfd9bc1cc2769a001dea000c5ffe4593aabe64cb12dc8` |
| How Transactions Work | 102 | `0e9e544c7a9c88ee412f8bd9ae13d787f93ac7c73d130dd70a4bd4ca16197773` |
| Consensus Mechanisms | 103 | `8dab604f8d7edaa0656f5bb83de23311d3f9f39543cc34907c23acdcba2689d3` |
| Cardano and Andamio | 104 | `048cb4eb9e2dc6e83cee5d05f4afbc0c2b632e758c8b34eec50d6c1cec3a284d` |

---

## Andamio CLI

The Andamio CLI (`andamio` v0.3.0) is used for administrative tasks during development — creating courses, listing courses, and managing the developer JWT.

```bash
# Authenticate (opens browser for wallet signing)
andamio user login

# List all courses on this instance
andamio course list

# Check current auth status
andamio user whoami
```

The CLI stores its JWT at `~/.andamio/config.json`. JWTs expire — re-run `andamio user login` if CLI commands return 401.

---

## Further Reading

- [Andamio Protocol Documentation](https://docs.andamio.io)
- [Andamio V2 Transaction Reference](https://docs.andamio.io/docs/protocol/v2/transactions)
- [Cardano Preprod Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
- [Preprod Block Explorer](https://preprod.cardanoscan.io)
