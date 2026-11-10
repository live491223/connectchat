import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all conversations where authUser is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: authUser.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                statusMessage: true,
                isOnline: true,
                lastSeen: true,
                showOnlineStatus: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatar: true },
            },
            receipts: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format list with last message and unread counts
    const formatted = conversations.map((c) => {
      const myParticipant = c.participants.find((p) => p.userId === authUser.id);
      const lastMessage = c.messages.length > 0 ? c.messages[0] : null;

      return {
        id: c.id,
        name: c.name,
        isGroup: c.isGroup,
        groupAvatar: c.groupAvatar,
        groupDescription: c.groupDescription,
        adminId: c.adminId,
        participants: c.participants,
        lastMessage,
        unreadCount: myParticipant?.unreadCount || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isGroup, recipientId, participantIds, name, groupAvatar, groupDescription } = body;

    // 1-on-1 Conversation
    if (!isGroup) {
      if (!recipientId) {
        return NextResponse.json({ error: 'Recipient ID is required for 1-to-1 chat' }, { status: 400 });
      }

      // Check if conversation already exists between these 2 users
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: authUser.id } } },
            { participants: { some: { userId: recipientId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                  statusMessage: true,
                  isOnline: true,
                  lastSeen: true,
                  showOnlineStatus: true,
                },
              },
            },
          },
        },
      });

      if (existing) {
        return NextResponse.json({ conversation: existing, isExisting: true });
      }

      // Create new 1-on-1
      const newConv = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: authUser.id, role: 'MEMBER' },
              { userId: recipientId, role: 'MEMBER' },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                  statusMessage: true,
                  isOnline: true,
                  lastSeen: true,
                  showOnlineStatus: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ conversation: newConv, isExisting: false });
    }

    // Group Conversation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const allMemberIds = Array.from(new Set([authUser.id, ...(participantIds || [])]));

    const newGroup = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name.trim(),
        groupAvatar: groupAvatar || null,
        groupDescription: groupDescription || null,
        adminId: authUser.id,
        participants: {
          create: allMemberIds.map((userId) => ({
            userId,
            role: userId === authUser.id ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                statusMessage: true,
                isOnline: true,
                lastSeen: true,
                showOnlineStatus: true,
              },
            },
          },
        },
      },
    });

    // Create system message announcing group creation
    await prisma.message.create({
      data: {
        conversationId: newGroup.id,
        senderId: authUser.id,
        content: `${authUser.name} created the group "${name.trim()}".`,
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({ conversation: newGroup });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
