import { NextResponse } from 'next/server';
import { openapi } from '@/lib/openapi';
export function GET(): NextResponse {
  return NextResponse.json(openapi);
}
