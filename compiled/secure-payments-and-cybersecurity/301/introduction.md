# The POS Attack Surface

In Course 2 you built a mental model of a POS integration: terminal, application server, gateway, database. You understand how messages flow between those components and what happens when things go wrong.

Attackers have the same mental model. They study the same architecture and look for the points where data is readable, where authentication is weak, or where a trusted insider can cause damage without triggering an alert.

Security is not a feature you add at the end. It is a set of decisions you make during design. This module maps the attack surface of the integration you designed — the specific places where an attacker could intervene — so that the rest of this course can show you how to close each one.
