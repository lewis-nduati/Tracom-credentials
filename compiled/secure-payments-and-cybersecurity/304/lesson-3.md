# Incident Response: The First Hour

A security incident in a payment system is time-critical. Every minute that a compromised system continues operating increases the number of affected transactions and the size of the breach. Knowing what to do before an incident happens is not optional — by the time an incident is confirmed, there is no time to figure out the steps.

## Recognising the signs

Common indicators that a POS system may be compromised:

- Unusual transaction patterns: high volumes of small transactions, transactions at unusual hours, multiple declines followed by approvals
- Unexpected network traffic from the application server
- Reports from customers of unauthorised charges following use of a specific terminal
- Changes to configuration files or code that no one on the team made
- Gateway alerts about unusual API activity from your merchant account

## The first hour: what to do

**Step 1 — Contain, do not destroy**
Do not switch off systems or delete logs. This destroys forensic evidence. Isolate the affected systems from the network (disconnect from the internet, disable remote access) while preserving them for investigation.

**Step 2 — Notify your payment partner**
Contact Tracom and your payment gateway immediately. They have incident response procedures. They can suspend your merchant account to prevent further fraudulent transactions while the investigation proceeds. Do not wait until you have confirmed the breach — notify on suspicion.

**Step 3 — Preserve evidence**
Copy logs, database records, and system state before anyone starts investigating. Investigations modify systems. Evidence collected before investigation begins is more forensically sound.

**Step 4 — Notify the CBK if required**
Under the National Payment System Regulations, licensed entities must notify the CBK of significant incidents within defined timeframes. If you are building for a licensed entity, ensure your client knows this obligation exists.

**Step 5 — Assess and remediate**
Identify the entry point and the scope of the breach. Close the vulnerability. Verify the fix before reconnecting to the payment network.

## The rule

Document your incident response plan before you need it. Include contact numbers for your payment partners, the CBK reporting process, and the steps above. A plan written during an incident is written under panic. A plan written beforehand is followed clearly.
