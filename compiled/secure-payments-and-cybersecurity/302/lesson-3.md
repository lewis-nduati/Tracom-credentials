# Tokenization

Tokenization replaces a sensitive value with a non-sensitive substitute called a token. The token can be stored, transmitted, and processed by your application without any of the security obligations that come with the original data.

## How tokenization works in payments

When a terminal reads a card, or when a gateway first processes a card number, it can generate a token — a random string that maps to the real card number inside a secure vault the gateway controls.

Your application stores the token. When you need to charge the card again — for a recurring payment, a refund, or a retry — you send the token. The gateway looks up the real card number and processes the transaction. Your application never sees or stores the real number.

## Token vs card number: what is the difference?

A real card number (called a PAN — Primary Account Number) is 16 digits, formatted consistently, and can be used to charge the card at any gateway that accepts it.

A token looks similar in length and format but has no meaning outside the gateway that issued it. If an attacker steals your database and finds tokens, they cannot use those tokens at another gateway, cannot derive the real card numbers, and cannot make fraudulent transactions.

## The `cardDataRef` field revisited

In Module 203 you saw this field in the transaction request:

```json
"cardDataRef": "tok_3Xk9mNp2qR"
```

That is a token. The terminal generated it after reading the card. Your application passed it to the gateway. At no point did your application handle the real card number.

## What you must never do

Never log card numbers, even partially. Never store them in your database, even temporarily. Never include them in error messages. The moment a card number appears in your application layer, you inherit compliance obligations that are expensive to meet and expensive to fail.

If you are ever unsure whether a value is a token or a real card number: a real card number passes the Luhn algorithm. Test the value. If it passes, do not store it — report the issue and investigate how it reached your application.
