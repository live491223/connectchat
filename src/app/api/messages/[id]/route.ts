import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = params;
    const { content } = await req.json();

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.senderId !== authUser.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
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
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        receipts: true,
      },
    });

    const io = (global as unknown as { io?: any }).io;
    if (io) {
      io.to(`conv:${updated.conversationId}`).emit('message_edited', updated);
    }

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = params;

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.senderId !== authUser.id) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    // Soft delete preserves layout and thread continuity
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message was deleted',
        fileUrl: null,
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
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        receipts: true,
      },
    });

    const io = (global as unknown as { io?: any }).io;
    if (io) {
      io.to(`conv:${updated.conversationId}`).emit('message_deleted', {
        messageId,
        conversationId: updated.conversationId,
      });
    }

    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
