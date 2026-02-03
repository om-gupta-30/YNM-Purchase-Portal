# YNM Purchase Portal - Environment Setup Guide

## 🔐 Setting Up Environment Variables

Follow these steps carefully to set up your environment variables securely.

### Step 1: Copy the Example File

```bash
cp .env.local.example .env.local
```

### Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (NOT anon key) → use for `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Generate a Strong JWT Secret

Run this command to generate a secure 128-character secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it for `JWT_SECRET` in `.env.local`

### Step 4: Edit .env.local

Your `.env.local` should look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration
JWT_SECRET=89683c3d3a7100af353131b82a18521ca19fe28873b692eaac049896975556be...
JWT_EXPIRE=7d
```

## ⚠️ Important Security Notes

### CRITICAL - JWT_SECRET Requirements

Your `JWT_SECRET` **MUST** be:
- ✅ At least **32 characters** (minimum)
- ✅ Recommended: **64+ characters** (128 hex = 64 bytes)
- ✅ **Randomly generated** (use the command above)
- ✅ **Different for each environment** (dev, staging, production)

### ❌ DO NOT USE

- ❌ `ynm_secret_key_here` (too weak, only 19 characters)
- ❌ Any predictable string
- ❌ The same secret across environments
- ❌ Secrets from this documentation (examples only!)

### Why JWT_SECRET Strength Matters

A weak JWT secret allows attackers to:
- Forge authentication tokens
- Impersonate any user (including admins)
- Access all protected API routes
- Compromise the entire application

## 🔍 Verification

After setting up `.env.local`, verify everything is correct:

```bash
# Run the security check script
./scripts/security-check.sh
```

This will check:
- ✅ `.env.local` exists
- ✅ `.env.local` is ignored by git
- ✅ All required variables are set
- ✅ JWT_SECRET is strong enough (32+ chars)
- ✅ No secrets in git history
- ✅ Build succeeds

## 🚀 Next Steps

Once all checks pass:

```bash
# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (safe to expose) | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (keep secret!) | `eyJhbGc...` |
| `JWT_SECRET` | Yes | JWT signing secret (64+ chars) | `89683c3d...` |
| `JWT_EXPIRE` | No | Token expiration time | `7d` (default) |

## 🔒 Security Checklist

Before deploying:

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] `.env.local` in `.gitignore`
- [ ] Different secrets for each environment
- [ ] RLS enabled in Supabase
- [ ] All security checks pass
- [ ] No secrets in git history

## ❓ Troubleshooting

### "JWT_SECRET is too weak"

```bash
# Generate a new strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env.local with the new secret
# Restart the dev server
npm run dev
```

### "Build failed"

```bash
# Check if all env vars are set
cat .env.local

# Verify no syntax errors in .env.local
# Each line should be: VARIABLE_NAME=value
# No spaces around =
# No quotes needed (usually)
```

### "Supabase connection failed"

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Use **service_role** key, not anon key
3. Check Supabase project is not paused
4. Test connection:
   ```bash
   curl -H "apikey: YOUR_SERVICE_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
   ```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Remember:** Never commit `.env.local` to version control! 🔒
