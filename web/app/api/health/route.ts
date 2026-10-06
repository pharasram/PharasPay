import { NextResponse } from 'next/server';
import { requireProductionConfiguration } from '@/lib/config';
export const dynamic = 'force-dynamic';
export function GET(): NextResponse {
  try {
    requireProductionConfiguration();
    return NextResponse.json(
      { status: 'ok', service: 'pharaspay-web' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ status: 'unconfigured' }, { status: 503 });
  }
}
