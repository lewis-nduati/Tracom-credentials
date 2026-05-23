# Sandbox Environments

A sandbox is a testing environment that behaves exactly like the production payment system but uses fake money. Every serious payment gateway provides one. Using it correctly is not optional — it is how you build an integration without putting real transactions at risk.

## Why sandboxes exist

Payment APIs carry real financial consequences. A bug in your integration code can:

- Double-charge a customer
- Send the wrong amount
- Fail to record a transaction that the bank processed
- Expose card data through a log file

Sandboxes let you make all of these mistakes with fake credentials and fake card numbers before they can harm anyone.

## What a sandbox gives you

A sandbox environment provides:

- **Separate API credentials** — sandbox API keys that only work against the sandbox endpoint
- **Test card numbers** — specific card numbers that simulate approved transactions, declined transactions, insufficient funds, and other scenarios
- **No real money movement** — transactions process through the full gateway logic but no funds are reserved or moved
- **Full logging** — most sandboxes expose detailed request/response logs so you can see exactly what your code is sending

## How to use a sandbox safely

Three rules:

1. **Never use real card numbers in a sandbox.** It is unnecessary (test cards are provided), against the gateway's terms of service, and potentially a compliance violation.
2. **Never use sandbox credentials in production.** Keep sandbox and production API keys in separate environment variables. Never hardcode either.
3. **Test failure scenarios, not just the happy path.** Your integration must handle declined transactions, timeouts, and missing responses. The sandbox is where you confirm it does.

## The sandbox-to-production transition

When your integration passes sandbox testing, switching to production means swapping credentials — not rewriting code. If your code is tightly coupled to sandbox-specific behavior, that is a design flaw to fix before going live.
