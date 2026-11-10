# 💬 ConnectChat — Universal Progressive Web App (PWA) Messenger

> **One Application. One Codebase. All Devices.**  
> A production-ready, universal real-time chat application engineered to deliver native app performance across Android smartphones, iPhones, iPads, Android tablets, Windows PCs, macOS, and Linux computers.

---

## 🌟 Key Highlights

- **Universal Responsive Design**:
  - **Desktop (≥ 1024px)**: 3-panel professional messenger interface (Conversations, Chat Window, Contact & Shared Media Panel).
  - **Tablet (768px – 1023px)**: Adaptive 2-panel interface with slide-over drawers and touch-optimized layout.
  - **Mobile (< 768px)**: Native app-like single view stack, bottom navigation, full-screen conversation view, safe-area-inset padding for notches and dynamic keyboard avoidance (`100dvh`).
- **Progressive Web App (PWA)**:
  - Standalone display mode with custom app icons (192px, 512px, maskable, SVG).
  - Production Service Worker (`/sw.js`) with cache-first static asset caching, network-first API strategy, and instant safe-update mechanism.
  - Interactive Offline Fallback page (`/offline.html`) with connection state detection and retry actions.
  - Custom In-App Install Banners: One-click install prompt for Chromium/Android/Desktop browsers, plus visual 2-step "Add to Home Screen" walkthrough for iOS Safari.
- **Real-Time Communication**:
  - Powered by **Socket.IO** running alongside Next.js on a unified Node.js server.
  - Real-time message delivery with sub-10ms latency.
  - Live typing indicators ("X is typing...").
  - Read receipts: single check (sent), double check (delivered), blue double check (read).
  - Online/offline presence indicators and dynamic "last seen" timestamps.
  - Emoji reactions with live count pills and reaction picker.
- **Rich Messaging Capabilities**:
  - **Voice Notes**: Built-in audio recorder with MediaRecorder & Web Audio API, animated soundwave visualizer, timer, and playback progress bar.
  - **Media & Document Sharing**: Photo lightbox viewer, embedded HTML5 video playback, document downloads with size counters.
  - **Quoted Replies**: Clickable preview that scrolls directly to the parent message.
  - **Message Editing & Deletion**: Inline edit with `(edited)` indicator, soft-delete with "This message was deleted" placeholder.
  - **Search**: In-chat message search with hit highlighting (`Ctrl+K`) and conversation list filter.
- **Privacy & Customization**:
  - Dark, Light, and System Theme modes with live meta `theme-color` synchronization.
  - Privacy toggles for "Show Online Status" and "Read Receipts".
  - Synthesized Web Audio notification chimes (zero audio file download lag).
  - 1-Click Demo Persona switcher for instantaneous multi-user testing.

---

## 📐 Tested Breakpoints & Form Factors

| Device Type | Viewport Width | Layout Mode | Navigation Pattern |
| :--- | :--- | :--- | :--- |
| **Mobile Mini** | `360px` | 1-Panel Mobile | Separate list & chat views, bottom navigation |
| **iPhone Standard** | `390px` | 1-Panel Mobile | Full-screen composer, safe-area notch padding |
| **iPhone Pro Max** | `430px` | 1-Panel Mobile | High-density touch targets, smooth transitions |
| **iPad Portrait** | `768px` | 2-Panel Adaptive | Fixed sidebar (320px) + Chat area + Slide-over drawer |
| **iPad Landscape** | `1024px` | 3-Panel Desktop | Sidebar + Chat Area + Collapsible Right Panel |
| **Laptop** | `1366px` | 3-Panel Desktop | Multi-column layout, drag-and-drop file upload |
| **Desktop Monitor** | `1920px` | 3-Panel Desktop | Keyboard shortcuts (`Enter`, `Shift+Enter`, `Ctrl+K`) |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js HTTP Server, Next.js App Router, Socket.IO Server.
- **Database & ORM**: Prisma ORM with SQLite (zero-config local default) and full PostgreSQL compatibility.
- **Authentication**: JWT, bcrypt password hashing, HTTP-only cookies, Zod validation.
- **Audio & Media**: Web Audio API synthesizer, MediaRecorder API, HTML5 Canvas PWA icons.

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/live491223/connectchat.git

# Enter project directory
cd connectchat

# Install dependencies
npm install
```

### 2. Database Setup

```bash
# Generate Prisma Client & Push Database Schema
npx prisma generate
npx prisma db push

# Seed Demo Personas & Pre-populated Chat History
node prisma/seed.js
```

### 3. Run the Development Server

```bash
npm run dev
# Or start custom server directly
node server.js
```

Open your browser at **`http://localhost:3000`**.

---

## 👥 Seeded Demo Accounts (Password: `password123`)

You can instantly sign in using the **1-Click Demo** buttons on `/login` or enter credentials manually:

| Name | Username | Email | Role |
| :--- | :--- | :--- | :--- |
| **Sarah Connor** | `sarah` | `sarah@connectchat.io` | Tech Lead & AI Architect |
| **Alex Morgan** | `alex` | `alex@connectchat.io` | Senior Product Designer |
| **Elena Rostova** | `elena` | `elena@connectchat.io` | PWA & Offline Specialist |
| **David Chen** | `david` | `david@connectchat.io` | Full Stack Cloud Engineer |

> **Pro Tip**: Open one browser window (or device) as **Sarah** and another window in Incognito as **Alex** to see instant 2-way real-time messaging, typing indicators, read receipts, and reactions!

---

## 📱 PWA Installation Instructions

### Android (Chrome / Edge)
1. Open `http://<your-ip>:3000` on Android Chrome.
2. Tap the bottom banner **"Install App"** or select **"Add to Home screen"** from the 3-dot menu.
3. The app installs to your app drawer and launches in standalone fullscreen mode without browser chrome.

### iPhone & iPad (Safari)
1. Open the URL in Safari.
2. Tap the **Share** button in the Safari navigation bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. ConnectChat will appear on your Home Screen as an app icon with standalone display mode.

### Windows / macOS / Linux (Desktop Chrome / Edge / Brave)
1. Look for the install icon (computer with down arrow) in the browser address bar, or click **"Install App"** on the custom prompt.
2. The app installs as a native desktop window with its own taskbar/dock icon and window controls.

---

## 🗄 Switching to PostgreSQL in Production

ConnectChat includes zero-config SQLite out of the box for immediate development. To switch to PostgreSQL:

1. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/connectchat?schema=public"
   ```
2. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```

---

## 🧪 Testing

Run the included automated test suites:

```bash
# Run API, PWA, Authentication & Socket.IO test suite
node tests/test-suite.js

# Run responsive layout and breakpoint verification
node tests/viewport-test.js
```

---

## 📜 License

MIT License — ConnectChat Universal Messenger.
