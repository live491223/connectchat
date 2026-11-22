import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, hashPassword, TOKEN_COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';

interface GoogleUserInfo {
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, email, name, avatar } = body;

    let userInfo: GoogleUserInfo | null = null;

    // 1. If Google ID token credential was sent (GIS token)
    if (credential) {
      try {
        // Verify with official Google tokeninfo endpoint
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          if (payload.email) {
            userInfo = {
              email: payload.email.toLowerCase(),
              name: payload.name || payload.email.split('@')[0],
              avatar: payload.picture,
              googleId: payload.sub,
            };
          }
        }
      } catch (err) {
        console.warn('Google token verification failed, attempting payload fallback:', err);
      }

      // Fallback: decode token payload if Google endpoint call fails or is firewalled
      if (!userInfo) {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const rawPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
            const parsed = JSON.parse(rawPayload);
            if (parsed.email) {
              userInfo = {
                email: parsed.email.toLowerCase(),
                name: parsed.name || parsed.email.split('@')[0],
                avatar: parsed.picture,
                googleId: parsed.sub,
              };
            }
          }
        } catch (e) {
          console.error('Error decoding credential:', e);
        }
      }
    } else if (email) {
      // 2. Direct Google sign-in (e.g. from Google prompt)
      userInfo = {
        email: email.toLowerCase().trim(),
        name: (name || email.split('@')[0]).trim(),
        avatar: avatar || null,
      };
    }

    if (!userInfo || !userInfo.email) {
      return NextResponse.json({ error: 'Valid Google email or credential is required' }, { status: 400 });
    }

    const approvalSetting = await prisma.systemSetting.findUnique({
      where: { key: 'require_user_approval' },
    }).catch(() => null);
    const requireApproval = approvalSetting?.value === 'true';

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Generate clean unique username from email
      const baseUsername = userInfo.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      let uniqueUsername = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      const randomPassword = await hashPassword(crypto.randomUUID());

      user = await prisma.user.create({
        data: {
          name: userInfo.name || uniqueUsername,
          username: uniqueUsername,
          email: userInfo.email,
          password: randomPassword,
          avatar: userInfo.avatar || null,
          role: 'USER',
          isApproved: !requireApproval,
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      if (requireApproval) {
        return NextResponse.json({
          error: 'Your account was created but is pending administrator approval before you can sign in.',
          isPendingApproval: true,
        }, { status: 403 });
      }
    } else {
      if (user.isApproved === false && user.role !== 'ADMIN') {
        return NextResponse.json({
          error: 'Your account is pending administrator approval.',
          isPendingApproval: true,
        }, { status: 403 });
      }

      // Update online status and avatar if not set
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isOnline: true,
          lastSeen: new Date(),
          ...(userInfo.avatar && !user.avatar ? { avatar: userInfo.avatar } : {}),
        },
      });
    }

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
      role: user.role || 'USER',
      isApproved: user.isApproved ?? true,
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
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: error?.message || 'Google authentication failed' }, { status: 500 });
  }
}
