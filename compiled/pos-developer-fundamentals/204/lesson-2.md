# Transaction States

A payment transaction is not binary. It does not jump from "not started" to "complete." It moves through a sequence of states, and your application must track every one of them.

## The states

**INITIATED**
Your application has created a transaction record in the database and generated the transaction reference. The request has not been sent yet. This record exists so that if anything fails from this point, there is a trail.

**PENDING**
The request has been sent to the gateway. Your application is waiting for a response. This is the most dangerous state — the transaction is in-flight and the outcome is unknown.

**AUTHORIZED**
The gateway returned an approval. Funds are reserved on the customer's account. Money has not moved.

**CAPTURED**
In a standard auth-capture flow, this happens simultaneously with AUTHORIZED. The gateway has been instructed to charge the reserved funds.

**SETTLED**
The acquirer bank has processed the end-of-day batch. Funds have moved to the merchant's account. This state is typically updated by a webhook from the gateway or a batch reconciliation process, not by the original transaction request.

**DECLINED**
The issuer bank declined the transaction. No funds were reserved. The reason code (51, 05, etc.) should be stored with the transaction record.

**REVERSED**
A reversal was sent for a transaction that was in PENDING state and never confirmed. The gateway has cancelled it.

**VOIDED**
The transaction was cancelled after authorization but before settlement.

**REFUNDED**
A separate refund transaction was processed against this original transaction.

## Why tracking states matters

If your database only stores the final result, you cannot:
- Tell a customer why their transaction declined
- Void a transaction before it settles
- Reconcile your records against the gateway's end-of-day report
- Debug a double-charge complaint

Build your data model to store the current state and the full history of state transitions.
