# YNM Safety Purchase Portal

A comprehensive purchase management system for YNM Safety, built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

## Features

### Core Modules

- **Products Management** - Add, view, edit, and delete products with subtypes, units, and specifications
- **Manufacturers Directory** - Manage suppliers with location, contact details, GST, and product offerings
- **Importers Management** - Track importers with IEC codes, GSTIN, contact details, and import history
- **Dealers Management** - Manage dealer information, territories, and business details
- **Customers Directory** - Store and manage customer information with payment terms
- **Orders Management** - Create and track purchase orders with full cost breakdown
- **Reminders System** - Set and manage dispatch reminders with status tracking

### Advanced Features

- **Transport Calculator** - Calculate route distances and transport costs
  - Interactive OpenStreetMap with Leaflet
  - Real road distance calculation via OSRM (Open Source Routing Machine)
  - Estimated travel time
  - Multi-currency support (20+ currencies)
  - Custom rate per kilometer
  - **No API key required!**
- **PDF Invoice Extraction** - Extract order data from PDF invoices automatically
- **Role-Based Authentication** - Admin and Employee roles with different permissions
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Input Validation** - Real-time form validation with helpful feedback

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Authentication | JWT (JSON Web Tokens) |
| Maps | OpenStreetMap + Leaflet |
| Routing | OSRM (Open Source Routing Machine) |
| PDF Parsing | pdf-parse |
| Deployment | Vercel / GCP / Any Node.js host |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ynm-purchase-portal.git
   cd ynm-purchase-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # JWT Configuration (generate a strong secret!)
   JWT_SECRET=your-secure-random-secret-minimum-32-characters
   JWT_EXPIRE=7d
   ```

4. **Set up the database**
   
   Run the SQL commands in `docs/database-schema.sql` in your Supabase SQL Editor to create the required tables and columns.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ynm-purchase-portal/
├── docs/                       # Documentation
│   └── database-schema.sql     # Database migration SQL
├── public/                     # Static assets
│   ├── mascot.png              # App mascot
│   └── ynm-logo-*.jpg          # Company logos
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── products/       # Products CRUD
│   │   │   ├── manufacturers/  # Manufacturers CRUD
│   │   │   ├── importers/      # Importers CRUD
│   │   │   ├── dealers/        # Dealers CRUD
│   │   │   ├── customers/      # Customers CRUD
│   │   │   ├── orders/         # Orders CRUD
│   │   │   ├── orders-new/     # New orders system
│   │   │   ├── pdf/            # PDF extraction
│   │   │   └── health/         # Health check endpoint
│   │   ├── dashboard/          # Main dashboard
│   │   ├── login/              # Login page
│   │   ├── forgot-password/    # Password reset
│   │   ├── products/           # Products page
│   │   ├── manufacturers/      # Manufacturers page
│   │   ├── importers/          # Importers page
│   │   ├── dealers/            # Dealers page
│   │   ├── customers/          # Customers page
│   │   ├── orders/             # Orders page
│   │   ├── orders-create/      # Create order page
│   │   ├── orders-list/        # Orders list page
│   │   ├── reminders/          # Reminders page
│   │   ├── transport/          # Transport calculator
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # Reusable components
│   │   ├── layout/
│   │   │   ├── Header.tsx      # Page header component
│   │   │   └── Mascot.tsx      # Mascot component
│   │   └── ui/
│   │       └── ValidatedInput.tsx  # Form input with validation
│   ├── hooks/
│   │   └── useAuth.tsx         # Authentication hook
│   ├── lib/
│   │   ├── auth.ts             # JWT utilities
│   │   ├── pdf-parser.ts       # PDF extraction logic
│   │   ├── utils.ts            # Helper utilities
│   │   └── supabase/
│   │       └── server.ts       # Supabase server client
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── utils/
│       └── validation.ts       # Form validation utilities
├── .env.local.example          # Environment template (safe to commit)
├── .gitignore                  # Git ignore rules
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
├── postcss.config.mjs          # PostCSS configuration
├── eslint.config.mjs           # ESLint configuration
└── tsconfig.json               # TypeScript configuration
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

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRE` (optional)
4. Deploy

### Google Cloud Platform (GCP)

1. Install Google Cloud SDK
2. Build the application:
   ```bash
   npm run build
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy ynm-portal --source . --allow-unauthenticated
   ```
4. Set environment variables in Cloud Run console

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (keep secret!) |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars, keep secret!) |
| `JWT_EXPIRE` | No | JWT expiration (default: 7d) |

## Scripts

```bash
npm run dev      # Start development server (with hot reload)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Security Checklist

Before deploying to production, ensure:

- [ ] **Strong JWT Secret** - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] **Environment Variables** - Set all required env vars in your deployment platform
- [ ] **Never Commit Secrets** - Verify `.env.local` is in `.gitignore`
- [ ] **Enable RLS** - Enable Row Level Security in Supabase dashboard
- [ ] **HTTPS Only** - Use HTTPS in production (automatic on Vercel/GCP)
- [ ] **Review Permissions** - Ensure proper role-based access control

### What's Safe to Commit

✅ `.env.local.example` - Template with placeholder values  
✅ Source code files  
✅ Package files (`package.json`, `package-lock.json`)  
✅ Configuration files (next.config.ts, tsconfig.json, etc.)  
✅ Documentation (`docs/`, `README.md`)

### What Should NEVER Be Committed

❌ `.env.local` - Contains real credentials  
❌ `.env` - Any file with real secrets  
❌ `*.pem`, `*.key` - Private keys  
❌ `service-account*.json` - GCP credentials  
❌ `node_modules/` - Dependencies  
❌ `.next/` - Build artifacts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
npm run lint
npm run build
```

**Database columns missing**
Run the SQL in `docs/database-schema.sql` in Supabase SQL Editor.

**Authentication not working**
Verify `JWT_SECRET` is set and at least 32 characters long.

**Map not loading**
The transport calculator uses OpenStreetMap (no API key needed). Check your internet connection.

## License

Proprietary - YNM Safety. All rights reserved.

---

**Created by Om Gupta**
