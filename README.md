# YNM Safety Portal

A comprehensive full-stack web application for managing safety products, manufacturers, orders, transport costs, and task assignments for YNM Safety Pvt. Ltd.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [Core Concepts & Implementation](#core-concepts--implementation)
5. [Project Structure](#project-structure)
6. [Setup & Installation](#setup--installation)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Key Features Explained](#key-features-explained)
10. [Database Schema](#database-schema)
11. [Security & Authentication](#security--authentication)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This is a **three-tier full-stack application** designed to streamline business operations for a safety products company. The system handles:

- **Product Catalog Management**: Track safety products with types, subtypes, and units
- **Manufacturer Management**: Maintain supplier information with locations and contact details
- **Order Processing**: Create and manage purchase orders with automatic cost calculations
- **Task Assignment**: Admin-to-employee task delegation with status tracking
- **PDF Invoice Processing**: Extract data from PDF invoices automatically
- **Transport Cost Calculation**: Real-time distance-based pricing using Google Maps
- **AI-Powered Chatbot**: Context-aware assistant for database queries

---

## 🏗️ Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Static HTML/CSS/JS)                       │  │
│  │  - Served by Express static middleware               │  │
│  │  - Vanilla JavaScript (no framework)                 │  │
│  │  - Direct API calls via fetch/axios                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                      │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │  Node.js Backend    │      │  Python PDF Service   │   │
│  │  (Express.js)       │◄────►│  (Flask)             │   │
│  │  Port: 5002         │      │  Port: 5001           │   │
│  │                     │      │                       │   │
│  │  - REST API         │      │  - PDF Text Extract   │   │
│  │  - JWT Auth         │      │  - Regex Parsing      │   │
│  │  - File Upload      │      │  - Data Extraction    │   │
│  │  - Gemini AI        │      │                       │   │
│  └──────────────────────┘      └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ Supabase Client
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL)                               │  │
│  │  - Cloud-hosted database                              │  │
│  │  - RESTful API via Supabase JS SDK                    │  │
│  │  - Row-level security (optional)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → Frontend JavaScript captures user interaction
2. **API Call** → Frontend makes HTTP request to Node.js backend (`/api/*`)
3. **Authentication** → JWT middleware validates user token
4. **Authorization** → Role-based middleware checks permissions
5. **Business Logic** → Controller processes request
6. **Database Query** → Supabase client executes PostgreSQL query
7. **Response** → JSON data returned to frontend
8. **UI Update** → Frontend renders updated data

### Why This Architecture?

- **Separation of Concerns**: Frontend, backend, and database are clearly separated
- **Microservices Approach**: Python service handles PDF processing independently
- **Scalability**: Each service can be scaled independently
- **Maintainability**: Clear boundaries make code easier to understand and modify
- **Technology Flexibility**: Right tool for each job (Node.js for API, Python for PDF processing)

---

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript**: Vanilla JavaScript (no frameworks) for simplicity and performance
- **Why**: Lightweight, fast, no build step required, easy to understand and modify

### Backend (Node.js)
- **Express.js**: Web framework for REST API
- **Supabase JS SDK**: PostgreSQL client with built-in REST API
- **JWT (jsonwebtoken)**: Stateless authentication tokens
- **Multer**: File upload handling
- **Google Generative AI**: Gemini API for chatbot
- **Why Node.js**: JavaScript everywhere, large ecosystem, async/await for I/O operations

### Python Service
- **Flask**: Lightweight web framework
- **pdfminer.six**: PDF text extraction library
- **Flask-CORS**: Cross-origin resource sharing
- **Why Python**: Excellent libraries for PDF processing, regex pattern matching

### Database
- **Supabase (PostgreSQL)**: Cloud-hosted relational database
- **Why Supabase**: Free tier, automatic backups, built-in REST API, real-time subscriptions (future)

### External Services
- **Google Maps API**: Distance Matrix & Geocoding for transport calculations
- **Google Gemini API**: AI chatbot with context awareness

---

## 💡 Core Concepts & Implementation

### 1. Authentication & Authorization

**Concept**: JWT-based stateless authentication with role-based access control (RBAC)

**Implementation**:

```javascript
// Middleware: backend/middleware/auth.js
exports.protect = async (req, res, next) => {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Verify JWT signature
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // 3. Fetch user from database
  const user = await supabase.from('users').select('*').eq('id', decoded.id);
  
  // 4. Attach user to request object
  req.user = user;
  next();
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
```

**Why JWT?**: 
- Stateless: No server-side session storage needed
- Scalable: Works across multiple servers
- Secure: Signed tokens prevent tampering
- Portable: Token contains user info

### 2. Duplicate Detection with Fuzzy Matching

**Concept**: Prevent duplicate entries using string similarity algorithms

**Implementation**:

```javascript
// Algorithm: Levenshtein Distance
function levenshteinDistance(str1, str2) {
  // Calculate minimum edits needed to transform str1 to str2
  const matrix = [];
  // ... dynamic programming approach
  return matrix[m][n];
}

// Fuzzy match score (0-1)
function fuzzyMatch(str1, str2) {
  const normalized1 = normalizeText(str1); // lowercase, trim spaces
  const normalized2 = normalizeText(str2);
  
  if (normalized1 === normalized2) return 1.0; // Exact match
  
  // Check substring match
  if (normalized1.includes(normalized2)) return 0.9;
  
  // Calculate similarity from Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - (distance / maxLength);
  
  return similarity;
}

// Usage: Check if order is duplicate
if (fuzzyMatch(newManufacturer, existingManufacturer) >= 0.85 &&
    fuzzyMatch(newProduct, existingProduct) >= 0.85) {
  // Show warning to user
}
```

**Why Fuzzy Matching?**: 
- Handles typos and variations ("ABC Corp" vs "ABC Corporation")
- 85% threshold balances accuracy vs false positives
- Normalization handles case/whitespace differences

### 3. PDF Data Extraction

**Concept**: Extract structured data from unstructured PDF invoices

**Implementation Flow**:

```
PDF Upload → Python Service → Text Extraction → Regex Pattern Matching → Structured Data
```

```python
# python_service/app.py
def extract_manufacturer(text, normalized_text):
    patterns = [
        r"Manufacturer[: ]+(.+)",
        r"Mfr[: ]+(.+)",
        r"Vendor[: ]+(.+)",
        # ... more patterns
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return clean_extracted_value(match.group(1))
    return None
```

**Why Regex?**: 
- Fast pattern matching
- Handles various invoice formats
- Keyword-based detection for common products
- Fallback to manual entry if extraction fails

### 4. Transport Cost Calculation

**Concept**: Calculate shipping costs based on distance between locations

**Implementation**:

```javascript
// Frontend: scripts/transport.js
async function calculateTransportCost(from, to) {
  // 1. Geocode addresses to coordinates
  const fromCoords = await geocodeAddress(from);
  const toCoords = await geocodeAddress(to);
  
  // 2. Calculate distance using Google Maps Distance Matrix API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    `origins=${fromCoords}&destinations=${toCoords}&key=${API_KEY}`
  );
  
  const data = await response.json();
  const distanceKm = data.rows[0].elements[0].distance.value / 1000;
  
  // 3. Calculate cost (₹10 per km)
  const transportCost = distanceKm * 10;
  
  return transportCost;
}
```

**Why Google Maps API?**: 
- Accurate distance calculations
- Handles real-world routes (not straight-line)
- Geocoding validates addresses
- Real-time traffic data (optional)

### 5. AI Chatbot with Context Awareness

**Concept**: Database-aware chatbot using Google Gemini API

**Implementation**:

```javascript
// backend/controllers/chatbotController.js

// 1. Rate Limiting (in-memory Map)
const requestTracker = new Map();
function checkRateLimit(userId) {
  const userRequests = requestTracker.get(userId) || { requests: [] };
  // Check if user exceeded 10 requests per minute
  if (userRequests.requests.length >= 10) {
    return { allowed: false, message: 'Rate limit exceeded' };
  }
  return { allowed: true };
}

// 2. Database Context Caching (5-minute TTL)
let cachedContext = null;
async function getDatabaseContext() {
  if (cachedContext && !isExpired()) {
    return cachedContext; // Return cached data
  }
  
  // Fetch fresh data from all tables
  const [products, manufacturers, orders, tasks] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('manufacturers').select('*'),
    // ... more queries
  ]);
  
  cachedContext = { products, manufacturers, orders, tasks };
  return cachedContext;
}

// 3. Generate Response
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const prompt = `You are YNM Safety Portal assistant. 
Database Context: ${JSON.stringify(dbContext)}
User Question: ${question}`;

const result = await model.generateContent(prompt);
const answer = result.response.text();
```

**Why This Approach?**: 
- **Rate Limiting**: Prevents API abuse and cost overruns
- **Context Caching**: Reduces database queries and API costs
- **Safety Filters**: Only answers relevant questions
- **Database Context**: Provides accurate, up-to-date information

### 6. Task Status History

**Concept**: Track complete history of task status changes

**Implementation**:

```javascript
// Database: JSONB column for flexible schema
status_history: [
  {
    status: "in_progress",
    update: "Started working on it",
    updated_at: "2024-01-15T10:30:00Z",
    updated_by: "employee_id"
  },
  {
    status: "completed",
    update: "Finished the task",
    updated_at: "2024-01-15T15:45:00Z",
    updated_by: "employee_id"
  }
]

// Update task status
async function updateTaskStatus(taskId, newStatus, updateText) {
  // 1. Get current task
  const task = await supabase.from('tasks').select('*').eq('id', taskId);
  
  // 2. Append to history
  const newHistoryEntry = {
    status: newStatus,
    update: updateText,
    updated_at: new Date().toISOString(),
    updated_by: req.user.id
  };
  
  const updatedHistory = [...task.status_history, newHistoryEntry];
  
  // 3. Update task
  await supabase.from('tasks').update({
    status: newStatus,
    status_history: updatedHistory
  }).eq('id', taskId);
}
```

**Why JSONB?**: 
- Flexible schema: Add fields without migrations
- Queryable: PostgreSQL can query JSONB efficiently
- Historical tracking: Complete audit trail
- Easy to extend: Add more metadata later

---

## 📁 Project Structure

```
YNM-purchase-portal/
│
├── frontend/
│   └── public/                    # Static files served by Express
│       ├── *.html                 # Page templates
│       ├── scripts/               # Frontend JavaScript
│       │   ├── api.js             # API client wrapper
│       │   ├── login.js           # Authentication logic
│       │   ├── products.js        # Product management
│       │   ├── orders.js          # Order management
│       │   ├── duplicateChecker.js # Fuzzy matching
│       │   └── ...
│       ├── styles/
│       │   └── styles.css         # Global styles
│       ├── config.js              # Environment-based API URLs
│       └── assets/                # CSV data files
│
├── backend/
│   ├── server.js                  # Express server entry point
│   ├── config/
│   │   └── supabase.js            # Database connection
│   ├── controllers/               # Business logic
│   │   ├── authController.js      # Login, register
│   │   ├── productController.js   # CRUD operations
│   │   ├── orderController.js     # Order management + duplicates
│   │   ├── chatbotController.js   # AI chatbot
│   │   └── ...
│   ├── routes/                    # API route definitions
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   └── validation.js          # Input validation
│   ├── uploads/                   # Temporary file storage
│   ├── seedSupabaseUsers.js       # Initial user creation
│   └── package.json
│
├── python_service/
│   ├── app.py                     # Flask PDF extraction service
│   ├── requirements.txt           # Python dependencies
│   ├── uploads/                   # Temporary PDF storage
│   └── venv/                     # Virtual environment
│
└── README.md
```

### Design Patterns Used

1. **MVC (Model-View-Controller)**: 
   - Model: Supabase database
   - View: HTML/CSS/JS frontend
   - Controller: Express route handlers

2. **Middleware Pattern**: Authentication, validation, CORS

3. **Repository Pattern**: Supabase client abstracts database access

4. **Service Layer**: Python service handles specialized PDF processing

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** (v14+): [Download](https://nodejs.org/)
- **Python 3** (v3.7+): [Download](https://www.python.org/)
- **Supabase Account**: [Sign up](https://supabase.com/) (free tier available)
- **Google Maps API Key**: [Get API Key](https://console.cloud.google.com/)
- **Google Gemini API Key**: [Get API Key](https://makersuite.google.com/app/apikey)

### Step 1: Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** → **New Query**
3. Run the following SQL to create tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subtypes TEXT[],
  unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Manufacturers table
CREATE TABLE manufacturers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  contact TEXT,
  products_offered TEXT[],
  prices JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  manufacturer VARCHAR(255) NOT NULL,
  product VARCHAR(255) NOT NULL,
  product_type VARCHAR(255),
  quantity INTEGER,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  transport_cost DECIMAL(10,2),
  product_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  date DATE,
  task_text TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  status_update TEXT,
  status_updated_at TIMESTAMP,
  employee_status VARCHAR(50),
  last_updated_on TIMESTAMP,
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  location_id VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);
```

### Step 2: Environment Configuration

Create `.env` file in `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=5002

# Python Service URL
PDF_SERVICE_URL=http://localhost:5001/extract-pdf

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

**Where to find Supabase credentials:**
- Dashboard → Project Settings → API
- **Project URL** = `SUPABASE_URL`
- **service_role key** (secret) = `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Install Dependencies

```bash
# Install Node.js dependencies
cd backend
npm install

# Install Python dependencies
cd ../python_service
pip3 install -r requirements.txt
```

### Step 4: Seed Initial Users

```bash
cd backend
node seedSupabaseUsers.js
```

This creates:
- **Admin** user (username: `Admin`, password: `Admin@RishuuNJain`)
- **Employee** user (username: `Harikanth`, password: `Employee@Harikanth`)

---

## 🏃 Running the Application

### Development Mode

You need to run **2 services** simultaneously:

**Terminal 1 - Node.js Backend:**
```bash
cd backend
npm start
```
Expected output:
```
✅ Supabase Connected Successfully
📊 Project URL: https://your-project-id.supabase.co
Server running on port 5002
```

**Terminal 2 - Python PDF Service:**
```bash
cd python_service
python3 app.py
```
Expected output:
```
 * Running on http://0.0.0.0:5001
 * Debug mode: on
```

### Access the Application

Open your browser: **http://localhost:5002**

The Node.js backend serves the frontend files automatically via Express static middleware.

### Login Credentials

- **Admin**: `Admin` / `Admin@RishuuNJain`
- **Employee**: `Harikanth` / `Employee@Harikanth`

---

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | Create new user | Admin only |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/employees` | List all employees | Admin only |

### Products Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | Yes |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/:id` | Update product | Yes |
| DELETE | `/api/products/:id` | Delete product | Yes |

### Orders Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders | Yes |
| POST | `/api/orders` | Create order (with duplicate check) | Yes |
| DELETE | `/api/orders/:id` | Delete order | Yes |

### Tasks Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/tasks` | Get all tasks | Yes | All |
| POST | `/api/tasks` | Create task | Yes | Admin |
| PUT | `/api/tasks/:id` | Update task | Yes | All |
| DELETE | `/api/tasks/:id` | Delete task | Yes | Admin |
| PUT | `/api/tasks/update-status/:id` | Update task status | Yes | Employee |

### PDF Extraction

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pdf/extract` | Extract data from PDF | Yes |

### Chatbot

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| POST | `/api/chatbot/ask` | Ask question to AI | Yes | 10/min |

---

## 🎨 Key Features Explained

### 1. Duplicate Detection System

**How it works:**
1. User submits form (product/manufacturer/order)
2. Frontend calls duplicate checker before submission
3. Fuzzy matching algorithm compares against existing records
4. If similarity ≥ 85%, show warning dialog
5. User can proceed or cancel

**Technical Details:**
- Uses Levenshtein distance algorithm
- Normalizes text (lowercase, trim spaces, remove punctuation)
- Multi-field matching for orders (manufacturer + product + location)
- Configurable threshold (currently 85%)

### 2. PDF Invoice Processing

**Workflow:**
1. User uploads PDF invoice
2. Frontend sends to Node.js backend (`/api/pdf/extract`)
3. Backend forwards to Python service (`http://localhost:5001/extract-pdf`)
4. Python service:
   - Extracts text using pdfminer.six
   - Applies regex patterns to find fields
   - Returns structured JSON
5. Frontend auto-fills form with extracted data

**Extracted Fields:**
- Manufacturer name
- Product name
- Product type/subtype
- Quantity
- From location
- To location

### 3. Transport Cost Calculator

**Process:**
1. User enters "from" and "to" locations
2. Frontend calls Google Maps Geocoding API to get coordinates
3. Calls Distance Matrix API to calculate route distance
4. Calculates cost: `distance (km) × ₹10`
5. Updates form automatically

**Features:**
- Real-time calculation
- Address validation via geocoding
- Error handling for invalid addresses
- Caching to reduce API calls

### 4. Task Management System

**Admin Flow:**
1. Admin creates task with description and assignee
2. Task saved with status "pending"
3. Employee receives notification (UI update)

**Employee Flow:**
1. Employee views assigned tasks
2. Updates status (in_progress, completed, etc.)
3. Adds status update text
4. System appends to `status_history` JSONB array
5. Admin can view complete history

**Status History Example:**
```json
[
  {
    "status": "pending",
    "update": "Task assigned",
    "updated_at": "2024-01-15T09:00:00Z",
    "updated_by": 1
  },
  {
    "status": "in_progress",
    "update": "Started working on it",
    "updated_at": "2024-01-15T10:30:00Z",
    "updated_by": 2
  }
]
```

### 5. AI Chatbot

**Features:**
- **Rate Limiting**: 10 requests per minute per user
- **Context Caching**: Database context refreshed every 5 minutes
- **Safety Filters**: Only answers questions about YNM Safety Portal
- **Database Awareness**: Has access to products, manufacturers, orders, tasks

**Example Interaction:**
```
User: "What products do we have?"
Bot: "Based on the database, you have the following products:
      - W Beam Crash Barrier
      - Thrie Beam
      - Hot Thermoplastic Paint
      ..."
```

---

## 📊 Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Authentication | id, username, password, role |
| `products` | Product catalog | id, name, subtypes, unit |
| `manufacturers` | Supplier info | id, name, location, contact |
| `orders` | Purchase orders | id, manufacturer, product, quantity, costs |
| `tasks` | Task assignments | id, assigned_to, status, status_history |
| `locations` | Location data | id, city, state, coordinates |

### Relationships

- `tasks.assigned_to` → `users.id` (Foreign Key)
- `tasks.assigned_by` → `users.id` (Foreign Key)

### Data Types

- **SERIAL**: Auto-incrementing integer (primary keys)
- **VARCHAR**: Variable-length strings
- **TEXT**: Unlimited text
- **JSONB**: JSON data with indexing support (for `status_history`, `prices`)
- **DECIMAL**: Precise decimal numbers (for costs)
- **TIMESTAMP**: Date and time

---

## 🔐 Security & Authentication

### JWT Token Flow

1. **Login**: User submits credentials
2. **Validation**: Backend checks username/password
3. **Token Generation**: JWT created with user ID and role
4. **Token Storage**: Frontend stores in `localStorage`
5. **Request Headers**: Token sent as `Authorization: Bearer <token>`
6. **Verification**: Middleware validates token on each request

### Security Measures

- **Password Storage**: Plain text (as per requirements - not recommended for production)
- **JWT Expiration**: 7 days (configurable via `JWT_EXPIRE`)
- **CORS Protection**: Whitelisted origins only
- **Rate Limiting**: Chatbot API limited to prevent abuse
- **Input Validation**: Both client-side and server-side validation
- **SQL Injection Protection**: Supabase client uses parameterized queries

### Role-Based Access Control

- **Admin**: Full access (create users, manage tasks, view all data)
- **Employee**: Limited access (update own tasks, manage products/orders)

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: "Supabase configuration missing"**
- Check `.env` file exists in `backend/` directory
- Verify variable names are exact: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- No spaces around `=` sign

**Error: "Port 5002 already in use"**
```bash
lsof -ti:5002 | xargs kill -9
```

**Error: "Table doesn't exist"**
- Run SQL migration in Supabase SQL Editor
- Check table names match (snake_case)

### Python Service Issues

**Error: "Module not found"**
```bash
cd python_service
pip3 install -r requirements.txt
```

**Error: "Port 5001 already in use"**
```bash
lsof -ti:5001 | xargs kill -9
```

### Frontend Issues

**Can't connect to backend**
- Verify backend is running on port 5002
- Check browser console for CORS errors
- Verify `config.js` has correct API URL

**PDF upload not working**
- Ensure Python service is running on port 5001
- Check `PDF_SERVICE_URL` in backend `.env`

### Database Issues

**Login fails**
- Run `node seedSupabaseUsers.js` to create users
- Verify passwords match (case-sensitive)
- Check Supabase Table Editor for user records

---

## 📝 Development Notes

### Code Style

- **JavaScript**: ES6+ (async/await, arrow functions, destructuring)
- **Python**: PEP 8 style guide
- **Naming**: camelCase for JavaScript, snake_case for database

### Best Practices

1. **Error Handling**: Try-catch blocks with meaningful error messages
2. **Validation**: Always validate input on both client and server
3. **Logging**: Console logs for debugging (consider proper logging library for production)
4. **Environment Variables**: Never commit `.env` files
5. **API Design**: RESTful conventions, consistent response format

### Future Improvements

- [ ] Add unit tests
- [ ] Implement proper password hashing (bcrypt)
- [ ] Add database migrations system
- [ ] Implement real-time updates (Supabase Realtime)
- [ ] Add file upload progress indicators
- [ ] Implement search functionality
- [ ] Add data export (CSV/Excel)
- [ ] Mobile-responsive improvements
- [ ] Add dark mode
- [ ] Implement proper logging system

---

## 📄 License

ISC

---

## 🤝 Contributing

This is a private project for YNM Safety Pvt. Ltd. For questions or issues, contact the development team.

---

**Built with ❤️ for YNM Safety Portal**
