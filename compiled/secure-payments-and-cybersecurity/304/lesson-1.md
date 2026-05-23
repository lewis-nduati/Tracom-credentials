# PCI DSS: What a Developer Must Know

PCI DSS (Payment Card Industry Data Security Standard) is a set of security requirements maintained by the card networks (Visa, Mastercard, and others) for any organisation that stores, processes, or transmits card data. Non-compliance can result in fines, increased transaction fees, or loss of the ability to accept card payments.

## Who it applies to

PCI DSS applies to any organisation that touches card data. As a developer building a POS integration, you are building a system that your merchant clients will use to process card transactions. The controls you build in — or fail to build in — directly affect whether your clients can meet their PCI obligations.

## The requirements most relevant to a POS developer

PCI DSS has 12 requirement groups. These are the ones your code decisions directly affect:

**Requirement 3 — Protect stored cardholder data**
Do not store card numbers (PANs), CVV codes, or full magnetic stripe data. If you must store card data for recurring payments, use tokenization. This is why the `cardDataRef` pattern from Course 2 exists.

**Requirement 4 — Encrypt transmission of cardholder data**
All card data in transit must be encrypted. TLS on every connection. No exceptions.

**Requirement 6 — Develop and maintain secure systems**
Use secure coding practices. Validate all input. Keep dependencies patched. This is the requirement that makes SQL injection prevention mandatory, not optional.

**Requirement 7 — Restrict access to cardholder data**
Least privilege. Only components and users that need access to card data should have it — and your application server in a P2PE environment should have none.

**Requirement 10 — Track and monitor all access**
Log access to systems that touch payment data. Logs must be tamper-evident and retained for at least one year.

## Reducing your scope with P2PE and tokenization

P2PE and tokenization, covered in Module 302, do more than protect data — they reduce the number of systems that fall under PCI scope. A system that never handles readable card data has a significantly lighter compliance burden. Building with P2PE and tokenization from the start is the most efficient path to compliance for a new integration.
