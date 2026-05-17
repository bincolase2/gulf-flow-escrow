import { NextResponse } from 'next/server';
import { buildQuote, simulateSettlement } from '../../../../lib/engine';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = typeof body.intent === 'string' ? body.intent : '';
  const quote = body.quote ?? buildQuote(intent);
  return NextResponse.json(simulateSettlement(quote));
}
