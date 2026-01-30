# YNM Safety Portal

A modern purchase portal for YNM Safety built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Products Management** - Add, view, and delete products with subtypes
- **Manufacturers Directory** - Manage manufacturers and their product offerings
- **Task Management** - Role-based task assignment (Admin assigns, Employees update)
- **Transport Calculator** - Calculate route distances and transport costs
- **AI Chatbot** - Ask questions about products, orders, and tasks (Google Gemini)
- **PDF Extraction** - Extract order data from PDF invoices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Auth**: JWT-based authentication

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET` - Secret for JWT tokens
- `GEMINI_API_KEY` - Google Gemini API key (for chatbot)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key (optional, for transport)

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── products/       # Products CRUD
│   │   ├── manufacturers/  # Manufacturers CRUD
│   │   ├── orders/         # Orders CRUD
│   │   ├── tasks/          # Tasks CRUD
│   │   ├── chatbot/        # AI chatbot
│   │   └── pdf/            # PDF extraction
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── products/           # Products page
│   ├── manufacturers/      # Manufacturers page
│   ├── tasks/              # Tasks page
│   └── transport/          # Transport calculator
├── components/             # Reusable UI components
├── hooks/                  # React hooks (useAuth)
├── lib/                    # Utilities
│   ├── auth.ts            # JWT helpers
│   ├── supabase/          # Supabase clients
│   ├── utils.ts           # Validation & fuzzy matching
│   └── pdf-parser.ts      # PDF extraction
└── types/                  # TypeScript types
```

## Login Credentials

- **Admin**: `Admin` / `Admin@RishuuNJain`
- **Employee**: `Harikanth` / `Employee@Harikanth`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker / Other

```bash
npm run build
npm start
```

## License

Proprietary - YNM Safety
