import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Demo authentication is permanently disabled. Please sign in with your email or Google account.' },
    { status: 404 }
  );
}
