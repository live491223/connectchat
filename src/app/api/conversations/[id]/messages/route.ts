import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(
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
    const { content, type, fileUrl, fileName, fileSize, duration, replyToId } = body;

    // Verify membership
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: authUser.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: authUser.id,
        content: content || '',
        type: type || 'TEXT',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        duration: duration || null,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
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
            user: { select: { id: true, name: true } },
          },
        },
        receipts: true,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Increment unread count for other participants
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: authUser.id },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Emit real-time event via Socket.IO if running
    const io = (global as unknown as { io?: any }).io;
    if (io) {
      io.to(`conv:${conversationId}`).emit('new_message', message);

      const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });

      allParticipants.forEach((p) => {
        if (p.userId !== authUser.id) {
          io.to(`user:${p.userId}`).emit('conversation_updated', {
            conversationId,
            lastMessage: message,
          });
        }
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
