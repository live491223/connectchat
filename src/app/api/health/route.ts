import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const isVercel = !!process.env.VERCEL;
  const dbUrl = process.env.DATABASE_URL || '';
  const dbPrefix = dbUrl ? dbUrl.split(':')[0] : 'none';

  let dbStatus = 'unknown';
  let dbError = null;
  let userCount = 0;

  try {
    userCount = await prisma.user.count();
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error';
    dbError = {
      message: err.message,
      code: err.code,
    };
  }

  return NextResponse.json({
    status: 'ok',
    isVercel,
    nodeEnv: process.env.NODE_ENV,
    dbPrefix,
    dbStatus,
    userCount,
    dbError,
  });
}
