export type Corridor = 'UAE → India' | 'Saudi → Egypt' | 'Qatar → Philippines' | 'UAE → Kenya';

export type TradeInvoice = {
  id: string;
  buyer: string;
  supplier: string;
  corridor: Corridor;
  goods: string;
  invoiceAmountUsd: number;
  requestedAdvancePct: number;
  deliveryEtaDays: number;
  documents: string[];
};

export type RiskDecision = {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  requiredDocs: string[];
};

export type EscrowQuote = {
  invoice: TradeInvoice;
  risk: RiskDecision;
  advanceUsdc: number;
  reserveUsdc: number;
  gatewayFeeUsdc: number;
  supplierReceivesUsdc: number;
  fxReference: string;
  milestones: { label: string; amountUsdc: number; status: 'locked' | 'released' | 'pending' }[];
};

export type SettlementReceipt = {
  id: string;
  rail: 'Circle Gateway + Arc USDC';
  mode: 'simulation' | 'testnet-ready';
  escrowWallet: string;
  supplierWallet: string;
  txHash: string;
  createdAt: string;
  complianceMemo: string;
};
