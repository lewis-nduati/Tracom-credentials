# Tracom Academy — Course Structure

> ⚠️ **Working Draft**
> Course content is a working draft for the Gimbalabs Piece of Pie hackathon demonstration. Technical details referencing Tracom terminal specifications and API field names require review and sign-off from Tracom's technical team before use with real students. M-Pesa integration references are based on the public Daraja API documentation.

## Narrative Arc

The three courses tell a single story that leads to the capstone project:

1. **Course 1 — Introduction to Blockchain** *(complete)*
   Blockchain is a trust layer. Here's how it works and why it matters for payments.

2. **Course 2 — POS Developer Fundamentals** *(this document)*
   Here's how a POS system actually works — hardware, gateways, and the API layer that connects them.

3. **Course 3 — Secure Payments and Cybersecurity**
   Here's how attackers target that stack — and how you lock it down.

4. **Project — Build a POS Integration**
   Build the integration you designed in Course 2, secured using the principles from Course 3. Earn a verifiable on-chain credential.

---

## Course 2 — POS Developer Fundamentals

**Target learner:** Junior developer. Knows basic programming. New to payments and POS systems.

**Course goal:** By the end of this course, the learner can describe the full lifecycle of a payment transaction — from card tap to settlement — and can design the architecture of a POS integration using Tracom terminals and a payment gateway.

**Course ID:** to be created in Studio

---

### Module 201 — Anatomy of a POS System

**Introduction**

When a customer taps their card at a Tracom terminal, a lot happens in under two seconds. This module pulls apart every layer — the physical hardware, the software stack, and the network path — so you understand what you're building on before you write a single line of code.

**Lessons**

1. **The hardware layer**
   - What a POS terminal is: card reader, display, keypad, printer, connectivity (Ethernet, 4G, Wi-Fi)
   - Tracom's terminal lineup: the models, their capabilities, and which integration paths they support
   - How a card reader works: magnetic stripe, EMV chip, contactless (NFC/tap) — why each exists and what data each captures

2. **The software stack**
   - What runs on the terminal: firmware, payment kernel, communication stack
   - What runs on your server: the merchant application that talks to the terminal and to the gateway
   - The separation of concerns: the terminal handles card data, your app handles business logic

3. **Transaction types**
   - Purchase: the most common flow
   - Refund: returning money to the card
   - Void: cancelling a transaction before settlement
   - Reversal: what happens when a transaction times out and you're not sure if it went through

**Assignment**

Draw the component map of a Tracom POS transaction. Label: the terminal, your application server, the payment gateway, the acquirer bank, the card network, and the issuer bank. Show the direction of each message. You'll use this diagram throughout the rest of the course.

---

### Module 202 — Payment Gateways and the Money Rail

**Introduction**

A payment gateway is the software bridge between a merchant's terminal and the banking system. Understanding how gateways work — and how they sit inside the larger payment network — is the foundation of every integration you'll ever build.

**Lessons**

1. **What a payment gateway does**
   - Receives the transaction from the terminal (or app)
   - Routes it to the correct acquirer bank
   - Returns an authorization code (approved/declined) in real time
   - Queues the transaction for settlement (the actual money movement, which happens later)

2. **The payment network**
   - Acquirer bank: Tracom's banking partner that processes the transaction on the merchant's behalf
   - Card networks: Visa and Mastercard sit between acquirer and issuer, enforcing rules and routing
   - Issuer bank: the customer's bank that approves or declines based on available funds
   - Why this matters: you need to understand where a failure can occur to handle it correctly

3. **Mobile money in East Africa**
   - M-Pesa and how it differs from card: no issuer bank, no card network — a wallet-to-wallet instruction via Safaricom
   - The M-Pesa API (Daraja): how a payment request is initiated, confirmed, and how the callback works
   - Key difference: M-Pesa is push-based (customer initiates), card is pull-based (merchant initiates)

4. **Authorization vs settlement**
   - Authorization: the issuer says "yes, the funds are reserved" — happens in real time
   - Capture: the merchant says "charge it now" — can happen at time of auth or later
   - Settlement: the actual money movement, batched at end of day
   - Why this matters: a transaction can be authorized but never settled — you must handle both states

**Assignment**

Pick one card transaction and one M-Pesa transaction. For each, write out every step from the customer's action to money reaching the merchant's account. Identify at which step each can fail, and what a developer should do when that step fails.

---

### Module 203 — APIs and the Integration Layer

**Introduction**

POS integration is fundamentally API integration. This module teaches you how to read a payment API spec, understand what the terminal sends and expects back, and use a sandbox environment to test without moving real money.

**Lessons**

