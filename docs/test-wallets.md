# Test Wallets — Preprod

Three wallets for end-to-end credential flow testing on Cardano Pre-Production Testnet.

## Wallets

### Student A
- **Role:** Enrolls in courses, completes modules, receives credentials
- **Network:** Pre-Production Testnet
- **Address:** _(fill in)_

### Verifier B
- **Role:** Verifies credentials issued to Student A
- **Network:** Pre-Production Testnet
- **Address:** _(fill in)_

### Admin C
- **Role:** Course owner / instructor — approves module completions
- **Network:** Pre-Production Testnet
- **Address:** _(fill in)_

## Test Flow

1. Student A enrolls in Course 1 (Introduction to Blockchain)
2. Student A completes Module 101 assignment
3. Admin C approves the submission on-chain
4. Student A receives credential NFT
5. Student A enrolls in Course 2 (prerequisite: Course 1 credential)
6. Repeat through Course 3
7. Verifier B checks Student A's credential on-chain

## Notes

- Fund each wallet via the Cardano preprod faucet (10,000 tADA per address)
- All wallets set to Pre-Production network in Eternl before requesting faucet funds
