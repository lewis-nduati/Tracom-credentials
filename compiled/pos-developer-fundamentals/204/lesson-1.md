# Architecture of a POS Integration

A well-designed POS integration has clear boundaries between components. Each component has one responsibility. None of them own data that belongs to another.

## The components

**Tracom terminal**
Reads the card, encrypts card data, generates the card token, displays the transaction amount to the customer, and shows the approval or decline result. Your application does not need to talk to this component directly in most integration patterns — the terminal initiates the request to your server.

**Your application server**
The merchant system. Receives the transaction request from the terminal, enriches it with merchant and terminal IDs, generates the transaction reference, sends it to the gateway, persists the result, and returns the response to the terminal for display.

**Payment gateway**
Routes the transaction to the acquiring bank. Returns authorization responses. Exposes the API your server calls.

**M-Pesa gateway (Daraja API)**
A separate integration path for mobile money. Your server calls the Daraja API, then waits for an asynchronous callback on a registered URL.

**Database**
Stores every transaction your server initiates — before the request is sent, not after the response is received. Also stores the response when it arrives. This ordering matters: if you store after receiving the response, you will have no record of transactions where the response was lost.

**Receipt printer / customer display**
Receives the final approved/declined result from your server and generates the receipt.

## The rule your application must never break

Your application server must never store, log, or transmit raw card numbers. It handles card tokens only. The moment you violate this, you are in scope for full PCI DSS compliance requirements — a significant legal and financial burden.
