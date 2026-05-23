# Map the Components of a POS Transaction

Draw or describe the component map of a complete Tracom POS transaction.

Your map must include: the Tracom terminal, your application server, the payment gateway, the acquirer bank, the card network, and the issuer bank. Label each component and show the direction of messages flowing between them — both the request path and the response path.

Then answer these two questions in 2–3 sentences each:

1. Which component in your map is responsible for keeping card data secure? Why is it designed that way?
2. What happens to your application server if the network fails after you send the request to the gateway but before you receive a response?

What to submit: Your component map (a diagram, a labelled list, or a written description) plus your two answers.

You will pass this assignment if you:

- Correctly label all six components and show the direction of message flow
- Identify the terminal (or payment kernel) as the boundary for card data
- Acknowledge that a missing response is a distinct scenario that requires explicit handling
