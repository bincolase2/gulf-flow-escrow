import hardhat from 'hardhat';
import fs from 'node:fs';

const { ethers } = hardhat;

function usdc6(amount: string) {
  return ethers.parseUnits(amount, 6);
}

function toSerializable(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toSerializable(v)]));
  }
  return value;
}

async function waitTx(label: string, txPromise: Promise<unknown>) {
  const tx = await txPromise as { hash: string; wait: () => Promise<{ blockNumber?: number | null }> };
  const receipt = await tx.wait();
  return {
    label,
    hash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    explorer: `https://testnet.arcscan.app/tx/${tx.hash}`,
  };
}

async function main() {
  const deployment = JSON.parse(fs.readFileSync('deployments/arc-testnet.json', 'utf8'));
  const [buyer] = await ethers.getSigners();
  if (!buyer) throw new Error('No test wallet configured.');

  const contract = await ethers.getContractAt('GulfFlowEscrowPolicy', deployment.address);
  const supplier = process.env.DEMO_SUPPLIER_ADDRESS || buyer.address;
  const invoiceRef = process.env.DEMO_INVOICE_REF || `INV-GCC-FULL-${Date.now()}`;
  const invoiceAmount = process.env.DEMO_INVOICE_USDC || '18420';
  const advanceAmount = process.env.DEMO_ADVANCE_USDC || '7368';
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes(`${invoiceRef}:commercial-invoice:packing-list:wallet-proof:sanctions-screening`));
  const dealId = ethers.keccak256(ethers.toUtf8Bytes(`gulf-flow-full:${invoiceRef}:${supplier}:${Date.now()}`));

  const txs = [];
  txs.push(await waitTx('lockDeal', contract.lockDeal(dealId, supplier, invoiceRef, usdc6(invoiceAmount), usdc6(advanceAmount), documentHash)));
  const afterLock = await contract.getDeal(dealId);

  txs.push(await waitTx('approveDocuments', contract.approveDocuments(dealId, documentHash)));
  const afterApprove = await contract.getDeal(dealId);

  txs.push(await waitTx('releaseAdvance', contract.releaseAdvance(dealId)));
  const afterRelease = await contract.getDeal(dealId);

  txs.push(await waitTx('completeDeal', contract.completeDeal(dealId)));
  const afterComplete = await contract.getDeal(dealId);

  const result = {
    contract: deployment.address,
    tester: buyer.address,
    supplier,
    dealId,
    invoiceRef,
    documentHash,
    txs,
    states: {
      afterLock: toSerializable(afterLock),
      afterApprove: toSerializable(afterApprove),
      afterRelease: toSerializable(afterRelease),
      afterComplete: toSerializable(afterComplete),
    },
    completedAt: new Date().toISOString(),
  };

  fs.writeFileSync('deployments/full-onchain-test.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
