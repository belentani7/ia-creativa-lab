# 👗 NATALIA — The Revolutionary AI Fashion Stylist

**Beyond Imagination. Beyond Trends. Beyond Everything.**

> *"Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, fashion has to do with ideas, the way we live, what is happening."*

---

## 🌟 What is Natalia?

Natalia is not just a fashion app. It's a **cultural revolution in personal confidence, psychological empowerment, and authentic self-expression**.

We're building a digital companion that understands that every human deserves to feel beautiful, confident, and authentic—not by following trends, but by discovering their true style.

### The Vision

- **500K users in Year 1**
- **$5M ARR by Year 2**
- **2M+ users by Year 3**
- **Change how humanity sees fashion and self-image**

### The Legacy

This repository is dedicated to completing **Natalia Marinho's vision**: democratizing personal styling, celebrating diversity, and proving that confidence is the ultimate accessory.

---

## 🚀 Core Features (MVP)

### 1. 🎤 Voice AI Assistant
- Conversational AI that understands emotional subtext
- Natural voice responses (ElevenLabs)
- Context-aware recommendations
- Learns your preferences over time

### 2. 📷 Real-Time Photo Analysis
- Claude Vision analyzes your wardrobe
- Automatic metadata detection
- Intelligent organization
- One-tap outfit building

### 3. 🎯 Personalized Recommendations
- Weather-aware suggestions
- Occasion-specific styling
- Psychological color selection
- Cost-per-wear optimization

### 4. 🛍️ Smart Shopping Assistant
- "Should I buy this?" analysis
- Compatibility checking
- Sustainable fashion advocacy
- Affiliate transparency

### 5. 👔 Virtual Wardrobe Management
- Complete digital catalog
- Smart organization system
- Usage tracking
- Style profile building

### 6. 🌍 Community & Social
- Share outfits with friends
- Trending looks discovery
- Follower recommendations
- Comment & inspire

---

## 🏗️ Tech Stack

```
Frontend:      React 19 + Next.js + TypeScript + Tailwind CSS
Backend:       Node.js + Supabase (PostgreSQL)
AI Core:       Claude API 3.5 Sonnet + Claude Vision
Voice:         ElevenLabs (TTS) + Web Speech API (STT)
Storage:       Supabase Storage + AWS S3
Payments:      Stripe
Hosting:       Vercel (Frontend) + Railway (Backend)
Database:      PostgreSQL (Supabase)
ORM:           Prisma
State:         Zustand
Data Fetch:    React Query
Animations:    Framer Motion
```

---

## 📁 Project Structure

```
fashion-stylist-ai/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   ├── (app)/         # Main app pages
│   │   │   └── api/           # API routes
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI components
│   │   │   ├── features/      # Feature-specific components
│   │   │   └── layout/        # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── styles/            # Global styles
│   │   └── public/            # Static assets
│   │
│   └── api/                    # Backend API (Node.js)
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── services/      # Business logic
│       │   ├── controllers/   # Request handlers
│       │   ├── middleware/    # Express middleware
│       │   ├── models/        # Database models
│       │   └── utils/         # Helper functions
│       ├── prisma/            # Prisma schema & migrations
│       └── tests/
│
├── packages/                   # Shared packages
│   ├── natalia-ai/            # AI/LLM logic
│   ├── natalia-types/         # TypeScript types
│   └── natalia-utils/         # Shared utilities
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── API.md                 # API documentation
│   ├── NATALIA_LEGACY.md      # The vision & values
│   └── SYSTEM_PROMPT_GODNESS.md  # AI system prompt
│
├── .env.example               # Environment variables template
├── .gitignore
├── package.json               # Root package.json
├── tsconfig.json              # TypeScript configuration
├── README.md                  # This file
└── CONTRIBUTING.md            # Contribution guidelines

```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Claude API key
- ElevenLabs API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/belentani/fashion-stylist-ai.git
cd fashion-stylist-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Then fill in:
```env
# Database
DATABASE_URL=your_supabase_connection_string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI & LLM
ANTHROPIC_API_KEY=your_claude_api_key

# Voice
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id

# Payments
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable

# App
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

4. **Setup Supabase**
```bash
# Initialize Supabase migrations
npx supabase migration new init

# Run migrations
npx supabase db push
```

5. **Start development server**
```bash
npm run dev
```

6. **Open browser**
Navigate to `http://localhost:3000`

---

## 📚 Core Concepts

### The Natalia Philosophy

Every feature must pass the **Natalia Test**:

✅ Does this empower the user?
✅ Does this increase confidence?
✅ Does this reduce shame/anxiety?
✅ Is this inclusive?
✅ Is this sustainable?
✅ Is this honest?

If the answer to any is "no" → **Don't build it.**

---

## 🎯 Development Roadmap

