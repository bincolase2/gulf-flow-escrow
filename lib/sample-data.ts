import type { TradeInvoice } from './types';

export const sampleInvoices: TradeInvoice[] = [
  {
    id: 'INV-GCC-2048',
    buyer: 'Al Noor Hospitality LLC',
    supplier: 'Kochi Textile Exporters',
    corridor: 'UAE → India',
    goods: 'Hotel linen shipment, 12 pallets',
    invoiceAmountUsd: 18420,
    requestedAdvancePct: 40,
    deliveryEtaDays: 9,
    documents: ['Commercial invoice', 'Purchase order', 'Packing list', 'Bill of lading draft'],
  },
  {
    id: 'INV-RIY-7812',
    buyer: 'Najd Solar Maintenance',
    supplier: 'Cairo Switchgear Works',
    corridor: 'Saudi → Egypt',
    goods: 'Replacement inverter cabinets',
    invoiceAmountUsd: 32750,
    requestedAdvancePct: 35,
    deliveryEtaDays: 14,
    documents: ['Commercial invoice', 'Certificate of origin', 'Insurance certificate'],
  },
  {
    id: 'INV-DOH-3321',
    buyer: 'Doha Cloud Kitchens',
    supplier: 'Manila Packaging Co.',
    corridor: 'Qatar → Philippines',
    goods: 'Food-grade compostable containers',
    invoiceAmountUsd: 11880,
    requestedAdvancePct: 50,
    deliveryEtaDays: 11,
    documents: ['Commercial invoice', 'Packing list', 'Supplier KYC attestation'],
  },
];
