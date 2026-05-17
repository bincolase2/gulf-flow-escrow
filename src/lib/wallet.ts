import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { ARC_TESTNET } from './arc';

export async function addOrSwitchArc() {
  if (!window.ethereum) throw new Error('No browser wallet found. Install MetaMask, Rabby, or Coinbase Wallet.');
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_TESTNET.chainIdHex }] });
  } catch (error) {
    const err = error as { code?: number };
    if (err.code !== 4902) throw error;
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ARC_TESTNET.chainIdHex,
        chainName: ARC_TESTNET.chainName,
        nativeCurrency: ARC_TESTNET.nativeCurrency,
        rpcUrls: ARC_TESTNET.rpcUrls,
        blockExplorerUrls: ARC_TESTNET.blockExplorerUrls,
      }],
    });
  }
}

export async function connectArcWallet() {
  if (!window.ethereum) throw new Error('No browser wallet found.');
  await addOrSwitchArc();
  const accounts = await window.ethereum.request<string[]>({ method: 'eth_requestAccounts' });
  return accounts[0];
}

export async function getArcBalance(address: string) {
  if (!window.ethereum) throw new Error('No browser wallet found.');
  const provider = new BrowserProvider(window.ethereum);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

export async function sendArcMemoTransaction(memo: string) {
  if (!window.ethereum) throw new Error('No browser wallet found.');
  await addOrSwitchArc();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const tx = await signer.sendTransaction({
    to: address,
    value: parseEther('0'),
    data: `0x${Buffer.from(memo, 'utf8').toString('hex')}`,
  });
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? null };
}
