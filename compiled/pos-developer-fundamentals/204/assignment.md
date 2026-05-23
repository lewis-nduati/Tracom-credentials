# Design Your POS Integration

This is the design document you will build from in the capstone project. A reviewer will use it to confirm you understand the system before you build it.

Produce three things:

**1. Component diagram**
Show all components in your integration: Tracom terminal, your application server, card payment gateway, M-Pesa gateway (Daraja), database, and receipt printer. For each connection between components, label the direction of the message and what type of message it is (e.g. "transaction request", "authorization response", "M-Pesa callback").

**2. Transaction state diagram**
Show all the states a card transaction can be in. Draw the transitions between states and label what event causes each transition (e.g. "gateway returns approved" → AUTHORIZED). Include the PENDING, AUTHORIZED, DECLINED, SETTLED, VOIDED, and REVERSED states at minimum.

**3. Idempotency strategy**
Write one paragraph (100–150 words) describing how your application will ensure it never double-charges a customer. Your answer must cover: when the transaction reference is generated, where it is stored, how you handle a retry after a lost response, and how this differs for M-Pesa vs card.

What to submit: Your component diagram, your state diagram, and your idempotency paragraph.

You will pass this assignment if you:

- Show bidirectional message flow between all components (including the async callback path for M-Pesa)
- Include all required transaction states and show that DECLINED and REVERSED are valid final states
- Describe idempotency in terms of a specific reference generation and storage strategy, not just the concept
