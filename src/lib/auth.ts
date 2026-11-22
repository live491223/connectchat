import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'connectchat-universal-secret-key-2026';
const TOKEN_NAME = 'connectchat_token';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(customToken?: string) {
  try {
    let token = customToken;

    // 1. Try reading cookie
    if (!token) {
      try {
        const cookieStore = cookies();
        token = cookieStore.get(TOKEN_NAME)?.value;
      } catch (e) {
        // cookies() might not be available in some contexts
      }
    }

    // 2. Try reading Authorization header (Bearer <token>)
    if (!token) {
      try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        }
      } catch (e) {
        // headers() might not be available in some contexts
      }
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    return user;
  } catch (err) {
    return null;
  }
}

export const TOKEN_COOKIE_NAME = TOKEN_NAME;
