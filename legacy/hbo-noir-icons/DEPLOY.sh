#!/bin/bash
set -e

# 🚀 MEGA DEPLOY SCRIPT
# Usage: bash DEPLOY.sh [repo-name] [github-username] [vercel-token]
# Example: bash DEPLOY.sh hbo-noir-icons belentani7 vercel_token_here

REPO_NAME="${1:-hbo-noir-icons}"
GITHUB_USER="${2:-belentani7}"
VERCEL_TOKEN="${3:-}"

echo "╔════════════════════════════════════════╗"
echo "║  🚀 AUTO-DEPLOY VITE + VERCEL + GITHUB ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() {
  echo -e "${BLUE}→${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# 1. Git Setup
log_step "1️⃣  Configuring Git..."
git config user.email "belentani7pedro@gmail.com" || git config --global user.email "belentani7pedro@gmail.com"
git config user.name "belentani7" || git config --global user.name "belentani7"
git init 2>/dev/null || true
log_success "Git configured"

# 2. Create .gitignore
log_step "2️⃣  Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.vscode/
.idea/
*.swp
Thumbs.db
phalanx_shield.py
phalanx_report.json
.noiacore_manifest.json
EOF
log_success ".gitignore created"

# 3. Create .env.example
log_step "3️⃣  Creating .env.example..."
cat > .env.example << 'EOF'
VITE_API_URL=https://api.example.com
NODE_ENV=production
EOF
log_success ".env.example created"

# 4. Create .vercelignore
log_step "4️⃣  Creating .vercelignore..."
cat > .vercelignore << 'EOF'
*.py
phalanx_*
.noiacore_manifest.json
*.log
.git
EOF
log_success ".vercelignore created"

# 5. Create GitHub Actions workflow
log_step "5️⃣  Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
EOF
log_success "GitHub Actions created"

# 6. Add remote
log_step "6️⃣  Adding GitHub remote..."
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "${REPO_URL}"
log_success "Remote: ${REPO_URL}"

# 7. Ensure main branch
log_step "7️⃣  Switching to main branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")
if [ "$CURRENT_BRANCH" != "main" ]; then
  git branch -M main 2>/dev/null || true
fi
log_success "On main branch"

# 8. Initial commit
log_step "8️⃣  Creating initial commit..."
git add -A
if git diff --cached --quiet; then
  log_success "No changes to commit"
else
  git commit -m "🚀 Init: Optimized Vite setup with Vercel & GitHub Actions"
  log_success "Committed"
fi

# 9. Create GitHub repo (if token provided)
if [ -n "$VERCEL_TOKEN" ]; then
  log_step "9️⃣  Checking GitHub repo..."
  curl -s -H "Authorization: token $VERCEL_TOKEN" \
    "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    log_success "Repo exists"
  else
    log_error "Repo not found - create manually: https://github.com/new"
  fi
fi

# 10. Push to GitHub
log_step "🔟 Pushing to GitHub..."
if git push -u origin main 2>&1 | grep -q "fatal"; then
  log_error "Push failed - repo may not exist"
  echo ""
  echo "📝 Create repo at: https://github.com/new"
  echo "   Name: ${REPO_NAME}"
  echo "   User: ${GITHUB_USER}"
  echo ""
  echo "Then run: git push -u origin main"
else
  log_success "Pushed to GitHub"
fi

# 11. Vercel deployment
log_step "1️⃣1️⃣ Vercel setup..."
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Install Vercel CLI:"
echo "   npm install -g vercel"
echo ""
echo "2️⃣  Login & link project:"
echo "   vercel link"
echo ""
echo "3️⃣  Add secrets to GitHub:"
echo "   gh secret set VERCEL_TOKEN --body 'your-token'"
echo "   gh secret set VERCEL_ORG_ID --body 'your-org-id'"
echo "   gh secret set VERCEL_PROJECT_ID --body 'your-project-id'"
echo ""
echo "4️⃣  Auto-deploys on push to main! ✨"
echo ""
echo "📊 Dashboard: https://vercel.com/${GITHUB_USER}/${REPO_NAME}"
echo ""

log_success "Setup complete!"
