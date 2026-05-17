import { NextResponse } from 'next/server';
import { buildQuote } from '../../../../lib/engine';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = typeof body.intent === 'string' ? body.intent : '';
  return NextResponse.json(buildQuote(intent));
}
