# What a Payment Gateway Does

A payment gateway is the software bridge between a merchant's system and the banking network. It sits between your application server and the acquirer bank, handling the routing, validation, and response for every transaction.

## What the gateway actually does

When your application sends a transaction request to the gateway, the gateway:

1. Validates the request — checks that all required fields are present and correctly formatted
2. Routes the transaction — determines which acquirer bank and card network should handle it
3. Receives the authorization response from the issuer bank
4. Returns the result to your application — approved or declined, with a response code

The gateway does not move money. It moves messages. The actual movement of funds happens later, during settlement.

## Why the gateway matters to a developer

The gateway is your primary integration point. You write code that talks to the gateway's API. The gateway handles everything behind it.

This means:
- Your integration code does not change when Tracom switches acquirer banks
- You get one API spec to read, not separate specs for Visa, Mastercard, and each bank
- The gateway's sandbox environment lets you test without touching real money

## What gateways charge for

Gateways charge per transaction and sometimes a monthly fee. They also charge for chargebacks — when a customer disputes a transaction and the bank reverses it. Understanding this cost structure matters when you build the merchant reporting side of your integration.
