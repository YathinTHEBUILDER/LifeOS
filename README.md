# LifeOS — Personal Planner & Time Operating System

> A calm, fast, unified personal productivity operating system combining Calendar, Tasks, Time Blocking, Projects, Habits, Notes, Focus Sessions, Daily Planning, and PWA Support.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**.

---

## ✨ Key Features

- 🌅 **Today Command Center**: Live time scrubber, Happening Now & Up Next focal cards, Daily Intention banner.
- 🤖 **Intelligent Daily Planner**: "Plan My Day" auto-allocator and "Replan My Day" lost-time schedule adjuster.
- 🗓️ **Interactive Calendar**: Day, 3-Day, Week, Month, and Agenda views with direct 1-click Task-to-Time-Block conversion.
- 📋 **Task Master**: Priority levels (Urgent 🔥, High, Medium, Low), duration estimation, subtasks, project tagging.
- 📁 **Projects Hub**: Visual progress calculation, deadlines, and project task aggregations.
- ⚡ **Habit Tracker**: 7-day completion matrix with streak tracking and frequency goals.
- ⏱️ **Focus Mode**: Distraction-free Pomodoro timer (25m / 50m / 90m / Custom) with linked task tracking.
- 📝 **Lightweight Notes**: Fast markdown notes with pin-to-top support.
- 📊 **Daily Review**: Evening retrospective, metrics summary, and 1-click task rollover to tomorrow.
- 📱 **Installable PWA**: Responsive dual-tier desktop & mobile design with service worker offline shell caching.
- ⌘ **Command Palette**: Fast global `Cmd/Ctrl + K` search across all tasks, events, notes, and projects.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with Row-Level Security)
- **PWA**: Web App Manifest & Service Worker

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YathinTHEBUILDER/LifeOS.git
cd LifeOS
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup
Run the SQL migration in `supabase/schema.sql` inside your Supabase SQL Editor.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Environment Variables.
4. Deploy!
