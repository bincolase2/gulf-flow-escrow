# GulfFlow Escrow Devlog

This is a hackathon-grade prototype, not a polished production finance product.

## Why this exists

The idea is simple: small import/export businesses often need to send supplier advances before documents are fully verified. GulfFlow tests whether a stablecoin rail plus a small escrow policy contract can make that flow easier to inspect.

## What works today

- A browser wallet can connect to the deployed testnet contract.
- The app can price a demo trade packet.
- The app can call `lockDeal()` on the escrow policy contract.
- The app reads the stored deal back from the contract after the transaction.
- A separate script tested the full lifecycle: lock, approve documents, release advance, complete deal.

## What is intentionally simplified

- The contract records escrow policy state; it is not audited production custody code.
- Document verification is represented by document hashes, not a live KYB/document provider.
- The risk score is deterministic demo logic, not an underwriting model.
- Supplier/buyer identities are demo addresses.
- The UI is built to show the working flow, not every admin/dispute edge case.

## Testnet proof

Deployed contract:

`0x48Eebc62AFEe8f7379a403E6cddC58b5F907b6a6`

Full lifecycle test result:

`deployments/full-onchain-test.json`

## Next steps if this became real

- Add audited token custody and explicit release roles.
- Add dispute handling and cancellation windows.
- Integrate a real document/KYB provider.
- Add buyer/supplier account separation.
- Replace demo risk scoring with real invoice/counterparty checks.
