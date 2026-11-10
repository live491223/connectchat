const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Track online users: userId -> Set of socketIds
const userSockets = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Make io globally accessible to Next.js API routes
  global.io = io;

  io.on('connection', (socket) => {
    let currentUserId = null;

    // User authentication / presence registration
    socket.on('authenticate', async ({ userId }) => {
      if (!userId) return;
      currentUserId = userId;
      socket.userId = userId;

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Join personal room for private notifications
      socket.join(`user:${userId}`);

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true, lastSeen: new Date() },
        });

        // Broadcast to all clients that user is online
        io.emit('user_status_changed', {
          userId,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error updating user presence:', err.message);
      }
    });

    // Join a conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv:${conversationId}`);
      }
    });

    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing_start', ({ conversationId, userId, userName }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing_start', {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on('typing_stop', ({ conversationId, userId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing_stop', {
        conversationId,
        userId,
      });
    });

    // Real-time message dispatch directly via socket
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, senderId, content, type, fileUrl, fileName, fileSize, duration, replyToId } = data;
        
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            content: content || '',
            type: type || 'TEXT',
            fileUrl,
            fileName,
            fileSize,
            duration,
            replyToId,
          },
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatar: true },
            },
            replyTo: {
              include: {
                sender: { select: { id: true, name: true } },
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

        // Update conversation updated timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to conversation room
        io.to(`conv:${conversationId}`).emit('new_message', message);

        // Also notify participants in their user rooms (for conversation list update / unread badge)
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });

        participants.forEach((p) => {
          if (p.userId !== senderId) {
            io.to(`user:${p.userId}`).emit('conversation_updated', {
              conversationId,
              lastMessage: message,
            });
          }
        });

        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Real-time read receipt update
    socket.on('mark_read', async ({ conversationId, userId, messageIds }) => {
      try {
        if (!messageIds || messageIds.length === 0) return;

        for (const messageId of messageIds) {
          await prisma.messageReceipt.upsert({
            where: {
              messageId_userId: { messageId, userId },
            },
            update: {
              status: 'READ',
              readAt: new Date(),
            },
            create: {
              messageId,
              userId,
              status: 'READ',
              readAt: new Date(),
            },
          });
        }

        io.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          messageIds,
          readAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Socket mark_read error:', err.message);
      }
    });

    // Real-time reactions
    socket.on('toggle_reaction', async ({ messageId, conversationId, userId, emoji }) => {
      try {
        const existing = await prisma.reaction.findUnique({
          where: {
            messageId_userId_emoji: { messageId, userId, emoji },
          },
        });

        if (existing) {
          await prisma.reaction.delete({
            where: { id: existing.id },
          });
        } else {
          await prisma.reaction.create({
            data: { messageId, userId, emoji },
          });
        }

        // Fetch updated reactions for this message
        const reactions = await prisma.reaction.findMany({
          where: { messageId },
          include: { user: { select: { id: true, name: true } } },
        });

        io.to(`conv:${conversationId}`).emit('message_reactions_updated', {
          messageId,
          conversationId,
          reactions,
        });
      } catch (err) {
        console.error('Socket toggle_reaction error:', err.message);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const userSet = userSockets.get(currentUserId);
        userSet.delete(socket.id);

        if (userSet.size === 0) {
          userSockets.delete(currentUserId);
          const lastSeen = new Date();
          try {
            await prisma.user.update({
              where: { id: currentUserId },
              data: { isOnline: false, lastSeen },
            });

            io.emit('user_status_changed', {
              userId: currentUserId,
              isOnline: false,
              lastSeen: lastSeen.toISOString(),
            });
          } catch (err) {
            console.error('Disconnect presence error:', err.message);
          }
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> ConnectChat server ready on http://localhost:${port}`);
    console.log(`> WebSocket real-time engine running on port ${port}`);
  });
});
