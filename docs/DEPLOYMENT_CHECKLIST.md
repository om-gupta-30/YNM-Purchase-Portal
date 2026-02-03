# 🚀 Deployment Checklist

Use this checklist before deploying to production, staging, or any live environment.

## 📋 Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All TypeScript errors resolved
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in development
- [ ] Code reviewed (if team project)

### 2. Security 🔒

- [ ] **CRITICAL:** `.env.local` NOT committed to git
- [ ] **CRITICAL:** Strong JWT_SECRET (64+ characters)
- [ ] **CRITICAL:** Different secrets for each environment
- [ ] No hardcoded secrets in code
- [ ] No API keys in client-side code
- [ ] Run security check: `./scripts/security-check.sh`
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Row Level Security (RLS) enabled in Supabase
- [ ] 2FA enabled on Supabase account
- [ ] 2FA enabled on deployment platform account

### 3. Environment Variables 🔐

- [ ] All required env vars set in deployment platform
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (use Secrets/Vault)
- [ ] `JWT_SECRET` configured (use Secrets/Vault)
- [ ] `JWT_EXPIRE` configured (optional)
- [ ] Env vars match deployment environment (not dev values)
- [ ] No placeholder values (e.g., "your-value-here")

### 4. Database 🗄️

- [ ] Database schema up to date (`docs/database-schema.sql`)
- [ ] All required tables exist
- [ ] All required columns exist
- [ ] RLS policies configured
- [ ] Database backup created
- [ ] Test queries work
- [ ] Indexes created for performance

### 5. Git & Version Control 📦

- [ ] All changes committed
- [ ] Meaningful commit messages
- [ ] No uncommitted changes (`git status`)
- [ ] Working on correct branch
- [ ] Pushed to remote repository
- [ ] Tags created (if using versioning)

### 6. Platform-Specific Setup 🌐

#### For Vercel:
- [ ] Project imported from GitHub
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node.js version: 18.x or 20.x
- [ ] Environment variables set
- [ ] Domain configured (if custom domain)
- [ ] SSL certificate active

#### For GCP Cloud Run:
- [ ] `gcloud` CLI authenticated
- [ ] Project ID set correctly
- [ ] Region selected
- [ ] Environment variables configured
- [ ] Service account permissions set
- [ ] Cloud SQL connected (if using)
- [ ] Domain mapping configured
- [ ] HTTPS enforced

#### For Docker:
- [ ] Dockerfile exists and tested
- [ ] `.dockerignore` configured
- [ ] Build succeeds locally
- [ ] Container runs locally
- [ ] Environment variables passed correctly
- [ ] Health check configured
- [ ] Volume mounts configured (if needed)

### 7. Testing 🧪

- [ ] Test login functionality
- [ ] Test each main feature:
  - [ ] Products management
  - [ ] Manufacturers
  - [ ] Importers
  - [ ] Dealers
  - [ ] Customers
  - [ ] Orders
  - [ ] Transport calculator
  - [ ] PDF extraction
- [ ] Test role-based access (Admin vs Employee)
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test error handling

### 8. Performance 📈

- [ ] Images optimized
- [ ] No unnecessary console.logs
- [ ] Build size reasonable
- [ ] Page load times acceptable
- [ ] API response times acceptable

### 9. Documentation 📚

- [ ] README.md up to date
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment instructions clear
- [ ] Troubleshooting guide updated

### 10. Post-Deployment 🎯

- [ ] Application accessible at URL
- [ ] Login works
- [ ] Database operations work
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] SSL certificate valid (HTTPS)
- [ ] Environment variables loaded correctly
- [ ] Monitor for 24 hours for issues

## 🚨 Critical Security Verification

Before going live, verify these CRITICAL security items:

```bash
# 1. Check git for secrets
git diff --staged | grep -iE "(secret|password|api_key|token)"

# 2. Verify .env.local is ignored
git check-ignore .env.local

# 3. Check for committed secrets
git log --all --full-history -- .env.local

# 4. Run security audit
npm audit --audit-level=moderate

# 5. Run full security check
./scripts/security-check.sh
```

All checks should pass with ✅

## 📊 Deployment Environments

### Development
- URL: http://localhost:3000
- Database: Development Supabase project
- Secrets: Stored in `.env.local`

### Staging (Optional)
- URL: https://staging-your-app.vercel.app
- Database: Staging Supabase project
- Secrets: Different from production

### Production
- URL: https://your-app.com
- Database: Production Supabase project
- Secrets: STRONG & UNIQUE

## 🔄 Rollback Plan

If deployment fails:

1. **Vercel:** Instant rollback to previous deployment in dashboard
2. **GCP:** Deploy previous version or container
3. **Database:** Restore from backup
4. **Communicate:** Notify stakeholders

## 📞 Support Contacts

- **Technical Issues:** [Your Email]
- **Supabase Issues:** https://supabase.com/support
- **Vercel Issues:** https://vercel.com/support
- **GCP Issues:** https://cloud.google.com/support

## ✅ Final Confirmation

Before clicking "Deploy":

- [ ] I have reviewed ALL items in this checklist
- [ ] All critical security items are verified
- [ ] I have tested the application thoroughly
- [ ] I have a rollback plan
- [ ] I am ready to monitor post-deployment

---

**Date:** _______________  
**Deployed by:** _______________  
**Environment:** _______________  
**Version/Commit:** _______________

---

## 🎉 Post-Deployment Success Criteria

Your deployment is successful when:

1. ✅ Application loads without errors
2. ✅ Users can log in
3. ✅ All features work as expected
4. ✅ No security warnings
5. ✅ Performance is acceptable
6. ✅ No critical errors in logs
7. ✅ HTTPS is working
8. ✅ Database connections stable

**Good luck with your deployment!** 🚀
