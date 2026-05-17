import { sampleInvoices } from './sample-data';
import type { EscrowQuote, RiskDecision, SettlementReceipt, TradeInvoice } from './types';

const supplierWallets: Record<string, string> = {
  'Kochi Textile Exporters': '0x8A0c...19F2',
  'Cairo Switchgear Works': '0x31b7...A40e',
  'Manila Packaging Co.': '0xa55D...C90b',
};

function hashLike(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function pickInvoice(intent: string): TradeInvoice {
  const query = intent.toLowerCase();
  if (query.includes('egypt') || query.includes('solar') || query.includes('riyadh')) return sampleInvoices[1];
  if (query.includes('philippines') || query.includes('qatar') || query.includes('packaging')) return sampleInvoices[2];
  return sampleInvoices[0];
}

export function assessRisk(invoice: TradeInvoice): RiskDecision {
  const missing = ['Commercial invoice', 'Purchase order'].filter((doc) => !invoice.documents.includes(doc));
  const advanceRisk = invoice.requestedAdvancePct > 45 ? 18 : invoice.requestedAdvancePct > 35 ? 10 : 4;
  const etaRisk = invoice.deliveryEtaDays > 12 ? 9 : 3;
  const docRisk = missing.length * 14;
  const score = Math.min(96, 28 + advanceRisk + etaRisk + docRisk);
  const level = score < 45 ? 'low' : score < 65 ? 'medium' : 'high';

  return {
    score,
    level,
    reasons: [
      `${invoice.requestedAdvancePct}% advance requested against a ${invoice.deliveryEtaDays}-day delivery window`,
      missing.length ? `Missing ${missing.join(', ')}` : 'Core invoice and trade documents are present',
      'Counterparty is eligible for bounded escrow instead of unsecured prepayment',
    ],
    requiredDocs: Array.from(new Set([...missing, 'Supplier wallet ownership proof', 'Sanctions screening reference'])),
  };
}

export function buildQuote(intent: string): EscrowQuote {
  const invoice = pickInvoice(intent);
  const risk = assessRisk(invoice);
  const advanceUsdc = Number((invoice.invoiceAmountUsd * invoice.requestedAdvancePct / 100).toFixed(2));
  const gatewayFeeUsdc = Number(Math.max(2.5, advanceUsdc * 0.0025).toFixed(2));
  const reserveUsdc = Number((invoice.invoiceAmountUsd - advanceUsdc).toFixed(2));
  const supplierReceivesUsdc = Number((advanceUsdc - gatewayFeeUsdc).toFixed(2));

  return {
    invoice,
    risk,
    advanceUsdc,
    reserveUsdc,
    gatewayFeeUsdc,
    supplierReceivesUsdc,
    fxReference: 'USDC/USD 1.0000 · local payout via regulated off-ramp partner',
    milestones: [
      { label: 'Advance locked in USDC escrow', amountUsdc: advanceUsdc, status: 'locked' },
      { label: 'Documents verified', amountUsdc: 0, status: risk.requiredDocs.length ? 'pending' : 'released' },
      { label: 'Supplier advance release', amountUsdc: supplierReceivesUsdc, status: 'pending' },
      { label: 'Final balance after proof of shipment', amountUsdc: reserveUsdc, status: 'pending' },
    ],
  };
}

export function simulateSettlement(quote: EscrowQuote): SettlementReceipt {
  const seed = `${quote.invoice.id}-${quote.advanceUsdc}-${quote.invoice.supplier}`;
  return {
    id: `GF-${hashLike(seed).toUpperCase()}`,
    rail: 'Circle Gateway + Arc USDC',
    mode: 'simulation',
    escrowWallet: '0xEscrowPolicy...GulfFlow',
    supplierWallet: supplierWallets[quote.invoice.supplier] ?? '0xSupplier...0000',
    txHash: `0x${hashLike(seed + 'arc')}${hashLike(seed + 'usdc')}${hashLike(seed + 'receipt')}${hashLike(seed + 'milestone')}`,
    createdAt: new Date().toISOString(),
    complianceMemo: 'Release is blocked until wallet ownership proof and sanctions-screening reference are attached. Demo uses simulated USDC settlement and no real funds.',
  };
}
