# Idempotency: The Most Important Concept in Payments

Idempotency means that performing the same operation multiple times produces the same result as performing it once. In payment integrations, it is the mechanism that prevents double-charging customers.

## The problem it solves

Here is the scenario every payment developer will face:

1. Your application sends a transaction request to the gateway
2. The network fails before you receive a response
3. You do not know if the transaction was processed or not
4. If you retry, you risk charging the customer twice
5. If you do not retry, you risk the customer's purchase not going through

This is not an edge case. Network interruptions happen. Mobile data in East Africa is inconsistent. You must handle this scenario explicitly.

## How idempotency works

Before sending any transaction request, your application generates a unique transaction reference — a string you create, not something the gateway assigns. You include this reference in every request.

When the gateway receives a request, it checks: have I seen this reference before?

- If no: process the transaction, return the result
- If yes: return the same result as the first time, without processing it again

This means you can safely retry any request using the same reference. The gateway will process it at most once.

## The rule

Generate the transaction reference before sending. Store it in your database as part of the INITIATED state. Never reuse a reference across different transactions. If you need to retry, use the original reference — do not generate a new one.

## Idempotency in M-Pesa

The Daraja API has its own idempotency mechanism. Each request includes an `OriginatorConversationID` you generate. If a callback never arrives, you query the transaction status using that ID rather than sending a new payment request.

The principle is the same: one unique identifier per intended transaction, used to check before retrying.

## A common mistake

Generating the transaction reference inside the function that sends the request. If the request function runs twice, it generates two different references, and the gateway sees two different transactions — both get processed.

Generate the reference before calling the send function. Store it. Pass it in. That sequence cannot produce a duplicate.
