# M-Pesa vs Card: Two Different Money Rails

Kenya runs on two payment rails simultaneously. A developer building for the Kenyan market must understand both — because they work in fundamentally different ways, and the integration code for each is different.

## How a card transaction works (pull-based)

A card transaction is initiated by the merchant. The merchant's terminal reads the card details and sends a request to charge the customer's account. The customer's bank either approves or declines.

The customer does not initiate anything after presenting the card. The merchant pulls the funds.

Chain: Terminal → Gateway → Acquirer Bank → Card Network (Visa/Mastercard) → Issuer Bank → back

## How an M-Pesa transaction works (push-based)

An M-Pesa transaction is initiated by the customer. The merchant's system sends a payment request to the customer's phone number via the M-Pesa API (called Daraja). The customer sees a prompt on their phone and enters their M-Pesa PIN to approve.

The customer pushes the funds. The merchant waits for a callback.

Chain: Your server → Daraja API (Safaricom) → Customer phone prompt → Customer approves → Callback to your server

## The key differences

| | Card | M-Pesa |
|---|---|---|
| Who initiates | Merchant | Customer (prompted) |
| Response timing | Synchronous (~2 seconds) | Asynchronous (callback) |
| What you integrate with | Payment gateway | Daraja API |
| Failure scenario | Hard decline | No callback received |

## What this means for your integration

M-Pesa requires you to handle asynchronous responses. You send the payment request, and then you wait for a callback URL on your server to receive the result. If the callback never arrives, you must query the transaction status. This is a completely different code path from a card transaction.

Your capstone project will require you to handle both flows correctly.
