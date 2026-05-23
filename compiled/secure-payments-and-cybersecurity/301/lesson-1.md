# Skimming and Man-in-the-Middle Attacks

These are the two most common attack types targeting the data-in-transit layer of a POS system — the point where card data moves from the physical world into the digital one.

## Skimming

A skimming attack installs a device on or inside a POS terminal to intercept card data as it is read. The device records magnetic stripe data or captures PIN entry from a fake keypad overlay.

**Where it attacks:** The terminal hardware — specifically the card reader and keypad.

**What the attacker gets:** Raw card data (track 2 data from the magnetic stripe) and, if a keypad overlay is present, the customer's PIN. Combined, these are sufficient to clone a card.

**Why it still works:** Older terminals with magnetic stripe readers transmit card data before encryption. Even on modern terminals, a physical overlay can sit between the customer and the secure hardware.

**Developer implication:** You cannot prevent hardware skimming through software. What you can do is ensure your integration uses terminals that encrypt card data at the point of read (point-to-point encryption), so that even if the hardware is compromised, the intercepted data is useless.

## Man-in-the-Middle (MITM)

A man-in-the-middle attack intercepts communication between two systems — typically between your application server and the payment gateway — and reads or modifies the messages.

**Where it attacks:** The network connection between components.

**What the attacker gets:** Unencrypted transaction data, or the ability to modify transaction amounts, redirect responses, or inject fraudulent approvals.

**Why it still works:** Misconfigured TLS, expired certificates, or connections that fall back to unencrypted protocols create windows for interception.

**Developer implication:** Every connection in your integration — terminal to server, server to gateway, server to Daraja — must use TLS with valid certificates. Your code must reject connections that fail certificate validation. Never disable certificate checking, even in development.
