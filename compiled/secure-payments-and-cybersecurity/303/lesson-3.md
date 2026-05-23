# Common Authentication Vulnerabilities

Understanding the principle is not enough. Payment systems fail in specific, recurring ways. This lesson covers the authentication vulnerabilities that appear most frequently in real integrations and what prevents each one.

## Hardcoded credentials

**What it is:** API keys, database passwords, or OAuth secrets written directly into source code.

**Why it happens:** It is faster during development. The developer intends to move them to environment variables before deploying but does not.

**The consequence:** Source code gets committed to version control. Version control repositories get cloned, shared, or leaked. A hardcoded production API key in a GitHub repository has a median time-to-exploit of under four minutes.

**Prevention:** Use environment variables from day one. Configure your repository to scan for secrets before commits (`git-secrets`, GitHub secret scanning). Treat a committed secret as compromised and rotate it immediately.

## Credential reuse across environments

**What it is:** Using the same API key or database password in sandbox, staging, and production.

**Why it happens:** Convenience. One set of credentials to manage.

**The consequence:** A breach in a lower environment immediately compromises production.

**Prevention:** Separate credentials for every environment. Automate credential injection through a CI/CD pipeline so developers never handle production secrets directly.

## Unvalidated callbacks

**What it is:** An M-Pesa callback endpoint that accepts and processes any POST request without verifying it came from Safaricom.

**Why it happens:** The developer tests with their own test requests and assumes only Safaricom will call the URL in production.

**The consequence:** An attacker can send a crafted callback claiming a transaction was successful, causing your application to fulfil an order without a real payment.

**Prevention:** Validate the source IP against Safaricom's published IP ranges. Validate the `OriginatorConversationID` against a pending transaction in your database. Never mark a transaction as paid based solely on a callback — query the gateway to confirm.

## Overly broad API key permissions

**What it is:** Using a single API key with full permissions for all operations.

**Prevention:** Use the most restrictive scope the gateway allows. If you only need to initiate transactions and query status, do not use a key that can also manage merchant settings or access reporting data.
