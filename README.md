# GulfFlow Escrow

**USDC escrow and compliance-gated milestone settlement for Gulf SME cross-border trade.**

Built for **The Stablecoins Commerce Stack Challenge** by Ignyte, Circle, and Arc.

## What it does

GulfFlow helps a Gulf SME pay an overseas supplier without sending an unsecured advance. The app converts a trade request into a bounded USDC escrow quote, checks document requirements, locks an advance/reserve schedule into a live Arc Testnet escrow contract, and reads the verified contract state back into the interface.

## Challenge fit

- **Cross-border payments:** corridor-aware supplier settlement in USDC.
- **SME trade finance:** invoice-backed advance with reserve and milestone release.
- **Compliant DeFi / tokenized assets:** document gates and wallet ownership checks before release.
- **Trade finance workflow:** every settlement step requires explicit wallet approval.

## Circle / Arc usage

- **USDC** as the stable invoice settlement asset.
- **Circle Gateway** as the treasury movement abstraction.
- **Circle Wallets** planned for policy-bound approval and wallet controls.
- **Arc Testnet** as the live network: chain ID `5042002`, RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`.
- **CCTP / Bridge Kit** as a future extension for supplier-side payout routing.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Useful commands

```bash
npm run lint
npm run build
npm run test:demo
```

## Demo flow

1. Enter or choose a trade request.
2. Click **Generate escrow quote**.
3. Review invoice, risk score, USDC advance/reserve split, and required documents.
4. Click **Approve simulated USDC escrow**.
5. Review the receipt with rail, wallets, tx hash, and compliance memo.

## Repository map

- `src/app/page.tsx` — demo UI
- `src/app/api/quote/route.ts` — quote API
- `src/app/api/settle/route.ts` — settlement simulation API
- `lib/engine.ts` — risk/quote/receipt logic
- `contracts/GulfFlowEscrowPolicy.sol` — escrow policy sketch
- `docs/SUBMISSION.md` — challenge submission notes
- `docs/ARCHITECTURE.md` — architecture notes
- `docs/ROADMAP.md` — next steps

## Status

This is a safe MVP: it does not transfer real funds, but it supports a real Arc Testnet anchoring transaction from the submitter wallet. The transaction sends zero value to the signer address with an escrow memo in calldata, proving live Arc connectivity without custody risk.


## Arc Testnet notes

Arc docs used by this project:

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`
- Native gas token: USDC
- USDC ERC-20 interface: `0x3600000000000000000000000000000000000000`
- GatewayWallet: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`

To demo live anchoring:

1. Install a browser wallet.
2. Add/switch to Arc Testnet from the app.
3. Fund the wallet with testnet USDC from the Circle Faucet.
4. Generate an escrow quote.
5. Click **Anchor escrow intent on Arc Testnet** and confirm the wallet transaction.
6. Open the explorer link shown in the receipt.

## Real Arc Testnet contract path

This repository includes a deployable escrow policy contract for Arc Testnet.

```bash
cp .env.example .env.local
# fill ARC_DEPLOYER_PRIVATE_KEY with a funded Arc Testnet wallet
npm run contracts:compile
npm run contracts:deploy:arc
```

After deployment, copy values from `deployments/arc-testnet.json` into your hosting environment:

```bash
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ESCROW_DEPLOY_TX=0x...
```

Then run the app and use **Lock deal contract**. This calls `lockDeal()` on `GulfFlowEscrowPolicy` and writes the invoice reference, supplier address, invoice amount, advance amount, and document hash to Arc Testnet.

Optional CLI demo:

```bash
npm run contracts:lock-demo
```

This creates `deployments/demo-deal.json` with the deal ID and ArcScan transaction link.

## Full Arc Testnet mode

The main app flow is now Arc-first:

1. connect an Arc Testnet browser wallet;
2. price a trade packet;
3. enter a supplier testnet address;
4. call `GulfFlowEscrowPolicy.lockDeal()` through the wallet;
5. read the stored deal back from Arc RPC; and
6. open the contract transaction on ArcScan.

The old simulated receipt is no longer the primary user flow. It remains in backend code only as a demo/test utility.

## Submission

Builder: bentam  
Contact: earlkeycsi400@gmail.com  
Project: GulfFlow Escrow
