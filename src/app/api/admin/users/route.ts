import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 1. GET: Fetch all users for Admin
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        isApproved: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch users' }, { status: 500 });
  }
}

// 2. POST: Admin directly adds a new user to the database
export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, email, password, role, isApproved, avatar } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Name, username, email, and password are all required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return NextResponse.json({ error: `Username @${cleanUsername} is already taken` }, { status: 400 });
      }
      return NextResponse.json({ error: `Email ${cleanEmail} is already registered` }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        avatar: avatar || null,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        isApproved: isApproved !== false, // default true when added by admin
        isOnline: false,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        isApproved: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Admin add user error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create user' }, { status: 500 });
  }
}

// 3. PATCH: Admin edits existing user in the database (Name, Username, Email, Role, Approval, Password)
export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, username, email, role, isApproved, password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof username === 'string' && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      // Check if username taken by another user
      const existing = await prisma.user.findFirst({
        where: { username: cleanUsername, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: `Username @${cleanUsername} is already in use` }, { status: 400 });
      }
      updateData.username = cleanUsername;
    }

    if (typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Check if email taken by another user
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: `Email ${cleanEmail} is already in use` }, { status: 400 });
      }
      updateData.email = cleanEmail;
    }

    if (typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved;
    }

    if (role && (role === 'ADMIN' || role === 'USER')) {
      updateData.role = role;
    }

    if (typeof password === 'string' && password.trim().length >= 6) {
      updateData.password = await hashPassword(password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        isApproved: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update user' }, { status: 500 });
  }
}

// 4. DELETE: Admin removes user from database
export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Cannot delete current logged-in admin account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
