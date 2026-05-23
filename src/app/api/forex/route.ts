import { NextRequest, NextResponse } from 'next/server';
import { getRatesTo } from '@/lib/stock/forex';

/**
 * GET /api/forex?base=USD&currencies=INR,EUR,GBP
 * Returns exchange rates to convert each currency into the base.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get('base') || 'USD').toUpperCase();
  const raw = searchParams.get('currencies') || '';
  const currencies = raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (currencies.length === 0) {
    return NextResponse.json({ base, rates: { [base]: 1 } });
  }

  try {
    const rates = await getRatesTo(currencies, base);
    return NextResponse.json({ base, rates });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
