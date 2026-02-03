# 🛡️ YNM Safety Purchase Portal

> A modern, full-featured purchase management system for YNM Safety, streamlining product ordering, inventory tracking, and supplier management.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 📦 Core Modules

| Module | Description |
|--------|-------------|
| **Products** | Comprehensive product catalog with subtypes, units, and specifications |
| **Manufacturers** | Supplier directory with location, contact details, GST, and product offerings |
| **Importers** | Track importers with IEC codes, GSTIN, contact details, and import history |
| **Dealers** | Manage dealer information, territories, and business relationships |
| **Customers** | Complete customer directory with payment terms and contact management |
| **Orders** | Full purchase order lifecycle management with cost breakdown |
| **Reminders** | Automated dispatch reminders with status tracking |

### 🚀 Advanced Features

- **🗺️ Transport Calculator**
  - Interactive OpenStreetMap with Leaflet integration
  - Real road distance calculation via OSRM (Open Source Routing Machine)
  - Estimated travel time and route optimization
  - Multi-currency support (20+ international currencies)
  - Custom rate per kilometer configuration
  - **100% free - No API keys required!**

- **📄 PDF Invoice Extraction**
  - Automatic data extraction from PDF invoices
  - Intelligent parsing with pdf-parse library
  - Time-saving automation for order entry

- **🔐 Role-Based Authentication**
  - Admin and Employee roles with granular permissions
  - JWT-based secure authentication
  - Protected API routes and pages

- **📱 Responsive Design**
  - Mobile-first approach
  - Works seamlessly across all devices
  - Modern, intuitive UI/UX

