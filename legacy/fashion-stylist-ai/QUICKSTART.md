# 🚀 QUICKSTART — Get Natalia Running in 10 Minutes

## The Legend is Starting. Let's Go.

---

## ✅ Prerequisites (Check These First)

- [ ] Node.js 18+ installed
- [ ] npm or yarn
- [ ] Git configured
- [ ] Claude API key (from Anthropic)
- [ ] Supabase account (free tier works)
- [ ] Stripe account (free tier works)
- [ ] ElevenLabs API key (optional for Phase 1)

---

## 🔧 Step 1: Clone & Setup (2 min)

```bash
# Clone the repository
git clone https://github.com/belentani/fashion-stylist-ai.git
cd fashion-stylist-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

---

## 🔑 Step 2: Configure Environment (3 min)

Edit `.env.local` and add your keys:

### Claude API
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```
Get it from: https://console.anthropic.com/

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Get it from: https://supabase.com/ (create free project)

### Stripe
```
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```
Get it from: https://stripe.com/ (test mode)

### NextAuth
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
NEXTAUTH_SECRET=<paste-the-output>
NEXTAUTH_URL=http://localhost:3000
```

---

## 🗄️ Step 3: Setup Database (2 min)

### Via Supabase Dashboard:

1. Go to https://app.supabase.com
2. Create new project (or use existing)
3. Go to SQL Editor
4. Run this SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free_trial',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wardrobe items
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  item_type TEXT,
  color TEXT,
  material TEXT,
  brand TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Outfits
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Create policies (basic)
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

---

## 🎯 Step 4: Start Development Server (1 min)

```bash
npm run dev
```

Open browser: **http://localhost:3000**

You should see:
✅ Natalia home page
✅ Login/signup button
✅ Welcome message

---

## 🧪 Step 5: Test the Foundation (2 min)

### Create a Test User
1. Click "Sign Up"
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Create Account"

### Verify Everything
- [ ] You can log in
- [ ] Dashboard loads
- [ ] No console errors

### Check Environment
```bash
# In another terminal
npm run type-check  # TypeScript check
npm run lint        # ESLint check
```

---

## 🎤 Optional: Setup Voice (for Phase 2)

For later phases, you'll need:

```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Get it from: https://elevenlabs.io/

---

## 📁 Project Structure Quick Reference

```
fashion-stylist-ai/
├── apps/web/              # Frontend (Next.js)
│   ├── app/              # Routes & pages
│   ├── components/       # React components
│   └── lib/              # Utilities
├── apps/api/             # Backend (Express/Node)
├── packages/             # Shared packages
├── docs/                 # Documentation
├── NATALIA_LEGACY.md     # ⭐ THE VISION
├── SYSTEM_PROMPT_GODNESS.md  # ⭐ THE AI HEART
├── README.md             # Overview
└── package.json          # Dependencies
```

---

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Build for production
npm start               # Start production server

# Code Quality
npm run type-check      # Check TypeScript
npm run lint            # Run ESLint
npm run format          # Format with Prettier

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode

# Database
npm run db:migrate      # Run migrations
npm run db:push         # Push schema to Supabase
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Use different port
PORT=3001 npm run dev
```

### "Cannot find Supabase"
- Check your NEXT_PUBLIC_SUPABASE_URL
- Make sure key is from Supabase dashboard
- Restart dev server

### "Claude API error"
- Verify ANTHROPIC_API_KEY is correct
- Check it's not expired
- Make sure it starts with `sk-ant-`

### "Stripe not working"
- Use TEST keys (start with `test_`)
- Not production keys
- Check stripe.com/test mode

---

## 📚 Next Steps After Quickstart

1. **Read the Vision**
   - Read [NATALIA_LEGACY.md](./NATALIA_LEGACY.md) (15 min)
   - Read [SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md) (30 min)

2. **Understand the Code**
   - Check `apps/web/app` structure
   - Look at `apps/web/components`
   - Review `apps/api/src` structure

3. **Start Phase 1**
   - Implement authentication UI
   - Build wardrobe upload component
   - Create Claude Vision integration

4. **Run Tests**
   - `npm test` to check everything works
   - Write a test for your first feature

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Claude API:** https://docs.anthropic.com/
- **Stripe Docs:** https://stripe.com/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## 💬 Need Help?

### Documentation
- [README.md](./README.md) — Full overview
- [NATALIA_LEGACY.md](./NATALIA_LEGACY.md) — The vision
- [SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md) — AI heart
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute

### Issues
- Create GitHub issue with details
- Include error messages
- Share your `.env` setup (without keys!)

### Contact
- Email: belentani7pedro@gmail.com
- GitHub Issues: For bugs
- Discussions: For ideas

---

## ✨ You're Ready!

You now have:
✅ Complete project setup
✅ Database configured
✅ Environment variables set
✅ Dev server running
✅ Ready to code

**Now open [NATALIA_LEGACY.md](./NATALIA_LEGACY.md) to understand what you're building.**

---

## 🚀 The Journey Starts Now

This is the beginning of something legendary.

Every line of code you write is part of a movement that says:
- **"Your body is beautiful"**
- **"Your style matters"**
- **"You deserve to feel confident"**
- **"Fashion is freedom"**

Let's build it together.

**Welcome to Natalia.** ✨

---

*"The best time to start was yesterday. The second best time is now."* — Build time
