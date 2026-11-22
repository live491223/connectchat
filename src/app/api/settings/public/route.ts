import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      pwa_enabled: settingsMap['pwa_enabled'] !== 'false', // default true
      announcement_enabled: settingsMap['announcement_enabled'] === 'true',
      announcement_text: settingsMap['announcement_text'] || '',
      require_user_approval: settingsMap['require_user_approval'] === 'true',
    });
  } catch (err: any) {
    return NextResponse.json({
      pwa_enabled: true,
      announcement_enabled: false,
      announcement_text: '',
      require_user_approval: false,
    });
  }
}
