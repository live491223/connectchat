import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar, statusMessage, showOnlineStatus, readReceipts, theme } = body;

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: name !== undefined ? name : authUser.name,
        avatar: avatar !== undefined ? avatar : authUser.avatar,
        statusMessage: statusMessage !== undefined ? statusMessage : authUser.statusMessage,
        showOnlineStatus: showOnlineStatus !== undefined ? showOnlineStatus : authUser.showOnlineStatus,
        readReceipts: readReceipts !== undefined ? readReceipts : authUser.readReceipts,
        theme: theme !== undefined ? theme : authUser.theme,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        showOnlineStatus: true,
        readReceipts: true,
        theme: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
