# Injection Attacks and Insider Threats

While skimming and MITM target the hardware and network layers, injection attacks and insider threats target the software and human layers — the parts of the system that developers build and organisations manage.

## Injection Attacks

An injection attack occurs when an attacker supplies malicious input that your application executes as code or a command rather than treating as data.

**SQL injection** is the most common form in payment systems. If your application builds database queries by concatenating user input — for example, looking up a transaction by a merchant-supplied reference — an attacker can supply a reference that modifies or exposes the query.

```
Normal input:  TXN-20260523-0001
Malicious:     TXN-0001' OR '1'='1
```

**Where it attacks:** Your application server — specifically any point where external input is used in a database query, API call, or system command.

**What the attacker gets:** Access to transaction records, customer data, or in severe cases, the ability to modify or delete records.

**Developer implication:** Never concatenate user input into queries. Use parameterised queries or prepared statements. Validate and sanitise all input at the boundary of your system — before it touches your database or any downstream API.

## Insider Threats

An insider threat is an attack by someone with legitimate access to the system — an employee, a contractor, or a developer.

**Where it attacks:** Every layer, because an insider has credentials.

**What the attacker does:** Exfiltrates transaction data, modifies settlement records, creates fraudulent refunds, or installs skimming software on terminals they have physical access to.

**Why it is serious:** Insider fraud accounts for a significant proportion of payment system breaches. It is harder to detect than external attacks because the access patterns look legitimate.

**Developer implication:** Your system design must enforce least privilege — each user and each service account has access only to what it needs to do its job, nothing more. Access to production transaction data should be logged and audited. Sensitive operations (large refunds, settlement overrides) should require dual authorisation.
