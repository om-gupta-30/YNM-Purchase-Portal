# 🚀 Quick Start Guide - YNM Purchase Portal

## ⚡ TL;DR - Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example file
cp .env.local.example .env.local

# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env.local and add:
# - Your Supabase URL
# - Your Supabase service role key
# - The generated JWT secret (paste the output from above)
```

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## 🔒 IMPORTANT: Security Setup

### Your Current JWT_SECRET is TOO WEAK!

**Current:** `ynm_secret_key_here` (19 chars) ❌  
**Required:** Minimum 32 characters, recommended 64+

**Fix it now:**

```bash
# 1. Generate a strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Copy the output (looks like: 89683c3d3a7100af...)

# 3. Open .env.local and replace JWT_SECRET value

# 4. Restart the dev server
npm run dev
```

---

## ✅ Pre-Deployment Checklist

Before pushing to GitHub or deploying:

```bash
# 1. Strengthen JWT_SECRET (see above)

# 2. Run security check
chmod +x scripts/security-check.sh
./scripts/security-check.sh

# 3. Verify build
npm run build

# 4. Check git status
git status
# Make sure .env.local is NOT listed!
```

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Full project documentation |
| [AUDIT_SUMMARY.md](AUDIT_SUMMARY.md) | Security audit results |
| [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) | Environment variables guide |
| [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist |
| [.github/SECURITY.md](.github/SECURITY.md) | Security policy |
| [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) | How to contribute |

---

## 🌐 Deploy to Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to vercel.com/new

# 3. Import your GitHub repository

# 4. Add environment variables in Vercel:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - SUPABASE_SERVICE_ROLE_KEY
#    - JWT_SECRET (use a STRONG one!)
#    - JWT_EXPIRE (optional, default: 7d)

# 5. Click Deploy!
```

---

## 🐛 Troubleshooting

### Build fails?
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Login not working?
- Check JWT_SECRET is set and at least 32 characters
- Restart dev server after changing .env.local

### Supabase connection fails?
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Use service_role key, NOT anon key
- Test: `curl -H "apikey: YOUR_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"`

---

## 📞 Need Help?

- See [README.md](README.md) for detailed documentation
- Check [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for env var issues
- Review [AUDIT_SUMMARY.md](AUDIT_SUMMARY.md) for security status

---

## ✨ What's New in This Update

- ✅ Comprehensive README.md (GitHub-ready)
- ✅ Security documentation and policies
- ✅ Deployment guides for Vercel, GCP, Docker
- ✅ Automated security check script
- ✅ CI/CD workflows for GitHub Actions
- ✅ Contributing guidelines
- ✅ Removed unnecessary files (.DS_Store)
- ✅ Verified no secrets in git

---

**Status:** ✅ Ready for GitHub & Deployment  
**Action Required:** Update JWT_SECRET before production deployment

**Happy Coding!** 🎉
