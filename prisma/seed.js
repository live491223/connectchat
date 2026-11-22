const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ConnectChat database (Clean Production Mode)...');

  // Clean existing data
  await prisma.messageReceipt.deleteMany({});
  await prisma.reaction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create System Administrator (Only Account)
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      username: 'admin',
      email: 'admin@connectchat.io',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'ADMIN',
      isApproved: true,
      statusMessage: '👑 System Administrator - Full Access',
      isOnline: true,
      lastSeen: new Date(),
      showOnlineStatus: true,
      readReceipts: true,
      theme: 'dark',
    },
  });

  // 2. Initialize System Settings (Strict User Approval Enabled by Default)
  await prisma.systemSetting.upsert({
    where: { key: 'require_user_approval' },
    update: { value: 'true' },
    create: { key: 'require_user_approval', value: 'true' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'pwa_enabled' },
    update: { value: 'true' },
    create: { key: 'pwa_enabled', value: 'true' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'announcement_enabled' },
    update: { value: 'true' },
    create: { key: 'announcement_enabled', value: 'true' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'announcement_text' },
    update: { value: '🚀 ConnectChat Telegram Edition active! Fast, secure messaging & calls.' },
    create: { key: 'announcement_text', value: '🚀 ConnectChat Telegram Edition active! Fast, secure messaging & calls.' },
  });

  console.log('✅ ConnectChat clean seed completed. Administrator: admin / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
