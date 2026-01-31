# YNM Safety Purchase Portal

A comprehensive purchase management system for YNM Safety, built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

## Features

### Core Modules

- **Products Management** - Add, view, edit, and delete products with subtypes and units
- **Manufacturers Directory** - Manage suppliers with location, contact, and product offerings
- **Importers Management** - Track importers with GSTIN, contact details, and addresses
- **Dealers Management** - Manage dealer information and contacts
- **Customers Directory** - Store and manage customer information
- **Orders Management** - Create and track purchase orders with full cost breakdown
- **Reminders System** - Set and manage dispatch reminders with status tracking

### Advanced Features

- **Transport Calculator** - Calculate route distances and transport costs using Google Maps API
  - Embedded interactive Google Maps
  - Real road distance calculation (not just air distance)
  - Estimated travel time
  - Multi-currency support (20+ currencies)
  - Custom rate per kilometer
- **PDF Invoice Extraction** - Extract order data from PDF invoices automatically
- **Role-Based Authentication** - Admin and Employee roles with different permissions
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Authentication | JWT (JSON Web Tokens) |
| Maps | Google Maps API |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Maps API)

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
   
   Then edit `.env.local` with your values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # JWT Configuration
   JWT_SECRET=your-secure-random-secret
   JWT_EXPIRE=7d
   
   # Google Maps API (for transport calculator)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ynm-purchase-portal/
├── public/                     # Static assets
│   ├── mascot.png             # App mascot
│   └── ynm-logo-*.jpg         # Company logos
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   │   ├── login/     # POST /api/auth/login
│   │   │   │   ├── register/  # POST /api/auth/register
│   │   │   │   ├── me/        # GET /api/auth/me
│   │   │   │   └── ...
│   │   │   ├── products/      # Products CRUD
│   │   │   ├── manufacturers/ # Manufacturers CRUD
│   │   │   ├── importers/     # Importers CRUD
│   │   │   ├── dealers/       # Dealers CRUD
│   │   │   ├── customers/     # Customers CRUD
│   │   │   ├── orders/        # Orders CRUD
│   │   │   ├── orders-new/    # New orders system
│   │   │   ├── pdf/           # PDF extraction
│   │   │   └── health/        # Health check endpoint
│   │   ├── dashboard/         # Main dashboard
│   │   ├── login/             # Login page
│   │   ├── products/          # Products page
│   │   ├── manufacturers/     # Manufacturers page
│   │   ├── importers/         # Importers page
│   │   ├── dealers/           # Dealers page
│   │   ├── customers/         # Customers page
│   │   ├── orders/            # Orders page
│   │   ├── orders-create/     # Create order page
│   │   ├── orders-list/       # Orders list page
│   │   ├── reminders/         # Reminders page
│   │   ├── transport/         # Transport calculator
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   └── layout/
│   │       ├── Header.tsx     # Page header component
│   │       └── Mascot.tsx     # Mascot component
│   ├── hooks/
│   │   └── useAuth.tsx        # Authentication hook
│   ├── lib/
│   │   ├── auth.ts            # JWT utilities
│   │   ├── pdf-parser.ts      # PDF extraction logic
│   │   ├── utils.ts           # Helper utilities
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client
│   │       └── server.ts      # Supabase server client
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.local.example         # Environment template
├── .gitignore                 # Git ignore rules
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/employees` | List employees (admin) |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/products` | List/Create products |
| GET/POST | `/api/manufacturers` | List/Create manufacturers |
| GET/PUT/DELETE | `/api/manufacturers/[id]` | CRUD manufacturer |
| GET/POST | `/api/importers` | List/Create importers |
| GET/PUT/DELETE | `/api/importers/[id]` | CRUD importer |
| GET/POST | `/api/dealers` | List/Create dealers |
| GET/PUT/DELETE | `/api/dealers/[id]` | CRUD dealer |
| GET/POST | `/api/customers` | List/Create customers |
| GET/PUT/DELETE | `/api/customers/[id]` | CRUD customer |
| GET/POST | `/api/orders` | List/Create orders |
| GET/POST | `/api/orders-new` | New orders system |
| POST | `/api/pdf` | Extract data from PDF |
| GET | `/api/health` | Health check |

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- `users` - User accounts and authentication
- `products` - Product catalog with subtypes
- `manufacturers` - Supplier directory
- `importers` - Importer records
- `dealers` - Dealer directory
- `customers` - Customer records
- `orders` - Purchase orders
- `reminders` - Dispatch reminders

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `JWT_EXPIRE` | No | JWT expiration (default: 7d) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Google Maps API key |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Security Notes

- Never commit `.env.local` to version control
- Restrict Google Maps API key to your domains in Google Cloud Console
- Use strong JWT secrets in production
- Enable Row Level Security (RLS) in Supabase

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - YNM Safety. All rights reserved.

---

**Created by Om Gupta**
