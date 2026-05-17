# GulfFlow Escrow Architecture

GulfFlow is a stablecoin commerce workflow for Gulf SMEs that need to pay international suppliers without sending unsecured advances.

## Flow
1. Buyer enters trade intent/invoice metadata.
2. Risk engine selects corridor profile and checks document completeness.
3. App quotes advance, reserve, Gateway fee estimate, and policy gates.
4. User explicitly approves escrow intent.
5. Backend simulates Circle Gateway treasury movement. The frontend can also submit a real zero-value Arc Testnet memo transaction from the connected wallet to anchor the escrow intent.
6. Receipt records wallet, milestone, tx hash, and compliance memo.

## Circle / Arc Mapping
- USDC: stable invoice denomination and settlement asset.
- Circle Gateway: treasury routing abstraction.
- Circle Wallets: future policy-bound authorization layer.
- Arc: target chain for predictable USDC settlement receipts.
- CCTP / Bridge Kit: future supplier-side cross-chain payout option.

## Safety Model
The application never settles automatically. It prepares a bounded escrow quote; release requires wallet approval and document/compliance gates.

## Live Arc Testnet Integration

The app uses EIP-1193 browser wallets and `ethers` to add/switch Arc Testnet (`5042002`), read the signer USDC gas balance, and submit a zero-value transaction with escrow-intent calldata. This proves live network connectivity without transferring funds or requiring custodial keys in the repository.

## Escrow Contract

`contracts/GulfFlowEscrowPolicy.sol` is a minimal Arc Testnet escrow policy contract. The contract records a deal, supplier, invoice reference, invoice amount, advance amount, document hash, and lifecycle state. The frontend can call `lockDeal()` directly through the user's browser wallet after the contract address is configured.

The MVP intentionally separates **policy proof** from **fund custody**. It writes a verifiable escrow intent on Arc Testnet while avoiding unsafe custody logic in an unaudited hackathon contract. A production version would add audited USDC transfer custody, role-based release, KYB integrations, and dispute resolution.