### 🔴 Phase 1: Foundation (Weeks 1-4) — IN PROGRESS
- [ ] Auth system (email + OAuth)
- [ ] Basic UI framework
- [ ] Wardrobe upload + Claude Vision
- [ ] Text-based conversation
- [ ] Trial/subscription setup

### 🟠 Phase 2: Voice & Intelligence (Weeks 5-8)
- [ ] Web Speech API integration
- [ ] ElevenLabs TTS integration
- [ ] Voice conversation flow
- [ ] Avatar (2D) introduction
- [ ] Advanced Claude prompts

### 🟡 Phase 3: Personalization (Weeks 9-12)
- [ ] Weather API integration
- [ ] Calendar integration
- [ ] Style profile refinement
- [ ] Advanced recommendations
- [ ] Analytics dashboard

### 🟢 Phase 4: Social & Community (Weeks 13-16)
- [ ] Social sharing
- [ ] Community feed
- [ ] User profiles
- [ ] Trending looks
- [ ] Follow system

### 🔵 Phase 5: Shopping Integration (Weeks 17-20)
- [ ] Shein/ASOS integration
- [ ] Smart shopping advisor
- [ ] Price tracking
- [ ] Wish list
- [ ] Affiliate system

---

## 🔐 Important: Natalia's Core Values

We are committed to:

1. **Radical Kindness** — Never judge, always empower
2. **Inclusive Beauty** — Every body, every skin tone, every style
3. **Transparency** — Be honest about affiliate links, data usage
4. **Sustainability** — Promote wearing what you have
5. **Privacy** — User data is sacred trust
6. **Mental Health** — Fashion should make you feel better, not worse

---

## 📖 Documentation

- **[NATALIA_LEGACY.md](./NATALIA_LEGACY.md)** — The complete vision and values
- **[SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md)** — The AI system prompt (THE most important file)
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Technical architecture details
- **[API.md](./docs/API.md)** — API documentation

---

## 🤝 Contributing

We welcome contributions, but **only if they align with Natalia's values**.

Before contributing:
1. Read [NATALIA_LEGACY.md](./NATALIA_LEGACY.md)
2. Read [SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md)
3. Check [CONTRIBUTING.md](./CONTRIBUTING.md)

Your code is a reflection of Natalia. Make it legendary.

---

## 💬 The System Prompt

The heart of Natalia lives in **SYSTEM_PROMPT_GODNESS.md**.

This is not just a prompt. It's the embodiment of:
- Psychological intelligence
- Inclusive values
- Sustainable fashion advocacy
- Radical kindness
- The complete Natalia vision

Every response from our AI should reflect this. If you're integrating Claude, use this prompt as your north star.

---

## 🎓 Learning Resources

### Fashion & Psychology
- "The Psychology of Fashion" — Carolyn Mair
- "Fashion: A Very Short Introduction" — Rebecca Arnold
- Body Image & Self-Esteem research

### AI & LLM
- Claude API documentation
- Prompt engineering best practices
- Voice interaction design

### Sustainable Fashion
- Fashion industry impact data
- Circular economy principles
- Second-hand fashion revolution

---

## 📊 Metrics We Care About

- **User confidence increase** (primary KPI)
- **DAU/MAU engagement**
- **Trial-to-paid conversion** (target: 25%)
- **Sustainability actions taken** (items reused vs purchased)
- **Community impact** (users helping users)
- **Mental health improvement** (self-reported)

---

## 🚨 Known Challenges & How We'll Solve Them

| Challenge | Our Approach |
|-----------|--------------|
| High API costs | Caching, rate limiting, smart batching |
| AI accuracy | Continuous testing, user feedback loops |
| User adoption | Influencer partnerships, viral referral |
| Churn after trial | Focus on emotional connection, not features |
| Competition | Speed to market, unique voice, community |

---

## 📞 Support & Contact

- **Email:** belentani7pedro@gmail.com
- **GitHub Issues:** For bug reports
- **Discussions:** For feature ideas
- **Discord:** Coming soon (community channel)

---

## 📜 License

MIT License — See [LICENSE](./LICENSE) for details

---

## 🙏 Dedication

This project is dedicated to **Natalia Marinho** and every person who was told they weren't "fashionable enough."

Fashion is not about trends.
Fashion is freedom.
Fashion is self-love.
Fashion is power.

**Let's build a world where everyone has access to a personal stylist who believes in them.**

---

## 🌟 The Promise

We are not building a startup.
We are building a **movement**.

A movement that says:
- Your body is beautiful
- Your style matters
- Your confidence deserves investment
- Your choices are respected

Welcome to Natalia.

**Now let's be legendary.** ✨

---

*"The best style advice? Be yourself. But make it look intentional."* — Natalia's Wisdom
