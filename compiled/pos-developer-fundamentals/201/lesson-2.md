# The Transaction Path: From Tap to Response

A payment transaction touches six distinct systems between the moment a customer taps and the moment the terminal shows "Approved." As a developer you are responsible for one of them — your application server — but you must understand all six to build a reliable integration.

## The six systems

**1. The terminal**
Reads the card, encrypts the card data, and sends the transaction request to your application server.

**2. Your application server**
Receives the request from the terminal, adds merchant-specific fields (merchant ID, terminal ID, your transaction reference), and forwards it to the payment gateway.

**3. The payment gateway**
The software bridge between the merchant and the banking system. Validates the request, routes it to the correct acquirer bank, and returns the response.

**4. The acquirer bank**
The bank that holds Tracom's merchant settlement account. Sends the authorization request onward to the card network.

**5. The card network (Visa / Mastercard)**
Routes the request from the acquirer to the correct issuer bank.

**6. The issuer bank**
The customer's bank. Checks the account balance, checks for fraud signals, and sends back approved or declined.

## The return path

The response travels back through the same chain in reverse: issuer → card network → acquirer → gateway → your application server → terminal → customer display.

The entire round trip takes under two seconds. Each system in the chain adds latency. A timeout at any point means your application never gets a response — a scenario you must handle explicitly.

## What this means for you

Your application sits between the terminal and the gateway. You are responsible for:
- Sending a correctly formed request
- Storing the transaction record before sending (not after receiving the response)
- Handling the case where you send a request and never get a response back
