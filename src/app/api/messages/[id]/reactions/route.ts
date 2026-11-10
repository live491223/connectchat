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

    const { id: messageId } = params;
    const { emoji } = await req.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: authUser.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.reaction.create({
        data: {
          messageId,
          userId: authUser.id,
          emoji,
        },
      });
    }

    // Get updated reactions list
    const reactions = await prisma.reaction.findMany({
      where: { messageId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const io = (global as unknown as { io?: any }).io;
    if (io) {
      io.to(`conv:${message.conversationId}`).emit('message_reactions_updated', {
        messageId,
        conversationId: message.conversationId,
        reactions,
      });
    }

    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
