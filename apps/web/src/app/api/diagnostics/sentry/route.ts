import { NextResponse } from 'next/server';

export async function GET() {
  const hasDsn = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  return NextResponse.json({ ok: true, hasDsn });
}


