const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ConnectChat database...');

  // Clean existing data
  await prisma.messageReceipt.deleteMany({});
  await prisma.reaction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users with stylish SVGs / avatars
  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      username: 'sarah',
      email: 'sarah@connectchat.io',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      statusMessage: 'Building the future of universal web messaging ⚡',
      isOnline: true,
      lastSeen: new Date(),
      showOnlineStatus: true,
      readReceipts: true,
      theme: 'dark',
    },
  });

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      username: 'alex',
      email: 'alex@connectchat.io',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      statusMessage: 'Designing pixel-perfect responsive layouts 🎨',
      isOnline: true,
      lastSeen: new Date(),
      showOnlineStatus: true,
      readReceipts: true,
      theme: 'system',
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      username: 'elena',
      email: 'elena@connectchat.io',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      statusMessage: 'PWA & Offline Service Workers evangelist 📱',
      isOnline: false,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      showOnlineStatus: true,
      readReceipts: true,
      theme: 'dark',
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'David Chen',
      username: 'david',
      email: 'david@connectchat.io',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      statusMessage: 'Scaling real-time WebSocket pipelines 🚀',
      isOnline: true,
      lastSeen: new Date(),
      showOnlineStatus: true,
      readReceipts: true,
      theme: 'light',
    },
  });

  console.log('✅ Users created:', [sarah.name, alex.name, elena.name, david.name]);

  // 1. One-to-one conversation: Sarah & Alex
  const convSarahAlex = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: sarah.id, role: 'MEMBER' },
          { userId: alex.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      conversationId: convSarahAlex.id,
      senderId: alex.id,
      content: 'Hey Sarah! Have you checked out the new 3-panel responsive layout for tablet and desktop?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hr ago
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: convSarahAlex.id,
      senderId: sarah.id,
      content: 'Yes! It transitions seamlessly to a single-view stack on mobile (360px - 430px) and maintains high performance without horizontal scroll.',
      type: 'TEXT',
      replyToId: msg1.id,
      createdAt: new Date(Date.now() - 50 * 60 * 1000),
    },
  });

  // Reaction on msg2
  await prisma.reaction.create({
    data: {
      messageId: msg2.id,
      userId: alex.id,
      emoji: '🔥',
    },
  });

  const msg3 = await prisma.message.create({
    data: {
      conversationId: convSarahAlex.id,
      senderId: alex.id,
      content: 'Here is the UI mock preview for the PWA install prompt banner!',
      type: 'IMAGE',
      fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      fileName: 'connectchat-pwa-preview.jpg',
      fileSize: 342100,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  await prisma.reaction.create({
    data: {
      messageId: msg3.id,
      userId: sarah.id,
      emoji: '❤️',
    },
  });

  const msg4 = await prisma.message.create({
    data: {
      conversationId: convSarahAlex.id,
      senderId: sarah.id,
      content: 'The custom install banner handles both iOS Safari ("Add to Home Screen") and Chromium beforeinstallprompt with one-click installation!',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  // Receipts
  await prisma.messageReceipt.create({
    data: { messageId: msg4.id, userId: alex.id, status: 'READ', readAt: new Date() },
  });

  // 2. Group Conversation: Core Engineering & Design
  const groupConv = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: '🚀 ConnectChat Core Team',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      groupDescription: 'Official channel for universal cross-platform chat architecture & releases.',
      adminId: sarah.id,
      participants: {
        create: [
          { userId: sarah.id, role: 'ADMIN' },
          { userId: alex.id, role: 'MEMBER' },
          { userId: elena.id, role: 'MEMBER' },
          { userId: david.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const gMsg1 = await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: sarah.id,
      content: 'Welcome everyone to the ConnectChat release channel! 🌟 Our objective is 100% universal compatibility: Android, iOS, Windows, macOS, Linux from a single codebase.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 120 * 60 * 1000),
    },
  });

  await prisma.reaction.create({
    data: { messageId: gMsg1.id, userId: alex.id, emoji: '🎉' },
  });
  await prisma.reaction.create({
    data: { messageId: gMsg1.id, userId: elena.id, emoji: '🙌' },
  });
  await prisma.reaction.create({
    data: { messageId: gMsg1.id, userId: david.id, emoji: '🚀' },
  });

  const gMsg2 = await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: elena.id,
      content: 'Service worker is configured with stale-while-revalidate for static assets, network-first for chat history, and an interactive offline fallback page.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
    },
  });

  const gMsg3 = await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: david.id,
      content: 'Socket.IO integration runs seamlessly alongside Next.js on port 3000. Typing indicators, read receipts, and reactions broadcast in real time with sub-10ms latency.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
    },
  });

  const gMsg4 = await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: alex.id,
      content: 'Audio voice messages, drag-and-drop media attachments, and emoji reaction picker are all tested across mobile viewports down to 360px.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  // 3. One-to-one conversation: Sarah & Elena
  const convSarahElena = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: sarah.id, role: 'MEMBER' },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convSarahElena.id,
      senderId: elena.id,
      content: 'Hi Sarah, the PWA manifest standalone display mode and theme-color meta tags are fully in sync with the user selected dark/light theme!',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convSarahElena.id,
      senderId: sarah.id,
      content: 'Awesome Elena! Safe-area-insets for iPhone notches and dynamic viewport height (100dvh) work perfectly.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  // 4. One-to-one conversation: Sarah & David
  const convSarahDavid = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: sarah.id, role: 'MEMBER' },
          { userId: david.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convSarahDavid.id,
      senderId: david.id,
      content: 'Hey Sarah, search within conversation indexing is ready with instant keyword highlighting and keyboard shortcut Ctrl+K!',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  console.log('✅ ConnectChat database seeded with demo conversations, messages, reactions, and receipts.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
