# The Principle of Least Privilege

Least privilege means every component, user, and service account has access to exactly what it needs to do its job — and nothing more. It is the single most effective access control principle for limiting the damage a breach can cause.

## Why least privilege matters in payments

In a POS integration, a breach does not always mean an attacker breaks in from outside. It can mean a compromised component, a misconfigured service, or a staff member with more access than their role requires.

If every component has full access to everything, a single compromised component can read all transaction history, issue refunds, modify settlement records, and exfiltrate customer data. If components have minimal access, a compromised component can do only what it was permitted to do.

## Applying least privilege to each component

**Application server — database access**
Your application server connects to the database with a service account. That account needs INSERT and SELECT on the transactions table. It does not need DROP TABLE, DELETE, or access to any other schema. Create a dedicated database user for the application with precisely those permissions.

**Application server — gateway API access**
The API key your application uses to call the gateway should have only the permissions needed: initiate transactions, query transaction status, issue refunds up to a defined limit. If the gateway supports scoped API keys, use them.

**Admin panel — staff access**
Staff who reconcile transactions need read access to transaction records. They do not need the ability to initiate transactions or modify records. Staff who process refunds need refund permission up to a limit. No staff member should have unchecked access to the production database.

**Daraja integration — callback endpoint**
Your M-Pesa callback URL receives POST requests from Safaricom's servers. It should only accept requests from Safaricom's known IP ranges and should only update the transaction record for the matching `OriginatorConversationID`. It should not expose any other functionality.

## Least privilege is a design decision

You cannot retrofit least privilege easily. It must be designed in from the start — when you create database schemas, when you configure API credentials, when you build the admin panel. Add it to your architecture document before you write implementation code.
