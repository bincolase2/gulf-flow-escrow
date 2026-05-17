import hardhat from 'hardhat';
import fs from 'node:fs';
import path from 'node:path';

const { ethers, network } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error('No deployer configured. Set ARC_DEPLOYER_PRIVATE_KEY in .env.local or .env.');

  const Factory = await ethers.getContractFactory('GulfFlowEscrowPolicy');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contract: 'GulfFlowEscrowPolicy',
    address,
    deployer: deployer.address,
    txHash: tx?.hash ?? null,
    explorer: tx?.hash ? `https://testnet.arcscan.app/tx/${tx.hash}` : null,
    deployedAt: new Date().toISOString(),
  };

  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(path.join('deployments', 'arc-testnet.json'), JSON.stringify(deployment, null, 2) + '\n');
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
