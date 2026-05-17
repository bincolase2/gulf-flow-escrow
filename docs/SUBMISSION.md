# Submission: GulfFlow Escrow

## One-liner
USDC escrow and compliance-gated milestone settlement for Gulf SME cross-border trade.

## Tracks addressed
- Cross-border payments and remittances
- SME finance and trade workflows
- Tokenized assets / compliant DeFi
- Trade finance workflow

## Problem
SMEs in GCC trade corridors often prepay foreign suppliers through slow bank rails with limited visibility. Suppliers need working capital; buyers need proof and protection. Manual documents, FX uncertainty, and reconciliation slow small shipments.

## Solution
GulfFlow converts an invoice into programmable USDC escrow: the buyer sets intent, the risk engine checks docs, funds lock into milestone policy, supplier receives release only after gates pass, and buyer gets an auditable Arc-style receipt.

## Why Circle and Arc
USDC is the settlement asset, Gateway is the treasury/routing abstraction, Circle Wallets provide future policy-bound authorization, and Arc is the settlement venue optimized for predictable commerce UX.

## Current MVP
Implemented: Next.js app, quote engine, risk scoring, milestone escrow plan, simulated settlement receipt plus optional real Arc Testnet anchoring transaction, API routes, Solidity policy sketch, docs.

Not yet implemented: real Circle Wallets calls, live USDC escrow transfer, production KYC/sanctions provider, audited contract.

## Demo script
1. Open app.
2. Generate escrow quote.
3. Review invoice, risk, USDC split, and required docs.
4. Approve simulated USDC escrow.
5. Show receipt with Circle Gateway + Arc USDC rail, wallets, and tx hash.

## Live Arc proof

For safety, the demo does not custody private keys and does not transfer supplier funds. The submitter connects their own wallet on Arc Testnet and signs a zero-value transaction to themselves with the escrow memo in calldata. The app displays the ArcScan transaction link as proof of live Arc integration.

## Contract upgrade

The upgraded version includes `GulfFlowEscrowPolicy`, a deployable Arc Testnet contract. The submission can show two forms of live proof:

1. a zero-value memo anchor transaction for lightweight proof; and
2. a `lockDeal()` contract transaction that records the invoice reference, supplier address, USDC-denominated invoice amount, advance amount, and document hash.

The UI includes a submission dashboard summarizing problem, solution, Circle/Arc usage, and live proof status.

## Honest hackathon notes

GulfFlow is intentionally scoped as a working prototype. The project demonstrates a live contract write/read flow and a full testnet lifecycle, but it does not claim to be a production-ready escrow system. Document verification is represented by hashes and the contract is a policy/state machine rather than audited token custody.
