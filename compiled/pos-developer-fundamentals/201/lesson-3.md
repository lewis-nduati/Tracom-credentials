# Transaction Types

Not all payment transactions are the same. A developer who only understands purchases will eventually build a system that cannot handle refunds, disputes, or network failures. These are the four transaction types you must know.

## Purchase

The standard transaction. The customer presents their card, the amount is authorized, and the funds are reserved on their account. This is the flow you will build and test first.

## Refund

Money is returned to the customer's card. A refund references the original transaction — you send the gateway the original transaction ID and the refund amount. The gateway validates that the original transaction exists and that the refund amount does not exceed the original.

Important: a refund is a separate transaction with its own ID. It is not a reversal of the original.

## Void

A void cancels a transaction before it has been settled. Settlement happens in a batch at end of day, so there is a window — usually several hours — where a transaction can be voided rather than refunded. A void costs the merchant nothing; a refund may carry a processing fee. Your system should offer void when the transaction is same-day and unsettled.

## Reversal

A reversal is what happens when a transaction is ambiguous. You sent the request, the network timed out, you do not know if the transaction went through. Rather than risking a double charge by retrying, you send a reversal for the original transaction reference. The gateway will cancel the transaction if it was authorized, and ignore the reversal if it was not.

Reversals are the most misunderstood transaction type and the most important one to implement correctly. You will return to this concept in Module 204.
