import { BrowserProvider, Contract, JsonRpcProvider, formatUnits, keccak256, parseUnits, toUtf8Bytes } from 'ethers';
import type { EscrowQuote } from '../../lib/types';
import { ARC_TESTNET } from './arc';
import { addOrSwitchArc } from './wallet';

export const ESCROW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || '';
export const ESCROW_DEPLOY_TX = process.env.NEXT_PUBLIC_ESCROW_DEPLOY_TX || '';

export const ESCROW_ABI = [
  'event DealLocked(bytes32 indexed dealId,address indexed buyer,address indexed supplier,string invoiceRef,uint256 invoiceAmountUsdc6,uint256 advanceAmountUsdc6,bytes32 documentHash)',
  'function lockDeal(bytes32 dealId,address supplier,string invoiceRef,uint256 invoiceAmountUsdc6,uint256 advanceAmountUsdc6,bytes32 documentHash) external',
  'function approveDocuments(bytes32 dealId,bytes32 documentHash) external',
  'function releaseAdvance(bytes32 dealId) external',
  'function completeDeal(bytes32 dealId) external',
  'function cancelDeal(bytes32 dealId) external',
  'function getDeal(bytes32 dealId) external view returns (tuple(address buyer,address supplier,uint256 invoiceAmountUsdc6,uint256 advanceAmountUsdc6,bytes32 documentHash,string invoiceRef,uint8 status,uint256 createdAt))',
] as const;

export type ChainDeal = {
  buyer: string;
  supplier: string;
  invoiceRef: string;
  invoiceAmountUsdc: string;
  advanceAmountUsdc: string;
  documentHash: string;
  status: string;
  createdAt: string;
};

const STATUS = ['Draft', 'Locked', 'DocumentsApproved', 'AdvanceReleased', 'Completed', 'Cancelled'];

export function buildDealPayload(quote: EscrowQuote, supplierAddress: string, nonce = Date.now().toString()) {
  const documentHash = keccak256(toUtf8Bytes(`${quote.invoice.id}:${quote.invoice.documents.join('|')}:wallet-proof:sanctions-ref`));
  const dealId = keccak256(toUtf8Bytes(`gulf-flow:${quote.invoice.id}:${supplierAddress}:${quote.advanceUsdc}:${nonce}`));
  return {
    dealId,
    supplierAddress,
    invoiceRef: `${quote.invoice.id}-${nonce.slice(-6)}`,
    invoiceAmountUsdc6: parseUnits(String(quote.invoice.invoiceAmountUsd), 6),
    advanceAmountUsdc6: parseUnits(String(quote.advanceUsdc), 6),
    documentHash,
  };
}

function normalizeDeal(raw: { buyer: string; supplier: string; invoiceAmountUsdc6: bigint; advanceAmountUsdc6: bigint; documentHash: string; invoiceRef: string; status: bigint | number; createdAt: bigint | number }): ChainDeal {
  const statusIndex = Number(raw.status);
  const createdAt = Number(raw.createdAt);
  return {
    buyer: raw.buyer,
    supplier: raw.supplier,
    invoiceRef: raw.invoiceRef,
    invoiceAmountUsdc: formatUnits(raw.invoiceAmountUsdc6, 6),
    advanceAmountUsdc: formatUnits(raw.advanceAmountUsdc6, 6),
    documentHash: raw.documentHash,
    status: STATUS[statusIndex] ?? `Status ${statusIndex}`,
    createdAt: createdAt ? new Date(createdAt * 1000).toISOString() : '',
  };
}

export async function readDealFromContract(dealId: string, browserWallet = false): Promise<ChainDeal> {
  if (!ESCROW_CONTRACT_ADDRESS) throw new Error('Escrow contract is not configured.');
  const provider = browserWallet && window.ethereum
    ? new BrowserProvider(window.ethereum)
    : new JsonRpcProvider(ARC_TESTNET.rpcUrls[0], ARC_TESTNET.chainIdDecimal);
  const contract = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, provider);
  const raw = await contract.getDeal(dealId);
  return normalizeDeal(raw);
}

function getEscrowSignerContract() {
  if (!window.ethereum) throw new Error('No browser wallet found.');
  if (!ESCROW_CONTRACT_ADDRESS) throw new Error('Escrow contract is not configured. Deploy it, then set NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS.');
  return addOrSwitchArc().then(async () => {
    const provider = new BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    return new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);
  });
}

async function waitForLifecycleTx(txPromise: Promise<{ hash: string; wait: () => Promise<{ blockNumber?: number } | null> }>, dealId: string) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  const chainDeal = await readDealFromContract(dealId, true);
  return { hash: tx.hash as string, blockNumber: receipt?.blockNumber ?? null, dealId, chainDeal };
}

export async function lockDealOnContract(quote: EscrowQuote, supplierAddress: string, nonce?: string) {
  const contract = await getEscrowSignerContract();
  const payload = buildDealPayload(quote, supplierAddress, nonce);
  const result = await waitForLifecycleTx(contract.lockDeal(
    payload.dealId,
    payload.supplierAddress,
    payload.invoiceRef,
    payload.invoiceAmountUsdc6,
    payload.advanceAmountUsdc6,
    payload.documentHash,
  ), payload.dealId);
  return { ...payload, ...result };
}

export async function approveDocumentsOnContract(dealId: string, documentHash: string) {
  const contract = await getEscrowSignerContract();
  return waitForLifecycleTx(contract.approveDocuments(dealId, documentHash), dealId);
}

export async function releaseAdvanceOnContract(dealId: string) {
  const contract = await getEscrowSignerContract();
  return waitForLifecycleTx(contract.releaseAdvance(dealId), dealId);
}

export async function completeDealOnContract(dealId: string) {
  const contract = await getEscrowSignerContract();
  return waitForLifecycleTx(contract.completeDeal(dealId), dealId);
}

export async function cancelDealOnContract(dealId: string) {
  const contract = await getEscrowSignerContract();
  return waitForLifecycleTx(contract.cancelDeal(dealId), dealId);
}