1. **APIs for junior developers**
   - What an API is: a contract between two systems — "send me this, I'll send you back that"
   - REST and JSON: the format that most payment APIs use
   - HTTP methods and status codes: POST for transactions, 200 vs 400 vs 500 and what each means in a payment context

2. **How Tracom terminals communicate**
   - The terminal sends a transaction request: what fields it includes (amount, currency, card data reference, merchant ID, terminal ID, transaction reference)
   - The gateway sends back a response: approval code, response code, response message, transaction ID
   - The two must always be matched: every request must have a unique reference you generate, so you can track it regardless of what happens to the network

3. **Reading a payment API spec**
   - Field definitions: what each field means, which are required vs optional
   - Response codes: the difference between a hard decline (stolen card) and a soft decline (insufficient funds)
   - Error handling: what to do when the gateway returns an error vs when it returns nothing at all

4. **Sandbox environments**
   - Why sandboxes exist: test with fake cards and fake money before touching real transactions
   - How to use a sandbox: credentials, test card numbers, simulating approvals and declines
   - The rule: never test with real card data, even in development

**Assignment**

Read the sample Tracom API transaction request below. For each field, write: what it is, why it's required, and what would happen if it were missing or malformed.

```json
{
  "merchantId": "TRC-KE-00142",
  "terminalId": "TRM-00391",
  "transactionRef": "TXN-20260523-0001",
  "amount": 150000,
  "currency": "KES",
  "transactionType": "PURCHASE",
  "cardDataRef": "tok_3Xk9mNp2qR",
  "timestamp": "2026-05-23T10:42:00+03:00"
}
```

---

### Module 204 — Designing a POS Integration

**Introduction**

You've seen the hardware, the gateway, and the API layer. Now you put them together. This module teaches you how to design a complete POS integration — including how to handle the things that go wrong — and produces the architecture blueprint you'll use for the capstone project.

**Lessons**

1. **Architecture of a complete integration**
   - Terminal → your application server → payment gateway → response → receipt
   - What your application server is responsible for: initiating the request, storing the transaction, displaying the result
   - What it is NOT responsible for: storing card data (that's the terminal's job, or the tokenization vault)

2. **Transaction states and state machines**
   - A transaction is not binary (success/fail) — it moves through states: initiated → pending → authorized → captured → settled
   - Each state transition can fail — your application must track which state each transaction is in
   - Declined and reversed are also valid final states — handle them explicitly, don't treat them as errors

3. **Idempotency — the most important concept in payments**
   - The problem: you sent a request, the network died, you don't know if it went through
   - If you retry without idempotency, you double-charge the customer
   - The solution: every transaction gets a unique reference you generate before sending; the gateway uses this to deduplicate retries
   - Rule: always check the status of a transaction before retrying

4. **Common failure modes**
   - Timeout with no response: look up the transaction by reference before retrying
   - Partial approval: the customer's card only had enough for part of the amount — some gateways support this, you must handle it
   - Terminal offline: queue the transaction and retry when connectivity is restored (only for low-risk transaction types)
   - Duplicate transaction detection: what it is, why gateways do it, and how to test for it

**Assignment**

Design the architecture for your capstone POS integration. Produce:

1. A component diagram showing: Tracom terminal, your application server, M-Pesa gateway, card payment gateway, database, and receipt printer
2. A state diagram showing all transaction states and the transitions between them
3. A one-paragraph idempotency strategy: how will your application ensure it never double-charges a customer?

This document becomes the design spec for the capstone project. A reviewer will use it to assess whether you understand the system before you build it.

---

## Course 3 — Secure Payments and Cybersecurity

*(Curriculum to be written — see narrative arc above)*

**Course goal:** By the end, the learner can identify the attack surface of the integration they designed in Course 2, apply standard mitigations, and meet the baseline compliance requirements for a production POS deployment in Kenya.

**Planned modules:**
- Module 301: The POS Attack Surface (skimming, MITM, injection, insider threat)
- Module 302: Encryption and Tokenization (TLS, point-to-point encryption, card tokenization)
- Module 303: Authentication and Access Control (API keys, OAuth, role-based access)
- Module 304: Compliance and Incident Response (PCI-DSS basics, CBK requirements, what to do when you're breached)

---

## Capstone Project — Build a POS Integration

**Prerequisite:** Course 3 credential

**Goal:** Build a working POS integration that accepts both card (via Tracom terminal) and M-Pesa, processes a test transaction end-to-end in the sandbox, and meets the security requirements from Course 3.

**Deliverables:**
1. Working integration code (GitHub repo)
2. Architecture diagram from Module 204 (updated to reflect what you actually built)
3. Security checklist from Course 3
4. Screen recording of a test transaction: initiate → gateway response → receipt

**Credential earned:** Verifiable on-chain badge — "Tracom Academy: Certified POS Integration Developer"
