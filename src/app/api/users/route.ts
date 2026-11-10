import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const users = await prisma.user.findMany({
      where: {
        id: { not: authUser.id },
        OR: query
          ? [
              { name: { contains: query } },
              { username: { contains: query } },
              { email: { contains: query } },
            ]
          : undefined,
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
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
