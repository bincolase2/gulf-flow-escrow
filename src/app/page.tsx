'use client';

import { useState } from 'react';
import type { EscrowQuote } from '../../lib/types';
import { type ChainDeal, ESCROW_CONTRACT_ADDRESS, ESCROW_DEPLOY_TX, approveDocumentsOnContract, cancelDealOnContract, completeDealOnContract, lockDealOnContract, readDealFromContract, releaseAdvanceOnContract } from '../lib/escrow-contract';
import { connectArcWallet, getArcBalance } from '../lib/wallet';

const scenarios = [
  'Finance a UAE hotel linen shipment from India with 40% supplier advance, but keep funds locked until documents pass.',
  'Saudi solar maintenance company needs Egyptian switchgear supplier paid safely after export docs are verified.',
  'Qatar cloud kitchen wants packaging from the Philippines, supplier asks for 50% advance.',
];

type ArcTx = { hash: string; blockNumber: number | null; dealId: string };
type LifecycleStep = { label: string; hash: string; blockNumber: number | null; status: string };

export default function Home() {
  const [intent, setIntent] = useState(scenarios[0]);
  const [quote, setQuote] = useState<EscrowQuote | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [supplierAddress, setSupplierAddress] = useState('');
  const [arcTx, setArcTx] = useState<ArcTx | null>(null);
  const [chainDeal, setChainDeal] = useState<ChainDeal | null>(null);
  const [lifecycleSteps, setLifecycleSteps] = useState<LifecycleStep[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('GulfFlow escrow contract is ready. Connect wallet to start.');

  async function generateQuote(nextIntent = intent) {
    try {
      setBusy(true);
      setIntent(nextIntent);
      setArcTx(null);
      setChainDeal(null);
      setLifecycleSteps([]);
      setNotice('Pricing demo trade packet…');
      const response = await fetch('/api/quote', { method: 'POST', body: JSON.stringify({ intent: nextIntent }) });
      if (!response.ok) throw new Error('Quote API failed.');
      setQuote(await response.json());
      setNotice('Trade packet priced. Next step: lock the demo deal on-chain.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Quote generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function connectWallet() {
    try {
      setBusy(true);
      const address = await connectArcWallet();
      setWallet(address);
      setSupplierAddress((current) => current || address);
      setBalance(await getArcBalance(address));
      setNotice('Wallet connected. Quote a demo deal, then lock it on-chain.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.');
    } finally {
      setBusy(false);
    }
  }

  async function lockOnContract() {
    try {
      setBusy(true);
      let activeQuote = quote;
      if (!activeQuote) {
        setNotice('No quote yet. Pricing demo deal first…');
        const response = await fetch('/api/quote', { method: 'POST', body: JSON.stringify({ intent }) });
        if (!response.ok) throw new Error('Quote API failed.');
        activeQuote = await response.json();
        setQuote(activeQuote);
      }
      if (!activeQuote) throw new Error('Quote generation failed. Try Price demo deal again.');
      const targetSupplier = supplierAddress || wallet;
      if (!targetSupplier) throw new Error('Connect wallet or enter supplier address first.');
      setNotice('Opening wallet to lock a fresh demo deal on Arc Testnet…');
      const tx = await lockDealOnContract(activeQuote, targetSupplier, `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
      setArcTx({ hash: tx.hash, blockNumber: tx.blockNumber, dealId: tx.dealId });
      setChainDeal(tx.chainDeal);
      setLifecycleSteps([{ label: 'Lock deal', hash: tx.hash, blockNumber: tx.blockNumber, status: tx.chainDeal.status }]);
      setNotice('Demo deal locked and verified from the escrow contract.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Contract lock failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOnChain() {
    if (!arcTx?.dealId) return;
    try {
      setBusy(true);
      setChainDeal(await readDealFromContract(arcTx.dealId, true));
      setNotice('Deal state reloaded from the contract.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'On-chain read failed.');
    } finally {
      setBusy(false);
    }
  }

  async function runLifecycleAction(label: string, action: () => Promise<{ hash: string; blockNumber: number | null; dealId: string; chainDeal: ChainDeal }>, successNotice: string) {
    try {
      setBusy(true);
      const tx = await action();
      setArcTx({ hash: tx.hash, blockNumber: tx.blockNumber, dealId: tx.dealId });
      setChainDeal(tx.chainDeal);
      setLifecycleSteps((steps) => [...steps, { label, hash: tx.hash, blockNumber: tx.blockNumber, status: tx.chainDeal.status }]);
      setNotice(successNotice);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setBusy(false);
    }
  }

  const canApproveDocs = Boolean(arcTx?.dealId && chainDeal?.status === 'Locked' && chainDeal.documentHash);
  const canReleaseAdvance = Boolean(arcTx?.dealId && chainDeal?.status === 'DocumentsApproved');
  const canCompleteDeal = Boolean(arcTx?.dealId && chainDeal?.status === 'AdvanceReleased');
  const canCancelDeal = Boolean(arcTx?.dealId && (chainDeal?.status === 'Locked' || chainDeal?.status === 'DocumentsApproved'));
  const exposure = quote ? quote.advanceUsdc + quote.reserveUsdc : 0;

  return (
    <main className="terminalShell">
      <aside className="sideRail">
        <div className="brandMark">GF</div>
        <div className="arcBadge"><span>Powered by</span><b>Arc Testnet</b></div>
        <nav><span className="active">Deal desk</span><span>Contract</span><span>Ledger</span><span>Notes</span></nav>
        <div className="networkCard"><small>GulfFlow</small><b>Escrow</b><code>LIVE</code><p>trade finance desk</p></div>
      </aside>

      <section className="workspace">
        <header className="topBar">
          <div><p className="kicker">GulfFlow Escrow Console</p><h1>GulfFlow trade finance desk</h1></div>
          <button onClick={connectWallet} disabled={busy}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'Connect Arc wallet'}</button>
        </header>

        <div className="ticker">
          <span>{notice}</span><span>GulfFlow Escrow</span><span>Runs on Arc Testnet</span><span>SME trade finance</span>
          <span>{ESCROW_CONTRACT_ADDRESS ? 'Contract ready' : 'Contract not configured'}</span>
          {balance && <span>Wallet connected</span>}
        </div>

        <section className="opsGrid">
          <div className="commandPanel">
            <div className="panelHead"><span>01</span><b>Demo trade packet</b></div>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={8} />
            <div className="scenarioList">{scenarios.map((scenario, index) => <button key={scenario} onClick={() => generateQuote(scenario)}>Load case {index + 1}</button>)}</div>
            <button className="primaryAction" onClick={() => generateQuote()} disabled={busy}>Price demo deal</button>
          </div>

          <div className="statusBoard">
            <div className="panelHead"><span>02</span><b>Exposure snapshot</b></div>
            <div className="bigNumber">{exposure ? exposure.toLocaleString() : '—'}<em> USDC</em></div>
            <div className="meter"><i style={{ width: quote ? `${Math.min(quote.risk.score, 100)}%` : '0%' }} /></div>
            <dl><dt>Status</dt><dd>demo contract live</dd><dt>Risk</dt><dd>{quote ? `${quote.risk.level} · ${quote.risk.score}/100` : 'not priced'}</dd><dt>Advance</dt><dd>{quote ? `${quote.advanceUsdc.toLocaleString()} USDC` : '—'}</dd><dt>Contract</dt><dd>{ESCROW_CONTRACT_ADDRESS ? 'deployed' : 'missing'}</dd></dl>
          </div>
        </section>

        {quote && <section className="dealTape"><div className="ticket"><small>Buyer</small><b>{quote.invoice.buyer}</b><span>{quote.invoice.corridor}</span></div><div className="ticket supplier"><small>Supplier</small><b>{quote.invoice.supplier}</b><span>{quote.invoice.goods}</span></div><div className="ticket"><small>Invoice</small><b>{quote.invoice.id}</b><span>${quote.invoice.invoiceAmountUsd.toLocaleString()}</span></div></section>}

        {quote && <section className="lowerGrid">
          <div className="ledgerPanel"><div className="panelHead"><span>03</span><b>Milestone ledger</b></div>{quote.milestones.map((m, index) => <div className="ledgerRow" key={m.label}><code>{String(index + 1).padStart(2, '0')}</code><p><b>{m.label}</b><span>{chainDeal ? `contract status: ${chainDeal.status}` : m.status}</span></p><strong>{m.amountUsdc.toLocaleString()} USDC</strong></div>)}</div>
          <div className="compliancePanel">
            <div className="panelHead"><span>04</span><b>Contract proof station</b></div>
            <ul>{quote.risk.requiredDocs.map((doc) => <li key={doc}>{doc}</li>)}</ul>
            <label className="supplierInput"><small>Supplier wallet address</small><input value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder="0x..." /></label>
            <div className="railDiagram"><span>Buyer</span><i /> <span>Escrow policy</span><i /> <span>Arc</span><i /> <span>Supplier</span></div>
            <button className="primaryAction" onClick={lockOnContract} disabled={busy || !wallet || !ESCROW_CONTRACT_ADDRESS}>Lock demo deal</button>
            <button onClick={() => arcTx && chainDeal && runLifecycleAction('Approve documents', () => approveDocumentsOnContract(arcTx.dealId, chainDeal.documentHash), 'Documents approved on-chain.') } disabled={busy || !canApproveDocs}>Approve documents</button>
            <button onClick={() => arcTx && runLifecycleAction('Release advance', () => releaseAdvanceOnContract(arcTx.dealId), 'Supplier advance released in contract state.') } disabled={busy || !canReleaseAdvance}>Release advance</button>
            <button onClick={() => arcTx && runLifecycleAction('Complete deal', () => completeDealOnContract(arcTx.dealId), 'Deal completed on-chain.') } disabled={busy || !canCompleteDeal}>Complete deal</button>
            <button onClick={() => arcTx && runLifecycleAction('Cancel deal', () => cancelDealOnContract(arcTx.dealId), 'Deal cancelled on-chain.') } disabled={busy || !canCancelDeal}>Cancel deal</button>
            <button onClick={verifyOnChain} disabled={busy || !arcTx?.dealId}>Read contract state</button>
          </div>
        </section>}

        {arcTx && <section className="receiptStrip"><div><small>Proof</small><b>on-chain contract call</b></div><div><small>Block</small><b>{arcTx.blockNumber ?? 'pending'}</b></div><div><small>Status</small><b>{chainDeal?.status ?? 'reading'}</b></div><div className="wideCell"><small>Receipt link</small><a href={`https://testnet.arcscan.app/tx/${arcTx.hash}`} target="_blank" rel="noreferrer">{arcTx.hash}</a></div><div className="wideCell"><small>Deal ID</small><b>{arcTx.dealId}</b></div></section>}

        {lifecycleSteps.length > 0 && <section className="lifecycleBoard">
          <div className="panelHead"><span>05</span><b>Escrow lifecycle</b></div>
          {lifecycleSteps.map((step, index) => <div className="lifecycleRow" key={`${step.hash}-${step.label}`}><code>{String(index + 1).padStart(2, '0')}</code><p><b>{step.label}</b><span>{step.status} · block {step.blockNumber ?? 'pending'}</span></p><a href={`https://testnet.arcscan.app/tx/${step.hash}`} target="_blank" rel="noreferrer">ArcScan</a></div>)}
        </section>}

        {chainDeal && <section className="chainStateBoard">
          <div className="panelHead"><span>06</span><b>Contract verification</b></div>
          <dl><dt>Buyer</dt><dd>{chainDeal.buyer}</dd><dt>Supplier</dt><dd>{chainDeal.supplier}</dd><dt>Invoice ref</dt><dd>{chainDeal.invoiceRef}</dd><dt>Invoice amount</dt><dd>{chainDeal.invoiceAmountUsdc} USDC</dd><dt>Advance</dt><dd>{chainDeal.advanceAmountUsdc} USDC</dd><dt>Document hash</dt><dd>{chainDeal.documentHash}</dd><dt>Created</dt><dd>{chainDeal.createdAt}</dd></dl>
        </section>}

        <section className="submissionBoard" id="submission">
          <div className="panelHead"><span>07</span><b>Submission dashboard</b></div>
          <div className="submissionGrid">
            <article><small>Problem</small><p>GCC SMEs need supplier advances without unsecured prepayment, slow bank rails, or opaque document checks.</p></article>
            <article><small>Solution</small><p>A small working escrow demo: quote a deal, sign a contract call, then read the stored deal back.</p></article>
            <article><small>What is live</small><p>The escrow policy contract is deployed and the UI can write/read demo deals on testnet.</p></article>
            <article><small>What is simplified</small><p>Document checks are represented by hashes; production custody and KYB are intentionally out of scope.</p></article>
          </div>
          <div className="submissionLinks"><a href={ESCROW_DEPLOY_TX ? `https://testnet.arcscan.app/tx/${ESCROW_DEPLOY_TX}` : '#'} target="_blank" rel="noreferrer">Deployment proof</a><a href="#">What works</a><a href="#">Known limits</a></div>
        </section>
      </section>
    </main>
  );
}
