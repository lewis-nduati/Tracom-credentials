# Anatomy of a POS System

When a customer taps their card at a Tracom terminal, the transaction is complete in under two seconds. That speed hides a surprising amount of complexity.

Before you write a single line of integration code, you need to know what you are actually integrating with. This module pulls apart every layer of a POS system — the physical hardware, the software running on it, and the network path a transaction takes from the moment of tap to the moment of approval.

Understanding this architecture is not academic. Every integration bug you will ever debug traces back to one of these layers. By the end of this module, you will be able to draw the system from memory and explain what happens at each step.
