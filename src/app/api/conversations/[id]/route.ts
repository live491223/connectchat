import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = params;

    // Verify user is in conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: authUser.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
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
            },
          },
        },
      },
    });

    // Fetch messages with reactions and receipts
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        receipts: true,
      },
    });

    // Reset unread count for current user
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const { name, groupDescription, groupAvatar } = body;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv || !conv.isGroup) {
      return NextResponse.json({ error: 'Group conversation not found' }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: name !== undefined ? name : conv.name,
        groupDescription: groupDescription !== undefined ? groupDescription : conv.groupDescription,
        groupAvatar: groupAvatar !== undefined ? groupAvatar : conv.groupAvatar,
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
