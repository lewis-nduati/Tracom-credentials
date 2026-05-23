# Authorization, Capture, and Settlement

"The transaction was approved" does not mean the money has moved. There are three distinct stages between a customer tapping their card and a merchant receiving funds in their account. Confusing these stages is a frequent source of bugs in payment integrations.

## Authorization

The issuer bank reserves the funds on the customer's account. The customer cannot spend that money elsewhere, but it has not left their account yet.

Authorization is real-time. It happens in the two-second window of the transaction. What you receive back from the gateway is an authorization code — not a confirmation that money moved.

## Capture

Capture is the instruction to actually charge the reserved funds. In most POS integrations, capture happens at the same time as authorization — the transaction is authorized and captured in a single step. This is called "auth-capture."

Some integrations separate them: a hotel might authorize a card at check-in and capture the final amount at check-out. For a standard retail POS integration, you will use auth-capture.

## Settlement

Settlement is when the money actually moves. Once per day (typically at end of business), the acquirer bank processes all captured transactions in a batch and transfers the net amount to the merchant's account.

This is why a transaction that was authorized at 2pm on Monday might not appear in the merchant's bank account until Tuesday.

## Why this matters for your integration

Your application must track the authorization stage separately from the settled stage. A transaction that is authorized but not yet settled:

- Can still be voided (which is cheaper than a refund)
- Has not resulted in any funds in the merchant's account
- Represents a liability if it is later disputed

If your integration only marks a transaction as "complete" on authorization, your merchant reporting will be wrong. Build your data model to track the full lifecycle.
