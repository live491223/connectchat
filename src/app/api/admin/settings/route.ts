import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      settings: {
        pwa_enabled: settingsMap['pwa_enabled'] !== 'false',
        announcement_enabled: settingsMap['announcement_enabled'] === 'true',
        announcement_text: settingsMap['announcement_text'] || '',
        require_user_approval: settingsMap['require_user_approval'] === 'true',
      },
    });
  } catch (error: any) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { pwa_enabled, announcement_enabled, announcement_text, require_user_approval } = body;

    const updates: { key: string; value: string }[] = [];

    if (typeof pwa_enabled === 'boolean') {
      updates.push({ key: 'pwa_enabled', value: String(pwa_enabled) });
    }
    if (typeof announcement_enabled === 'boolean') {
      updates.push({ key: 'announcement_enabled', value: String(announcement_enabled) });
    }
    if (typeof announcement_text === 'string') {
      updates.push({ key: 'announcement_text', value: announcement_text });
    }
    if (typeof require_user_approval === 'boolean') {
      updates.push({ key: 'require_user_approval', value: String(require_user_approval) });
    }

    for (const item of updates) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}
