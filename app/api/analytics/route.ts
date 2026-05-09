import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.info(
      JSON.stringify({
        source: 'client',
        ...payload,
        at: new Date().toISOString(),
      }),
    );
  } catch {
    // no-op
  }

  return NextResponse.json({ ok: true });
}
