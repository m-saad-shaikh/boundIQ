# BondIQ — AI-Powered Relationship Chat Analyzer

> Discover the emotional story hidden in your conversations.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key (optional — demo mode works without it)
cp .env.example .env
# Edit .env and add your Gemini API key

# 3. Start development server
npm run dev
```

Visit `http://localhost:5173`

## 🔑 Gemini API Key

Get a **free** Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

Add it to `.env`:
```
VITE_GEMINI_API_KEY=AIza...
```

Or enter it directly in the app's upload screen. Without a key, the app runs in **demo mode** using locally computed statistics.

## ✨ Features

- **Love Score Competition** — Global leaderboard with realtime updates
- **Rank System** — From Soulmates to Needs Work
- **Social Sharing** — Cinematic Instagram-style share cards (PNG)
- **Realtime Dashboard** — Live updates using Supabase subscriptions

## 🏆 Love Score Competition Setup

This feature requires a [Supabase](https://supabase.com) project.

### 1. SQL Schema
Run this in your Supabase SQL Editor to create the leaderboard table:
```sql
create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  partner_name text not null,
  score integer not null,
  rank text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime
alter publication supabase_realtime add table leaderboard;

-- Security Policies
alter table leaderboard enable row level security;
create policy "Anyone can view" on leaderboard for select using (true);
create policy "Anyone can join" on leaderboard for insert with check (true);
```

### 2. Environment Variables
Add these to your `.env` or Vercel dashboard:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📱 Supported Chat Formats

- WhatsApp (exported .txt)
- Telegram (text export)
- Plain text (Name: message)
- Auto-detection for unknown formats

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 + Vite | Framework |
| Tailwind CSS v3 | Styling |
| Framer Motion | Animations |
| Supabase | Realtime Leaderboard |
| html2canvas | PNG Share Cards |
| Gemini 1.5 Flash | AI analysis |

## 🏗 Project Structure

```
src/
├── components/
│   ├── analysis/     # All chart and insight components
│   ├── common/       # Toast, ErrorBoundary, etc.
│   └── ui/           # Reusable primitives
├── hooks/
│   ├── useAnalysis.js   
│   └── useHearts.js     # Particle effects
├── pages/
│   ├── LandingPage.jsx
│   ├── UploadPage.jsx
│   └── ResultsPage.jsx
└── utils/
    ├── chatParser.js     
    ├── localAnalysis.js  
    ├── geminiClient.js   
    └── supabaseClient.js # Leaderboard integration
```

## 🔒 Privacy

- **No data storage** — Chats are analyzed locally and never sent to any server (except the Gemini API if you provide a key)
- **No login required**
- **No tracking**

npm run build

# Deploy to Vercel
npx vercel --prod

# Or Netlify
npx netlify deploy --prod --dir=dist
```

---

Made with ❤️ for emotional intelligence