- **✅ Input Validation**
  - Real-time form validation
  - Helpful error messages
  - Data integrity enforcement

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 16 (App Router) | React framework with SSR/SSG |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Database** | Supabase (PostgreSQL) | Cloud database and auth |
| **Authentication** | JWT (jose) | Secure token-based auth |
| **Maps** | OpenStreetMap + Leaflet | Interactive mapping |
| **Routing** | OSRM | Route calculation and optimization |
| **PDF Processing** | pdf-parse | Invoice data extraction |
| **Deployment** | Vercel / GCP / Docker | Cloud hosting platforms |

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ynm-purchase-portal.git
   cd ynm-purchase-portal
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file from the example:

   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your actual values:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # JWT Configuration (generate a strong secret!)
   JWT_SECRET=your-secure-random-secret-minimum-32-characters
   JWT_EXPIRE=7d
   ```

   **🔑 To generate a secure JWT secret:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Set up the database**

   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL commands from `docs/database-schema.sql`
   - This creates all required tables and columns

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The application will start at [http://localhost:3000](http://localhost:3000)

6. **Build for production** (optional)

   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
ynm-purchase-portal/
├── 📁 docs/                       # Documentation
│   └── database-schema.sql        # Database migration SQL
├── 📁 public/                     # Static assets
│   ├── mascot.png                 # App mascot
│   └── ynm-logo-*.jpg             # Company logos
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 api/                # API Routes (Backend)
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── products/          # Products CRUD
│   │   │   ├── manufacturers/     # Manufacturers CRUD
│   │   │   ├── importers/         # Importers CRUD
│   │   │   ├── dealers/           # Dealers CRUD
│   │   │   ├── customers/         # Customers CRUD
│   │   │   ├── orders/            # Orders (legacy)
│   │   │   ├── orders-new/        # Orders (new system)
│   │   │   ├── pdf/               # PDF extraction
│   │   │   └── health/            # Health check endpoint
│   │   ├── 📁 (pages)/            # Frontend Pages
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── login/             # Login page
│   │   │   ├── forgot-password/   # Password reset
│   │   │   ├── products/          # Products management
│   │   │   ├── manufacturers/     # Manufacturers management
│   │   │   ├── importers/         # Importers management
│   │   │   ├── dealers/           # Dealers management
│   │   │   ├── customers/         # Customers management
│   │   │   ├── orders/            # Orders page
│   │   │   ├── orders-create/     # Create order
│   │   │   ├── orders-list/       # Orders list
│   │   │   ├── reminders/         # Reminders
│   │   │   └── transport/         # Transport calculator
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles
│   ├── 📁 components/             # Reusable components
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Page header
│   │   │   └── Mascot.tsx         # Mascot component
│   │   └── ui/
│   │       └── ValidatedInput.tsx # Input with validation
│   ├── 📁 hooks/
│   │   └── useAuth.tsx            # Authentication hook
│   ├── 📁 lib/
│   │   ├── auth.ts                # JWT utilities
│   │   ├── pdf-parser.ts          # PDF extraction logic
│   │   ├── utils.ts               # Helper utilities
│   │   └── supabase/
│   │       └── server.ts          # Supabase server client
│   ├── 📁 types/
│   │   └── index.ts               # TypeScript definitions
│   └── 📁 utils/
│       └── validation.ts          # Form validation
├── .env.local.example             # Environment template ✅ SAFE
├── .gitignore                     # Git ignore rules ✅ SECURE
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS config
├── eslint.config.mjs              # ESLint config
├── tsconfig.json                  # TypeScript config
└── README.md                      # This file
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration (admin only) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/employees` | List employees (admin) |
| GET | `/api/auth/verify-username` | Verify username exists |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/products` | List/Create products |
| GET/POST | `/api/manufacturers` | List/Create manufacturers |
| GET/POST | `/api/importers` | List/Create importers |
| GET/PUT/DELETE | `/api/importers/[id]` | CRUD importer |
| GET/POST | `/api/dealers` | List/Create dealers |
| GET/PUT/DELETE | `/api/dealers/[id]` | CRUD dealer |
| GET/POST | `/api/customers` | List/Create customers |
| GET/PUT/DELETE | `/api/customers/[id]` | CRUD customer |
| GET/POST | `/api/orders` | List/Create orders |
| GET/POST | `/api/orders-new` | New orders system |
| GET/PUT/DELETE | `/api/orders-new/[id]` | CRUD order |
| POST | `/api/pdf` | Extract data from PDF |
| GET | `/api/health` | Health check |

## Database Setup

The application requires the following tables in Supabase:

- `users` - User accounts and authentication
- `products` - Product catalog with subtypes
- `manufacturers` - Supplier directory
- `importers` - Importer records
- `dealers` - Dealer directory
- `customers` - Customer records
- `orders` - Purchase orders

Run the SQL in `docs/database-schema.sql` to set up the required columns.

## 🌐 Deployment

### Vercel (Recommended) ⭐

Vercel provides the best Next.js hosting experience with zero configuration.

1. **Push code to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings

3. **Configure environment variables**
   
   In Vercel Dashboard → Settings → Environment Variables, add:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production, Preview, Development |
   | `JWT_SECRET` | `(64-char secret)` | Production, Preview, Development |
   | `JWT_EXPIRE` | `7d` | Production, Preview, Development |

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

**Automatic deployments:** Every push to `main` triggers a production deployment. Pull requests create preview deployments.

---

### Google Cloud Platform (GCP)

Deploy to Cloud Run for scalable containerized hosting.

1. **Install Google Cloud SDK**

   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Initialize and authenticate**

   ```bash
   gcloud init
   gcloud auth login
   ```

3. **Set your project**

   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Deploy to Cloud Run**

   ```bash
   # Build and deploy in one command
   gcloud run deploy ynm-portal \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

5. **Set environment variables**

   ```bash
   gcloud run services update ynm-portal \
     --region us-central1 \
     --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co,JWT_SECRET=your-secret,JWT_EXPIRE=7d" \
     --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-key:latest"
   ```

   Or use the Cloud Console → Cloud Run → Your Service → Variables & Secrets

---

### Docker Deployment 🐳

For any container-based hosting (AWS ECS, Azure Container Apps, DigitalOcean, etc.)

1. **Create `Dockerfile`**

   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Build and run**

   ```bash
   docker build -t ynm-portal .
   docker run -p 3000:3000 --env-file .env.local ynm-portal
   ```

---

### Traditional VPS (Any Node.js Host)

For DigitalOcean Droplets, Linode, AWS EC2, etc.

1. **Clone and install on server**

   ```bash
   git clone https://github.com/yourusername/ynm-purchase-portal.git
   cd ynm-purchase-portal
   npm ci --production
   ```

2. **Set environment variables**

   ```bash
   nano .env.local
   # Add your environment variables
   ```

3. **Build and start**

   ```bash
   npm run build
   npm start
   ```

4. **Use PM2 for process management** (recommended)

   ```bash
   npm install -g pm2
   pm2 start npm --name "ynm-portal" -- start
   pm2 startup
   pm2 save
   ```

