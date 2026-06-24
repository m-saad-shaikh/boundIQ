# AI-Powered Relationship Chat Analyzer — V1 MVP Implementation Plan

## Overview

Build a **futuristic, cinematic, dark-mode-first** web application that analyzes one-to-one personal chats using a hybrid local + Gemini AI approach. The experience should feel like Spotify Wrapped meets Apple Health in an emotional intelligence context.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| Charts | Recharts |
| AI | Google Gemini 1.5 Flash (free tier) |
| Icons | Lucide React |
| Hosting | Vercel / Netlify |

---

## Proposed Project Structure

```
ai-relationship-analyzer/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeatureCards.jsx
│   │   │   └── PrivacyBanner.jsx
│   │   ├── upload/
│   │   │   ├── UploadZone.jsx          # Drag & drop + paste + file upload
│   │   │   └── ChatFormatSelector.jsx
│   │   ├── analysis/
│   │   │   ├── LoadingScreen.jsx       # Cinematic AI loading animation
│   │   │   ├── RelationshipScore.jsx   # Animated score meter
│   │   │   ├── RelationshipStatus.jsx  # Status card with icon
│   │   │   ├── EmotionTimeline.jsx     # Month-by-month emotion chart
│   │   │   ├── SentimentGraph.jsx      # Sentiment over time
│   │   │   ├── CommunicationBalance.jsx # Who texts more pie/bar chart
│   │   │   ├── ActivityHeatmap.jsx     # Active hours visualization
│   │   │   ├── AIInsights.jsx          # Gemini-generated insights
│   │   │   └── Recommendations.jsx     # Actionable AI recommendations
│   │   └── ui/
│   │       ├── GlassCard.jsx
│   │       ├── NeonBadge.jsx
│   │       ├── AnimatedCounter.jsx
│   │       └── ParticleBackground.jsx
│   ├── utils/
│   │   ├── chatParser.js               # Parse WhatsApp/Telegram/etc formats
│   │   ├── localAnalysis.js            # Fast local stats computation
│   │   └── geminiClient.js             # Gemini API integration
│   ├── hooks/
│   │   └── useAnalysis.js              # Orchestrates local + AI analysis
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── UploadPage.jsx
│   │   └── ResultsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                       # Tailwind + custom CSS variables
├── .env.example
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## Component Details

### Landing Page
- Full-screen hero with particle background and animated headline
- Feature cards with glassmorphism effect
- Privacy badges (no data stored, secure, private)
- Animated CTA button to start analysis

### Upload System
- Textarea paste input with live character count
- Drag & drop zone with animated border
- `.txt` file upload button
- Platform selector (WhatsApp, Instagram, Snapchat, Telegram, Messenger, Plain text)
- Auto-detect format when possible

### AI Loading Screen
- Cinematic full-screen loading with animated progress
- Stage messages: "Parsing chat...", "Running emotional analysis...", "Consulting AI..."
- Pulsing neural network animation

### Results Dashboard
1. **Relationship Score** — Animated circular progress meter (0–100%) with color glow
2. **Relationship Status** — Large status card (Soul Connected / Growing Bond / etc.)
3. **Emotion Timeline** — Area chart by month with warm/cold color zones
4. **Sentiment Graph** — Line chart tracking positive/neutral/negative over time
5. **Communication Balance** — Donut chart: who sends more, who replies faster
6. **Activity Heatmap** — Hour/day grid showing chat frequency
7. **AI Insights** — Gemini-generated emotional storytelling cards
8. **Stats Row** — Total messages, words, emojis, avg reply time, most active hour
9. **Recommendations** — Animated recommendation cards from Gemini

---

## Hybrid Analysis Architecture

### Phase 1 — Local Analysis (instant)
```
chatParser.js → parse raw text into structured messages[]
localAnalysis.js:
  - messageCount per person
  - wordCount per person
  - emojiCount per person
  - avgReplyDelay per person
  - whoTextsFirstMore
  - lateNightMessages (11pm-3am)
  - activeHourDistribution
  - consistencyScore
  - dryTextingScore (short replies ratio)
  - emotionalWordFrequency (local word list)
  - monthlyActivityMap
```

### Phase 2 — Gemini AI Analysis (async)
```
geminiClient.js sends:
  - Condensed chat sample (last ~200 messages)
  - Local stats summary
  
Receives structured JSON:
  {
    relationshipScore: 82,
    relationshipStatus: "Soul Connected",
    emotionalProfile: {...},
    communicationInsights: [...],
    emotionTimeline: [...],
    recommendations: [...],
    aiStory: "..."
  }
```

---

## Gemini Prompt Strategy

The prompt will:
1. Send a condensed representative sample of the chat
2. Include pre-computed local stats for grounding
3. Ask for structured JSON output
4. Request empathetic, non-toxic language
5. Cap at ~4000 tokens input to stay within free tier limits

---

## Design System

```css
/* Color Tokens */
--bg-primary: #050510          /* Deep space black */
--bg-secondary: #0d0d2b        /* Dark navy */
--accent-pink: #ff2d78         /* Neon rose */
--accent-purple: #8b5cf6       /* Violet glow */
--accent-cyan: #06b6d4         /* Electric cyan */
--accent-gold: #f59e0b         /* Warm gold */
--glass-bg: rgba(255,255,255,0.05)
--glass-border: rgba(255,255,255,0.1)
```

**Fonts**: Inter (body) + Outfit (headings) from Google Fonts

---

## Key Animations

| Element | Animation |
|---------|-----------|
| Hero text | Fade-in + slide up stagger |
| Upload zone | Pulsing border glow on drag |
| Loading screen | Rotating particles + progress bar |
| Score meter | Count-up + circular fill |
| Charts | Slide-in reveals with 0.3s stagger |
| Cards | Scale + fade on scroll enter |
| Hover states | Subtle lift + glow intensify |

---

## Open Questions

> [!IMPORTANT]
> **Gemini API Key**: The app needs a Gemini API key. It will be read from `.env` as `VITE_GEMINI_API_KEY`. The user needs to provide this. I'll add a UI field in the app for users to enter their own key if env var is not set.

> [!NOTE]
> **Chat Sample Size**: For Gemini analysis, I'll send max ~150 messages (or ~3000 words) to stay within free-tier token limits. The local analysis runs on the full chat.

> [!NOTE]
> **Chat Format Detection**: I'll support WhatsApp export format (`[date, time] Name: message`) and Telegram export as the primary formats. Instagram/Snapchat/Messenger will use a generic line-by-line plain text approach.

---

## Verification Plan

### Automated
- Vite dev build starts without errors
- All components render without console errors

### Manual
- Upload a sample WhatsApp chat export and verify full analysis flow
- Test drag & drop on desktop
- Test responsive layout on mobile viewport (375px)
- Verify Gemini API call returns valid JSON and populates results
- Test all chart renders with sample data
