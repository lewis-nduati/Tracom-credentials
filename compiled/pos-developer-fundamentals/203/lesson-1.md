# APIs: The Contract Between Systems

An API (Application Programming Interface) is a formal contract between two software systems. It defines exactly what one system will accept and exactly what it will send back.

## The request/response pattern

Every API interaction follows the same pattern:

1. Your code sends a **request** — structured data describing what you want
2. The other system processes it
3. The other system sends back a **response** — the result, plus status information

In payment integrations, the request is your transaction (amount, currency, card reference, merchant details). The response is the authorization result (approved/declined, with a code and message).

## REST and JSON

Most modern payment APIs, including the ones you will use in this course, use REST over HTTP and format data as JSON.

REST means you communicate using standard HTTP methods — primarily POST for creating transactions — to URLs that represent resources. JSON is the data format: human-readable, structured as key/value pairs.

```json
{
  "amount": 150000,
  "currency": "KES",
  "transactionType": "PURCHASE"
}
```

## HTTP status codes in a payment context

The HTTP status code tells you whether your request reached the gateway and was understood. It does not tell you whether the card was approved.

- **200** — The request was received and processed. Check the response body for the actual result.
- **400** — Your request was malformed. You sent something the gateway could not parse.
- **401** — Authentication failed. Your API key is missing or invalid.
- **500** — The gateway had an internal error. Retry with backoff; do not assume the transaction failed.

A 200 response with a "declined" result is normal. A 500 with no response is a case you must handle — you do not know what happened to the transaction.
