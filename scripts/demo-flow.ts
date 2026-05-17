import { buildQuote, simulateSettlement } from '../lib/engine';
const quote = buildQuote('Finance a UAE hotel linen shipment from India with 40% supplier advance.');
const receipt = simulateSettlement(quote);
console.log(JSON.stringify({ quote, receipt }, null, 2));
