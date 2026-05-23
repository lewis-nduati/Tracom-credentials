# Mapping Your Attack Surface

Knowing that attacks exist is not enough. You need a systematic way to find the specific vulnerabilities in your specific integration — before an attacker does. That process is called attack surface mapping.

## What an attack surface is

Your attack surface is the sum of all the points where an attacker could try to enter or extract data from your system. Every input your application accepts, every network connection it makes, every user with access, and every piece of hardware in the chain is part of your attack surface.

A smaller attack surface is harder to attack. Every feature you add, every user you create, and every port you open makes it larger.

## How to map it

Go through your architecture diagram from Module 204 and ask four questions at each component and each connection:

1. **What data passes through here?** Is any of it sensitive (card tokens, transaction amounts, customer identifiers)?
2. **Who or what can send input to this point?** Can an attacker reach it from outside your network?
3. **What authentication is required?** What happens if the authentication is bypassed or stolen?
4. **What is the impact if this point is compromised?** Financial loss? Data exposure? System downtime?

## Why this must come before implementation

Discovering a vulnerability after you have written 5,000 lines of code is expensive. Discovering it on a whiteboard is free. The attack surface map you produce in the assignment for this module becomes the security checklist you use when you build the capstone project.

Security decisions made during design — choosing P2PE, enforcing TLS, using parameterised queries, applying least privilege — cost almost nothing to implement. The same decisions made as retrofits to a working system cost significant time and carry residual risk.
