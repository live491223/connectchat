const http = require('http');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

async function fetchJSON(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, headers: res.headers, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, headers: res.headers, text };
  }
}

async function runTests() {
  console.log('🧪 Starting ConnectChat Full Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. PWA Tests
  console.log('--- 1. Testing PWA Assets ---');
  const manifest = await fetchJSON('/manifest.json');
  assert(manifest.ok && manifest.data.name === 'ConnectChat - Universal Messenger', 'manifest.json is valid');
  assert(manifest.data.display === 'standalone', 'PWA display mode is standalone');
  assert(manifest.data.icons.length >= 4, 'Manifest includes icons for all devices');

  const sw = await fetchJSON('/sw.js');
  assert(sw.ok && sw.text.includes('connectchat-cache'), 'sw.js Service Worker is served');

  const offline = await fetchJSON('/offline.html');
  assert(offline.ok && offline.text.includes('No Internet Connection'), 'offline.html is served');

  const iconSvg = await fetchJSON('/icons/icon.svg');
  assert(iconSvg.ok && iconSvg.text.includes('<svg'), 'PWA SVG icon is valid');

  const icon192 = await fetchJSON('/icons/icon-192.png');
  assert(icon192.ok, 'PWA 192x192 icon is served');

  // 2. Authentication Tests
  console.log('\n--- 2. Testing Authentication ---');
  // Demo Login as Sarah
  const demoLogin = await fetchJSON('/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sarah' }),
  });
  assert(demoLogin.ok && demoLogin.data.user.username === 'sarah', 'Demo 1-Click login as Sarah Connor');
  const token = demoLogin.data.token;
  const cookieHeader = `connectchat_token=${token}`;

  // Check /api/auth/me
  const me = await fetchJSON('/api/auth/me', {
    headers: { Cookie: cookieHeader },
  });
  assert(me.ok && me.data.user.email === 'sarah@connectchat.io', '/api/auth/me returns authenticated user');

  // Register New User
  const newUsername = `user_${Date.now()}`;
  const registerRes = await fetchJSON('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Candidate',
      username: newUsername,
      email: `${newUsername}@test.com`,
      password: 'password123',
    }),
  });
  assert(registerRes.ok && registerRes.data.user.username === newUsername, 'User registration works');

  // Standard Login
  const stdLogin = await fetchJSON('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'alex',
      password: 'password123',
    }),
  });
  assert(stdLogin.ok && stdLogin.data.user.username === 'alex', 'Standard credentials login as Alex');

  // 3. Conversation & Messaging Tests
  console.log('\n--- 3. Testing Conversations & Messaging ---');
  const convList = await fetchJSON('/api/conversations', {
    headers: { Cookie: cookieHeader },
  });
  assert(convList.ok && convList.data.conversations.length > 0, `Fetched ${convList.data.conversations?.length} conversations for Sarah`);

  const activeConv = convList.data.conversations[0];
  const convDetails = await fetchJSON(`/api/conversations/${activeConv.id}`, {
    headers: { Cookie: cookieHeader },
  });
  assert(convDetails.ok && convDetails.data.messages.length > 0, `Fetched ${convDetails.data.messages?.length} messages in conversation`);

  // Send Message
  const sendRes = await fetchJSON(`/api/conversations/${activeConv.id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      content: 'Automated test message at ' + new Date().toISOString(),
      type: 'TEXT',
    }),
  });
  assert(sendRes.ok && sendRes.data.message.content.includes('Automated test message'), 'Sent new message via API');
  const createdMsg = sendRes.data.message;

  // Edit Message
  const editRes = await fetchJSON(`/api/messages/${createdMsg.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      content: 'Edited test message content',
    }),
  });
  assert(editRes.ok && editRes.data.message.isEdited === true, 'Edited message successfully');

  // Toggle Reaction
  const reactRes = await fetchJSON(`/api/messages/${createdMsg.id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ emoji: '🔥' }),
  });
  assert(reactRes.ok && reactRes.data.reactions.some((r) => r.emoji === '🔥'), 'Toggled emoji reaction');

  // Delete Message (Soft delete)
  const deleteRes = await fetchJSON(`/api/messages/${createdMsg.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  });
  assert(deleteRes.ok && deleteRes.data.message.isDeleted === true, 'Soft-deleted message successfully');

  // 4. Real-time Socket.IO Communication Test
  console.log('\n--- 4. Testing Real-time Socket.IO Connection ---');
  await new Promise((resolve) => {
    const socket = io(BASE_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      assert(true, 'Socket.IO connected successfully via WebSocket');
      socket.emit('authenticate', { userId: me.data.user.id });

      socket.emit('typing_start', {
        conversationId: activeConv.id,
        userId: me.data.user.id,
        userName: me.data.user.name,
      });

      setTimeout(() => {
        socket.disconnect();
        assert(true, 'Socket.IO authenticate & typing events dispatched');
        resolve();
      }, 500);
    });

    socket.on('connect_error', (err) => {
      assert(false, `Socket connect error: ${err.message}`);
      resolve();
    });
  });

  // Summary
  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Test suite error:', e);
  process.exit(1);
});