5. **Set up Nginx reverse proxy** (optional but recommended)

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (keep secret!) |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars, keep secret!) |
| `JWT_EXPIRE` | No | JWT expiration (default: 7d) |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint to check code quality |

## 🔒 Security

### Pre-Deployment Security Checklist

Before deploying to production, verify ALL items:

- [x] **Strong JWT Secret** - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [x] **Environment Variables Set** - All required env vars configured in deployment platform
- [x] **Never Commit Secrets** - Verify `.env.local` is in `.gitignore` and NOT in git history
- [x] **Enable RLS in Supabase** - Go to Supabase Dashboard → Authentication → Policies
- [x] **HTTPS Only** - Ensure HTTPS in production (automatic on Vercel/GCP)
- [x] **Review API Permissions** - Check role-based access control is working
- [x] **Rotate Credentials Regularly** - Change JWT_SECRET and Supabase keys periodically
- [x] **Monitor API Usage** - Watch Supabase dashboard for unusual activity
- [x] **Enable 2FA on Supabase** - Protect your database access
- [x] **Review .gitignore** - Ensure all sensitive patterns are ignored

### What's Safe to Commit ✅

These files are SAFE and SHOULD be committed to GitHub:

| File/Folder | Description |
|-------------|-------------|
| ✅ `.env.local.example` | Environment template (NO real values) |
| ✅ All `src/**` files | Source code |
| ✅ `package.json` | Dependencies list |
| ✅ `package-lock.json` | Dependency lock file |
| ✅ `next.config.ts` | Next.js configuration |
| ✅ `tsconfig.json` | TypeScript configuration |
| ✅ `tailwind.config.*` | Tailwind configuration |
| ✅ `eslint.config.*` | ESLint rules |
| ✅ `.gitignore` | Git ignore rules |
| ✅ `README.md` | Documentation |
| ✅ `docs/**` | Documentation files |
| ✅ `public/**` | Static assets (logos, images) |

### What Should NEVER Be Committed ❌

These files contain secrets and MUST NEVER be in version control:

| File/Pattern | Risk Level | Contains |
|--------------|------------|----------|
| ❌ `.env.local` | 🔴 CRITICAL | Real API keys and secrets |
| ❌ `.env` | 🔴 CRITICAL | Environment variables |
| ❌ `.env.production` | 🔴 CRITICAL | Production credentials |
| ❌ `*.pem`, `*.key` | 🔴 CRITICAL | Private keys |
| ❌ `*.cert`, `*.crt` | 🔴 CRITICAL | SSL certificates |
| ❌ `service-account*.json` | 🔴 CRITICAL | GCP credentials |
| ❌ `gcp-credentials*.json` | 🔴 CRITICAL | Cloud credentials |
| ❌ `.vercel/` | 🟡 MODERATE | Vercel deployment info |
| ❌ `node_modules/` | 🟢 LOW | Dependencies (rebuild from package.json) |
| ❌ `.next/` | 🟢 LOW | Build artifacts (regenerated) |
| ❌ `.DS_Store` | 🟢 LOW | macOS metadata |

### Security Best Practices

1. **Environment Variables**
   - Never hardcode secrets in source code
   - Use different secrets for development/staging/production
   - Rotate secrets regularly (every 3-6 months)

2. **Git History**
   - If you accidentally committed secrets, don't just delete them - use `git filter-branch` or BFG Repo Cleaner
   - Better yet, immediately rotate the compromised credentials

3. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Use service role key ONLY on server-side
   - Never expose service role key in client code
   - Regularly review access policies

4. **JWT Security**
   - Use at least 64 characters for JWT_SECRET
   - Set reasonable expiration times (7d for development, 1-2h for production)
   - Implement token refresh mechanism for production

5. **API Security**
   - All API routes validate JWT tokens
   - Role-based access control enforced
   - Input validation on all endpoints
   - Rate limiting (implement for production)

### Verifying Security Before Push

Run this command to check for accidentally staged secrets:

```bash
# Check what's about to be committed
git diff --staged

# Search for potential secrets in staged files
git diff --staged | grep -iE "(secret|password|api_key|token|key=|bearer)"

# Verify .env.local is ignored
git check-ignore .env.local
```

If you see any secrets, run:

```bash
git reset HEAD <file>  # Unstage the file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Build Errors

**Problem:** TypeScript compilation errors during build

```bash
# Check for linter errors
npm run lint

