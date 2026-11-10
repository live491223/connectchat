import { NextResponse } from 'next/server';
import { getAuthUser, TOKEN_COOKIE_NAME } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (authUser) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { isOnline: false, lastSeen: new Date() },
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete(TOKEN_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
