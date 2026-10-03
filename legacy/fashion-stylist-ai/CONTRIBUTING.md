# 👗 Contributing to Natalia

Welcome! We're thrilled you want to contribute to something legendary.

## Before You Start: The Natalia Test

Every contribution—every line of code, every design, every decision—must pass the **Natalia Test**:

✅ Does this empower the user?
✅ Does this increase confidence?
✅ Does this reduce shame/anxiety?
✅ Is this inclusive?
✅ Is this sustainable?
✅ Is this honest?

If the answer to any is "no" → **Don't submit it.**

---

## Core Values (Read These First)

1. **[NATALIA_LEGACY.md](./NATALIA_LEGACY.md)** — The complete vision
2. **[SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md)** — The AI heart
3. **[README.md](./README.md)** — The overview

You are not just writing code. You are building a movement.

---

## Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/belentani/fashion-stylist-ai.git
cd fashion-stylist-ai
npm install
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use kebab-case. Be descriptive.

### 3. Set Up Environment
```bash
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

---

## Code Standards

### TypeScript First
- Use TypeScript for all new code
- Enable `strict` mode
- Define types explicitly
- No `any` types (use `unknown` if needed)

### Style & Formatting
```bash
npm run format  # Prettier
npm run lint    # ESLint
npm run type-check  # TypeScript
```

### Component Structure
```
component/
├── Component.tsx          # Main component
├── Component.types.ts     # TypeScript types
├── Component.module.css   # Styles (if needed)
├── Component.test.tsx     # Tests
└── index.ts              # Export
```

### Commit Messages
```
feat: Add voice input for outfit suggestions
fix: Resolve issue with wardrobe photo upload
docs: Update API documentation
refactor: Improve recommendation algorithm
style: Format codebase
test: Add tests for voice parsing
```

---

## Git Workflow

### 1. Make Changes
```bash
# Branch is created
git checkout -b feature/voice-assistant-enhancement
```

### 2. Commit Regularly
```bash
git add .
git commit -m "feat: Add pause/resume for voice conversations"
```

### 3. Push
```bash
git push origin feature/voice-assistant-enhancement
```

### 4. Create Pull Request
- Clear title: "feat: Add pause/resume for voice"
- Description: What? Why? How?
- Link any related issues

### 5. Code Review
- Be open to feedback
- Respond to comments
- Make requested changes
- Re-request review

---

## Testing

### Write Tests For:
- API endpoints
- Core business logic
- AI prompt functions
- Utility functions
- Hooks

### Run Tests
```bash
npm test
npm run test:watch
```

### Example Test
```typescript
describe('getOutfitRecommendation', () => {
  it('should return recommendations that boost confidence', async () => {
    const user = { body_type: 'pear', skin_tone: 'warm' };
    const wardrobe = [/* items */];
    
    const recommendations = await getOutfitRecommendation(user, wardrobe);
    
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toHaveProperty('confidence_boost');
  });
});
```

---

## PR Description Template

```markdown
## What?
Brief description of the change

## Why?
What problem does this solve? Why is this important?

## How?
How did you implement it?

## Testing
How did you test this?

## Screenshots (if applicable)
Add before/after screenshots

## Checklist
- [ ] Passes Natalia Test
- [ ] No console errors
- [ ] TypeScript passes
- [ ] Tests pass
- [ ] Formatted with Prettier
- [ ] Updated documentation
- [ ] No breaking changes
```

---

## Natalia-Specific Guidelines

### When Writing AI Prompts
- Use [SYSTEM_PROMPT_GODNESS.md](./SYSTEM_PROMPT_GODNESS.md) as reference
- Test for kindness (would Natalia say this?)
- Test for inclusivity (does this work for all bodies?)
- Test for sustainability (does this encourage reuse?)

### When Building UI
- Test for accessibility (keyboard nav, screen readers)
- Test for dark mode
- Test for mobile responsiveness
- Ensure no body-shaming language
- Use inclusive imagery

### When Implementing Features
- Consider psychological impact
- Avoid comparison/competition
- Focus on empowerment
- Promote sustainability
- Honor privacy

---

## Common Contributions

### 🎨 Design/UI Improvements
1. Create mockup in Figma
2. Share link in issue
3. Get design review
4. Implement with Tailwind
5. Test accessibility

### ✨ Feature Addition
1. Create feature issue
2. Discuss approach in comments
3. Get approval from maintainers
4. Implement
5. Write tests
6. Submit PR

### 🐛 Bug Fix
1. Create bug issue with reproduction steps
2. Fix the bug
3. Add regression test
4. Submit PR

### 📚 Documentation
1. Update relevant `.md` files
2. Use clear examples
3. Link related docs
4. Proofread carefully
5. Submit PR

---

## What We're Looking For

### Great PRs Have:
✅ Clear purpose
✅ Well-tested code
✅ Documentation updates
✅ No breaking changes
✅ Align with Natalia values
✅ Positive energy

### Red Flags:
❌ "Quick fix" without tests
❌ Body-shaming language
❌ Assumes narrow body types
❌ "Just for trendy users"
❌ Privacy concerns unaddressed
❌ Not accessible
❌ Pressures into purchases

---

## Questions?

- **Issues:** Use GitHub issues for questions
- **Discussions:** Start a discussion for ideas
- **Email:** belentani7pedro@gmail.com

---

## Code of Conduct

### We're Committed To:
- Respectful collaboration
- Inclusive environment
- Fair code review
- Diversity of perspectives
- Mental health of contributors

### We Don't Tolerate:
- Harassment or discrimination
- Gatekeeping knowledge
- Toxic behavior
- Exclusion
- Bad faith arguing

---

## The Big Picture

Remember: Every PR, every commit, every line of code is part of something bigger.

We're not just building an app.
We're building a **legacy**.
A legacy that says to every person: **"You deserve to feel beautiful. You deserve to feel confident. You are enough, exactly as you are."**

That's what we're building for.

**Let's make it legendary.** ✨

---

*"The best contributions are the ones made with kindness."* — Natalia's Wisdom
