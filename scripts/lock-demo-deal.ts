import hardhat from 'hardhat';
import fs from 'node:fs';

const { ethers } = hardhat;

function usdc6(amount: string) {
  return ethers.parseUnits(amount, 6);
}

async function main() {
  const deployment = JSON.parse(fs.readFileSync('deployments/arc-testnet.json', 'utf8'));
  const [buyer] = await ethers.getSigners();
  const contract = await ethers.getContractAt('GulfFlowEscrowPolicy', deployment.address);

  const supplier = process.env.DEMO_SUPPLIER_ADDRESS || buyer.address;
  const invoiceRef = process.env.DEMO_INVOICE_REF || 'INV-GCC-2048';
  const invoiceAmount = process.env.DEMO_INVOICE_USDC || '18420';
  const advanceAmount = process.env.DEMO_ADVANCE_USDC || '7368';
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes(`${invoiceRef}:commercial-invoice:packing-list:wallet-proof`));
  const dealId = ethers.keccak256(ethers.toUtf8Bytes(`gulf-flow:${invoiceRef}:${supplier}:${Date.now()}`));

  const tx = await contract.lockDeal(dealId, supplier, invoiceRef, usdc6(invoiceAmount), usdc6(advanceAmount), documentHash);
  const receipt = await tx.wait();

  const result = {
    contract: deployment.address,
    dealId,
    supplier,
    invoiceRef,
    documentHash,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    explorer: `https://testnet.arcscan.app/tx/${tx.hash}`,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync('deployments/demo-deal.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
