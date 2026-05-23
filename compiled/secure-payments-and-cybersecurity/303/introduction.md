# Authentication and Access Control

Encryption protects data. Authentication protects access. The two work together: even if every message in your integration is encrypted, an attacker who obtains valid credentials can authenticate as your application and issue legitimate-looking requests.

Authentication answers the question: who is making this request? Access control answers the follow-up: what are they allowed to do?

In a POS integration, these questions apply at every boundary — between the terminal and your server, between your server and the gateway, between your staff and your admin panel. This module covers how credentials are managed in payment APIs, how to ensure each component has only the access it needs, and the specific mistakes that most commonly lead to authentication failures in production.
