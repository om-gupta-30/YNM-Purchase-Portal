#!/bin/bash

# ===========================================
# YNM Purchase Portal - Pre-Deployment Security Check
# ===========================================

echo "🔒 Running security checks..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Environment file exists
echo "1️⃣  Checking .env.local file..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
else
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo "   Run: cp .env.local.example .env.local"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Environment file is ignored
echo "2️⃣  Checking .env.local is ignored by git..."
if git check-ignore -q .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ .env.local is properly ignored${NC}"
else
    echo -e "${RED}❌ .env.local is NOT ignored by git!${NC}"
    echo "   This is a CRITICAL security risk!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: No secrets in git
echo "3️⃣  Checking for secrets in git history..."
SECRETS=$(git ls-files | grep -iE "\\.env$|secret|credential|\\.key$|\\.pem$" | grep -v ".example" | grep -v "SECURITY.md" | grep -v "security-check" || true)
if [ -z "$SECRETS" ]; then
    echo -e "${GREEN}✅ No sensitive files in git${NC}"
else
    echo -e "${RED}❌ Sensitive files found in git:${NC}"
    echo "$SECRETS"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 4: Required env vars are set
echo "4️⃣  Checking required environment variables..."
if [ -f ".env.local" ]; then
    REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" .env.local; then
            VALUE=$(grep "^${VAR}=" .env.local | cut -d '=' -f 2-)
            if [[ "$VALUE" == *"your-"* ]] || [[ "$VALUE" == *"placeholder"* ]]; then
                echo -e "${YELLOW}⚠️  $VAR is set but looks like a placeholder${NC}"
                WARNINGS=$((WARNINGS + 1))
            else
                echo -e "${GREEN}✅ $VAR is set${NC}"
            fi
        else
            echo -e "${RED}❌ $VAR is missing!${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${YELLOW}⚠️  Skipping (no .env.local file)${NC}"
fi
echo ""

# Check 5: JWT secret strength
echo "5️⃣  Checking JWT_SECRET strength..."
if [ -f ".env.local" ] && grep -q "^JWT_SECRET=" .env.local; then
    JWT_SECRET=$(grep "^JWT_SECRET=" .env.local | cut -d '=' -f 2-)
    LENGTH=${#JWT_SECRET}
    if [ $LENGTH -ge 64 ]; then
        echo -e "${GREEN}✅ JWT_SECRET is strong (${LENGTH} characters)${NC}"
    elif [ $LENGTH -ge 32 ]; then
        echo -e "${YELLOW}⚠️  JWT_SECRET is acceptable but could be stronger (${LENGTH} characters)${NC}"
        echo "   Recommended: 64+ characters"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}❌ JWT_SECRET is too weak (${LENGTH} characters)${NC}"
        echo "   Minimum: 32 characters, Recommended: 64+"
        echo "   Generate: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  JWT_SECRET not found${NC}"
fi
echo ""

# Check 6: No .DS_Store files
echo "6️⃣  Checking for .DS_Store files..."
DS_STORE_COUNT=$(git ls-files | grep -c ".DS_Store" || true)
if [ $DS_STORE_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ No .DS_Store files in git${NC}"
else
    echo -e "${YELLOW}⚠️  Found $DS_STORE_COUNT .DS_Store file(s) in git${NC}"
    echo "   Run: git rm .DS_Store"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: Dependencies security audit
echo "7️⃣  Running npm security audit..."
if npm audit --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✅ No high/critical vulnerabilities found${NC}"
else
    echo -e "${RED}❌ Vulnerabilities found!${NC}"
    echo "   Run: npm audit"
    echo "   Fix: npm audit fix"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 8: Build test
echo "8️⃣  Testing build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo "   Run: npm run build"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "========================================="
echo "📊 SUMMARY"
echo "========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to deploy.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) - Review before deploying${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) and ${WARNINGS} warning(s)${NC}"
    echo "   Please fix errors before deploying to production!"
    exit 1
fi
