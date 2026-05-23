# Encryption and Tokenization Audit

Below is a description of a POS integration with five security issues related to encryption and tokenization. Identify each issue, explain the risk it creates, and write the corrected approach.

**Integration description:**

A merchant application connects to a payment gateway over HTTPS but has certificate validation disabled in the production configuration because it was causing errors during testing. The terminal is a magnetic stripe reader without P2PE. When a transaction is processed, the application logs the full request object to a file for debugging, including the card number received from the terminal. The application stores card numbers in its database alongside transaction records so it can process refunds without calling the gateway again. The database connection uses port 3306 exposed to the public internet.

**Your task:** Identify all five issues. For each one: name it, explain what attack it enables or what compliance obligation it triggers, and describe the correct approach.

What to submit: Your five issues with explanations and corrections.

You will pass this assignment if you:

- Correctly identify all five issues
- Link each issue to a specific attack vector or compliance consequence (not just "it is insecure")
- Provide a technically correct remediation for each one
