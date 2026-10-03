# 🚀 PUBLISH IN 3 COMMANDS

**Directorio:** `C:\Users\USER\Downloads\hbo-noir-icons`

---

## 1️⃣ Run Deploy Script

```bash
cd ~/Downloads/hbo-noir-icons
bash DEPLOY.sh hbo-noir-icons belentani7
```

**Qué hace:**
- ✅ Configura Git
- ✅ Crea .gitignore, .env.example, .vercelignore
- ✅ Crea GitHub Actions workflow
- ✅ Hace push a GitHub

**Output esperado:**
```
✓ Git configured
✓ .gitignore created
✓ GitHub Actions created
✓ Remote: https://github.com/belentani7/hbo-noir-icons.git
✓ Pushed to GitHub
```

---

## 2️⃣ Link to Vercel

```bash
npm install -g vercel
vercel link
```

**En Vercel:**
- Selecciona "Create new project"
- Framework: Vite
- Deploy root: ./
- Listo ✅

---

## 3️⃣ Add GitHub Secrets

```bash
# Get tokens from https://vercel.com/account/tokens
gh secret set VERCEL_TOKEN --body "your_token_here"

# Get from https://vercel.com/account/settings/organizations/select
gh secret set VERCEL_ORG_ID --body "your_org_id"

# From Vercel dashboard project
gh secret set VERCEL_PROJECT_ID --body "your_project_id"
```

---

## 🎉 Done!

Ahora cada `git push` a **main** auto-deploya en Vercel.

### Test Deploy:

```bash
echo "test" >> README.md
git add .
git commit -m "test deploy"
git push
```

**Vercel auto-deploya.** Ver en: https://vercel.com/belentani7/hbo-noir-icons

---

## 📍 URLs después

- **GitHub:** https://github.com/belentani7/hbo-noir-icons
- **Live:** https://hbo-noir-icons.vercel.app
- **Dashboard:** https://vercel.com/belentani7/hbo-noir-icons

---

**¿Dudas?** Las respuestas están en DEPLOY.sh
