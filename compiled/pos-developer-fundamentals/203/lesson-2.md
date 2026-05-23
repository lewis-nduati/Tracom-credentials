# Reading a Payment API Request

Reading an API specification is a skill. This lesson walks through a sample transaction request field by field so you understand not just what each field is, but why it exists and what happens if it is wrong.

## A sample transaction request

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

## Field by field

**merchantId** — Identifies your business to the gateway. Assigned when you register as a merchant. If this is wrong, the gateway cannot route settlement to the correct account.

**terminalId** — Identifies the specific physical terminal. Required because a merchant may have many terminals; the gateway tracks which terminal processed which transaction for reconciliation.

**transactionRef** — A unique reference you generate before sending the request. This is the most important field for a developer. You use it to look up the transaction if you never receive a response. It must be unique per transaction — reusing a reference can trigger duplicate detection and reject a legitimate transaction.

**amount** — The transaction amount in the smallest currency unit. KES 1,500.00 is sent as 150000 (integer, no decimal). Sending the wrong format here will result in the wrong amount being charged.

**currency** — ISO 4217 currency code. Always KES for Kenyan shilling transactions. The gateway may support other currencies; specifying the wrong one will cause a conversion or a rejection.

**transactionType** — One of the transaction types you learned in Module 201: PURCHASE, REFUND, VOID, or REVERSAL. The gateway processes each type differently.

**cardDataRef** — A token representing the card data. The terminal generates this token after reading the card. Your application never sees the actual card number — only this reference. This is by design.

**timestamp** — The time the transaction was initiated, in ISO 8601 format with timezone offset. Used for reconciliation and fraud detection.

## Response codes

A gateway response will include a response code alongside the approved/declined result. Common codes:

- **00** — Approved
- **51** — Insufficient funds (soft decline — the card is valid, the account is low)
- **05** — Do not honour (hard decline — the issuer has blocked this transaction)
- **12** — Invalid transaction
- **91** — Issuer unavailable (retry may succeed)

Your application must handle each of these explicitly. "Declined" is not a single case.
