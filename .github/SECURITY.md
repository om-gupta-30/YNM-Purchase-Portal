# Security Policy

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in the YNM Purchase Portal, please report it by contacting the development team directly. **Do not create a public GitHub issue.**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix deployment**: Based on severity (critical: 24-48 hours)

## 🛡️ Security Best Practices

### For Developers

1. **Never commit secrets** to version control
2. **Always use environment variables** for sensitive data
3. **Keep dependencies updated** with `npm audit`
4. **Review code changes** before committing
5. **Enable 2FA** on all accounts (GitHub, Supabase, Vercel)

### For Deployment

1. **Use strong JWT secrets** (minimum 64 characters)
2. **Enable HTTPS** in production (required)
3. **Set up Row Level Security** in Supabase
4. **Rotate credentials** every 3-6 months
5. **Monitor API usage** for unusual patterns
6. **Use different secrets** for dev/staging/production

## 🔐 Environment Variables Security

### Safe to Expose (NEXT_PUBLIC_*)

- `NEXT_PUBLIC_SUPABASE_URL` - Public URL, safe to expose

### Must Keep Secret

- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, NEVER expose
- `JWT_SECRET` - Critical, minimum 64 characters
- Any API keys or credentials

## 📋 Pre-Deployment Checklist

- [ ] All secrets in `.env.local` (not committed)
- [ ] `.env.local` listed in `.gitignore`
- [ ] Strong JWT secret (64+ chars)
- [ ] RLS enabled in Supabase
- [ ] HTTPS configured
- [ ] Different secrets for each environment
- [ ] 2FA enabled on critical accounts
- [ ] Dependencies audited (`npm audit`)
- [ ] No secrets in git history
- [ ] API rate limiting considered

## 🔍 Vulnerability Scanning

Run these commands before deployment:

```bash
# Check for vulnerabilities in dependencies
npm audit

# Fix automatically if possible
npm audit fix

# Check for accidentally committed secrets
git diff --staged | grep -iE "(secret|password|api_key|token)"
```

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: February 2026
