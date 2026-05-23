# Interpret a Payment API Request

Below is a transaction request with three deliberate errors. Your task is to find them, explain why each one is a problem, and write the corrected request.

```json
{
  "merchantId": "TRC-KE-00142",
  "terminalId": "TRM-00391",
  "transactionRef": "TXN-20260523-0001",
  "amount": "1500.00",
  "currency": "USD",
  "transactionType": "PURCHASE",
  "cardDataRef": "4111111111111111",
  "timestamp": "2026-05-23T10:42:00+03:00"
}
```

For each error: name the field, explain what is wrong, explain what the consequence would be if this request were sent to a live gateway, and write the corrected value.

What to submit: Your three errors with explanations and the corrected JSON.

You will pass this assignment if you:

- Identify all three errors correctly
- Explain the financial or security consequence of each error (not just that it is "wrong")
- Produce a corrected request with all three fields fixed
