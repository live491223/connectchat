import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    const targetUsername = (username || 'sarah').toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      statusMessage: user.statusMessage,
      isOnline: true,
      lastSeen: new Date(),
      showOnlineStatus: user.showOnlineStatus,
      readReceipts: user.readReceipts,
      theme: user.theme,
    };

    const response = NextResponse.json({
      success: true,
      user: userProfile,
      token,
    });

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Demo login failed' }, { status: 500 });
  }
}
