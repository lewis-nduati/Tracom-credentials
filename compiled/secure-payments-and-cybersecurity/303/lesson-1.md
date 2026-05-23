# API Keys and Tokens

Payment APIs use credentials to verify that requests come from authorised systems. As a developer, you are responsible for generating, storing, and rotating these credentials correctly. A leaked credential is as damaging as a stolen card number.

## API keys

An API key is a long random string issued by the gateway when you register. You include it in every request — typically in an HTTP header — and the gateway uses it to identify your merchant account.

```
Authorization: Bearer sk_live_4Xk9mNp2qRzT8vL3...
```

API keys are long-lived. They do not expire automatically. This makes them convenient but dangerous: a leaked key remains valid until you manually revoke it.

**How to store API keys:**
- In environment variables, never in source code
- In a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production systems
- Never in version control, even in a private repository
- Never in client-side code — a key in a mobile app or browser JavaScript is publicly visible

**Separate keys for separate environments.** Your sandbox key and production key must be different. Deploying sandbox credentials to production is a common mistake that results in no real transactions processing.

## Short-lived tokens (OAuth 2.0)

Some payment APIs — including the M-Pesa Daraja API — use OAuth 2.0. Instead of a single long-lived API key, you exchange credentials for a short-lived access token (typically valid for one hour). You use that token to authenticate API calls until it expires, then request a new one.

```
POST /oauth/v1/generate
Authorization: Basic base64(consumerKey:consumerSecret)

Response: { "access_token": "...", "expires_in": "3599" }
```

Short-lived tokens limit damage from a leak: a stolen token expires within the hour. The trade-off is that your application must handle token expiry and renewal.

## Which to use

Use whatever the API requires. For the Tracom gateway, use the API key pattern. For Daraja, use OAuth tokens. Your integration must handle both patterns simultaneously, with credentials for each stored separately and securely.
