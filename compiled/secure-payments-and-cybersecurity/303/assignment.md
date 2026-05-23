# Authentication and Access Control Design

Update the architecture document you produced in Module 204 with an authentication and access control layer.

For each component-to-component connection in your diagram, specify:
1. What credential is used to authenticate (API key, OAuth token, database password, session token)
2. Where that credential is stored
3. What permissions it grants — and what permissions it explicitly does not grant

Then identify two specific least-privilege decisions you made in your design. For each one, explain: what broader access you chose not to give, and what attack or damage is prevented by that restriction.

Finally, answer this question in 2–3 sentences: Your M-Pesa callback URL receives a POST request claiming a payment was successful. What steps does your application take before marking the transaction as paid?

What to submit: Your updated authentication layer for the architecture diagram, your two least-privilege decisions with explanations, and your callback validation answer.

You will pass this assignment if you:

- Specify credentials and storage for every component connection (no connection left as "assumed secure")
- Describe least-privilege decisions in terms of what was deliberately excluded, not just what was included
- Describe a callback validation process that does not rely solely on the callback content