# Try a clean build
rm -rf .next node_modules
npm install
npm run build
```

**Problem:** `Module not found` errors

```bash
# Verify all dependencies are installed
npm install

# Check if the import path is correct (use @/ for src/ folder)
# Example: import { useAuth } from '@/hooks/useAuth'
```

---

#### Database Issues

**Problem:** Cannot connect to Supabase

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
3. Ensure your IP is not blocked in Supabase dashboard
4. Test connection:

```bash
curl -H "apikey: YOUR_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/"
```

**Problem:** Table or column doesn't exist

- Run the SQL from `docs/database-schema.sql` in Supabase SQL Editor
- Verify table names match exactly (case-sensitive)
- Check RLS (Row Level Security) policies aren't blocking access

---

#### Authentication Issues

**Problem:** Login not working / "Invalid token"

1. Verify `JWT_SECRET` is set and consistent across all environments
2. Generate a new secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. Ensure `JWT_SECRET` is at least 32 characters
4. Clear browser localStorage and cookies
5. Check server logs for JWT verification errors

**Problem:** Session expires too quickly

- Increase `JWT_EXPIRE` value in `.env.local` (e.g., `30d` for 30 days)
- Restart the development server after changing env vars

---

#### Map/Transport Calculator Issues

**Problem:** Map not loading

- The transport calculator uses **OpenStreetMap** (no API key needed)
- Check your internet connection
- Verify browser console for JavaScript errors
- Try using a different browser or clearing cache

**Problem:** Route calculation fails

- OSRM service might be temporarily unavailable
- Check if start/end coordinates are valid
- Ensure both points are connected by roads

---

#### Environment Variable Issues

**Problem:** Environment variables not loading

1. Verify `.env.local` exists in project root
2. Variable names must be exact (case-sensitive)
3. Restart dev server after changing `.env.local`
4. For client-side access, use `NEXT_PUBLIC_` prefix
5. Check for typos in variable names

```bash
# Verify .env.local is not ignored
cat .env.local

# Restart dev server
npm run dev
```

---

#### Deployment Issues

**Vercel:**
- Set all env vars in Vercel Dashboard → Settings → Environment Variables
- Redeploy after adding/changing env vars
- Check build logs in Vercel dashboard

**GCP Cloud Run:**
- Ensure all env vars are set via `gcloud` or Cloud Console
- Check Cloud Run logs: `gcloud logging read --limit 50`
- Verify service has sufficient memory (min 512MB recommended)

**Docker:**
- Pass env vars via `--env-file` flag or `-e` options
- Don't include `.env.local` in Docker image (security risk)
- Use secrets management for production

---

#### Performance Issues

**Problem:** Slow page load times

1. Enable Next.js production mode: `npm run build && npm start`
2. Check network tab in browser DevTools
3. Optimize images (use Next.js Image component)
4. Consider implementing caching for frequently accessed data

**Problem:** Large bundle size

```bash
# Analyze bundle size
npm run build
# Review the output for large dependencies
```

---

### Getting Help

If you're still experiencing issues:

1. **Check logs:**
   - Browser console (F12 → Console)
   - Server terminal output
   - Vercel/GCP deployment logs

2. **Search existing issues:**
   - Next.js: https://github.com/vercel/next.js/issues
   - Supabase: https://github.com/supabase/supabase/discussions

3. **Create an issue:**
   - Include error messages
   - Describe steps to reproduce
   - Share relevant code (without secrets!)

---

### Useful Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code quality

# Debugging
npm run build 2>&1 | tee build.log  # Save build output
rm -rf .next             # Clear Next.js cache
npm ci                   # Clean install dependencies

# Git
git status               # Check what's changed
git log --oneline -10    # Recent commits
git diff                 # See unstaged changes
```

## 📄 License

**Proprietary** - YNM Safety. All rights reserved.

This software is the property of YNM Safety and is protected by copyright law. Unauthorized copying, distribution, or modification is strictly prohibited.

---

## 👨‍�💻 Author

**Created by Om Gupta**

For questions or support, please contact the development team.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [OpenStreetMap](https://www.openstreetmap.org/) - Free map data
- [Leaflet](https://leafletjs.com/) - Interactive maps library
- [OSRM](http://project-osrm.org/) - Open Source Routing Machine

---

<div align="center">

**⭐ Built with Next.js 16, TypeScript, and Tailwind CSS ⭐**

Made with ❤️ by Om Gupta for YNM Safety

</div>
