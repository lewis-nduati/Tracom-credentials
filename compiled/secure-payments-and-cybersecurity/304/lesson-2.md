# Kenya Regulatory Requirements: The CBK Framework

Payment systems in Kenya operate under the oversight of the Central Bank of Kenya (CBK). The key legislation is the National Payment System Act and the CBK's National Payment System Regulations. As a developer building payment infrastructure in Kenya, you need to understand what these require.

## Who needs a licence

Any entity that operates a payment system in Kenya — meaning it processes, clears, or settles payments — must be licensed by the CBK. This includes payment service providers, mobile money operators, and payment system operators.

As a developer building a POS integration for a merchant, you are typically building on top of a licensed entity (Tracom, a bank, Safaricom). The licensing obligation rests with your client or their payment partner, not with you. However, understanding this matters because it affects what data handling and security obligations apply to the systems you build.

## Data localisation

The CBK requires that transaction data for Kenyan payment systems be stored within Kenya, or in a jurisdiction with equivalent data protection standards. When you choose a database hosting provider for your integration, this is not optional.

## Consumer protection obligations

The CBK requires that customers have access to clear information about transaction fees, that disputed transactions have a defined resolution process, and that customer complaints are handled within defined timeframes. Your integration's receipt generation, error messaging, and refund flows are part of meeting these obligations.

## Reporting obligations

Licensed payment entities must report transaction volumes, incidents, and outages to the CBK. If you build the reporting infrastructure for a licensed entity, your data model must support the reporting formats the CBK requires.

## The Data Protection Act 2019

Kenya's Data Protection Act governs the collection and processing of personal data, including the data captured during payment transactions (customer names, phone numbers, transaction history). Your integration must comply with the Act's requirements on data minimisation, purpose limitation, and security of personal data.

Practical implication: do not collect data you do not need. Do not retain data longer than necessary. Protect what you do retain.
