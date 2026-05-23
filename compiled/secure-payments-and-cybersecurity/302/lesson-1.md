# TLS: Protecting Data in Transit

TLS (Transport Layer Security) is the protocol that encrypts data moving between two systems over a network. When you see HTTPS in a URL, TLS is what the S stands for. Every API call your integration makes — to the payment gateway, to Daraja, from the terminal to your server — must use TLS.

## What TLS does

TLS provides three things:

**Encryption** — data in transit is scrambled. An attacker who intercepts the network traffic sees ciphertext they cannot read without the private key.

**Authentication** — the server presents a certificate that proves its identity. Your application verifies that it is talking to the real gateway, not an impersonator.

**Integrity** — TLS detects if data was modified in transit. A tampered message is rejected.

## What TLS does not do

TLS protects data while it is moving. Once the data arrives at your server and is decrypted, TLS provides no protection. Data at rest — in your database, in log files, in backups — requires separate controls.

## How to verify your integration uses TLS correctly

Three checks every developer must run:

1. **All endpoints use HTTPS** — no payment API calls over plain HTTP under any circumstances, including in development.

2. **Certificate validation is enabled** — many HTTP libraries allow you to disable certificate validation with a flag. This is sometimes done during development to avoid certificate errors. It must never be disabled in any environment. A disabled check means your application will connect to any server, including a fraudulent one.

3. **TLS version** — your integration should require TLS 1.2 at minimum, TLS 1.3 where available. Older versions (TLS 1.0, SSL) have known vulnerabilities.

## The certificate pinning option

Some high-security implementations pin the gateway's certificate — they store a copy of the expected certificate and reject connections to any server presenting a different one. This protects against attackers who compromise a certificate authority. It is not required for most integrations but is worth understanding.
