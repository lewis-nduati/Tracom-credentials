# The Hardware and Software of a POS System

A POS system has two distinct layers: the hardware you can touch and the software that runs on it. An integration developer needs to understand both.

## The hardware layer

A Tracom terminal is a purpose-built computer. Its key components:

- **Card reader** — accepts magnetic stripe, EMV chip, and contactless (NFC/tap) cards. Each method captures card data differently. Chip and contactless are far harder to counterfeit than magnetic stripe.
- **Keypad** — used for PIN entry. The keypad is isolated from the rest of the terminal hardware specifically so that PIN data never travels through software you or anyone else has written.
- **Display** — shows the transaction amount to the customer before they approve.
- **Printer** — generates the customer and merchant receipts.
- **Connectivity** — Tracom terminals support Ethernet, Wi-Fi, and 4G. Your integration needs to account for what happens when connectivity is lost mid-transaction.

## The software layer

Two separate software environments run a transaction:

**On the terminal:**
The terminal runs firmware and a payment kernel — certified software that handles all card data capture and cryptographic operations. You do not have access to this layer and you do not need it. It is designed to keep card data away from third-party code.

**On your server:**
Your application is the merchant system. It tells the terminal what amount to charge, receives the result, records the transaction in your database, and triggers the receipt. This is the layer you build and own.

## The separation of concerns

This boundary matters: the terminal owns card data, your application owns business logic. A common developer mistake is trying to capture or log card data on the application side. This breaks compliance rules and creates security liability. Keep the boundary clean.
