<p align="center">
  <h1 align="center">🛡️ YNM Safety Portal</h1>
  <p align="center">
    A comprehensive full-stack web application for managing safety products, manufacturers, orders, and task assignments.
    <br />
    <br />
    <a href="#features">Features</a>
    ·
    <a href="#quick-start">Quick Start</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    ·
    <a href="#api-documentation">API Docs</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
</p>

---

## 📖 About The Project

**YNM Safety Portal** is a business management system designed for YNM Safety Pvt. Ltd. to streamline operations across product management, supplier coordination, order processing, and team task management.

The application features an AI-powered chatbot, automatic PDF invoice processing, real-time transport cost calculations using Google Maps, and a comprehensive task management system with status tracking.

### 🎯 Key Highlights

- **Product Catalog** — Manage safety products with types, subtypes, and units
- **Supplier Management** — Track manufacturers with locations and contact details  
- **Smart Orders** — Create orders with automatic duplicate detection and cost calculations
- **Task System** — Admin-to-employee task delegation with complete status history
- **AI Assistant** — Database-aware chatbot powered by Google Gemini
- **PDF Processing** — Extract data from invoices automatically

---

## ✨ Features

<table>
  <tr>
    <td>
      <h3>📦 Product Management</h3>
      <ul>
        <li>Add, edit, delete products</li>
        <li>Manage product types & subtypes</li>
        <li>Track units and notes</li>
        <li>CSV data import support</li>
      </ul>
    </td>
    <td>
      <h3>🏭 Manufacturer Management</h3>
      <ul>
        <li>Supplier directory</li>
        <li>Location tracking</li>
        <li>Contact information</li>
        <li>Products & pricing per supplier</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📋 Order Processing</h3>
      <ul>
        <li>Create purchase orders</li>
        <li>Fuzzy duplicate detection (85% threshold)</li>
        <li>Auto transport cost calculation</li>
        <li>PDF invoice extraction</li>
      </ul>
    </td>
    <td>
      <h3>✅ Task Management</h3>
      <ul>
        <li>Admin assigns tasks to employees</li>
        <li>Status tracking (pending → completed)</li>
        <li>Complete status history (JSONB)</li>
        <li>Employee dashboard</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🤖 AI Chatbot</h3>
      <ul>
        <li>Powered by Google Gemini</li>
        <li>Database-aware responses</li>
        <li>Rate limiting (10 req/min)</li>
        <li>Context caching</li>
      </ul>
    </td>
    <td>
      <h3>🚚 Transport Calculator</h3>
      <ul>
        <li>Google Maps integration</li>
        <li>Real-time distance calculation</li>
        <li>Address validation</li>
        <li>Cost per km pricing</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| HTML5 / CSS3 | Structure & Styling |
| Vanilla JavaScript | Interactivity (no frameworks) |
| Google Maps API | Location & Distance |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | REST API Framework |
| JWT | Authentication |
| Multer | File Uploads |
| Google Generative AI | Chatbot (Gemini) |

### Database & Services
| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Cloud Database |
| Python / Flask | PDF Processing Service |
| pdfminer.six | PDF Text Extraction |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                          │
│              HTML/CSS/JavaScript (Vanilla)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                    NODE.JS BACKEND                           │
│                    Express.js (Port 5002)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth (JWT)  │  │ Controllers │  │ Routes              │  │
│  │ Middleware  │  │ & Logic     │  │ /api/*              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐    ┌─────────────────────────────────┐
│   PYTHON SERVICE      │    │         SUPABASE                │
│   Flask (Port 5001)   │    │   PostgreSQL Cloud Database     │
│   PDF Text Extraction │    │   - Users, Products, Orders     │
│                       │    │   - Manufacturers, Tasks        │
└───────────────────────┘    └─────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v14+ — [Download](https://nodejs.org/)
- **Python 3** v3.7+ — [Download](https://www.python.org/)
- **Supabase Account** — [Sign up (Free)](https://supabase.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/ynm-safety-portal.git
cd ynm-safety-portal
```

### 2️⃣ Set Up Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
PORT=5002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=your-secure-random-secret
JWT_EXPIRE=7d
GEMINI_API_KEY=your-gemini-api-key
```

### 3️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install

# Python Service
cd ../python_service
pip3 install -r requirements.txt
```

### 4️⃣ Set Up Database

Run this SQL in your [Supabase SQL Editor](https://supabase.com/dashboard):

<details>
<summary>📋 Click to expand SQL schema</summary>

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

</details>

### 5️⃣ Seed Initial Users

```bash
cd backend
node seedSupabaseUsers.js
```

### 6️⃣ Start the Application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
npm start
```

**Terminal 2 — Python Service:**
```bash
cd python_service
python3 app.py
```

### 7️⃣ Access the App

Open [http://localhost:5002](http://localhost:5002) in your browser.

**Default Credentials:**
| Role | Username | Password |
|------|----------|----------|
| Admin | `Admin` | `Admin@RishuuNJain` |
| Employee | `Harikanth` | `Employee@Harikanth` |

---

## 📁 Project Structure

```
ynm-safety-portal/
│
├── 📂 backend/                    # Node.js Express API
│   ├── server.js                  # Entry point
│   ├── config/
│   │   └── supabase.js            # Database connection
│   ├── controllers/               # Business logic
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── taskController.js
│   │   ├── manufacturerController.js
│   │   ├── chatbotController.js
│   │   └── pdfController.js
│   ├── routes/                    # API routes
│   ├── middleware/                # Auth & validation
│   └── .env.example               # Environment template
│
├── 📂 frontend/                   # Static HTML/CSS/JS
│   ├── *.html                     # Page templates
│   ├── config.js                  # API configuration
│   ├── scripts/                   # JavaScript modules
│   │   ├── api.js                 # API client
│   │   ├── login.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── tasks.js
│   │   └── duplicateChecker.js    # Fuzzy matching
│   ├── styles/
│   │   └── styles.css
│   └── assets/                    # CSV data files
│
├── 📂 python_service/             # Flask PDF Service
│   ├── app.py                     # PDF extraction logic
│   └── requirements.txt
│
├── 📄 README.md
├── 📄 SECURITY.md                 # Security guidelines
└── 📄 .gitignore
```

---

## 🔌 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | Create user (Admin) |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/auth/employees` | List employees (Admin) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get all orders |
| `POST` | `/api/orders` | Create order |
| `DELETE` | `/api/orders/:id` | Delete order |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create task (Admin) |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task (Admin) |
| `PUT` | `/api/tasks/update-status/:id` | Update status |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pdf/extract` | Extract PDF data |
| `POST` | `/api/chatbot/ask` | AI chatbot query |
| `GET` | `/api/health` | Health check |

---

## 🔐 Security

This project follows security best practices:

- ✅ Environment variables for all secrets
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin/Employee)
- ✅ Rate limiting on chatbot API
- ✅ Input validation (client & server)
- ✅ CORS protection
- ✅ `.env` files excluded from Git

> ⚠️ **Important:** See [SECURITY.md](SECURITY.md) for detailed security guidelines before deployment.

---

## 🚢 Deployment

The application includes Docker support for containerized deployment:

```bash
# Backend
cd backend
docker build -t ynm-backend .

# Frontend (Nginx)
cd frontend
docker build -t ynm-frontend .

# Python Service
cd python_service
docker build -t ynm-pdf-service .
```

**Supported Platforms:**
- Google Cloud Run (GCP)
- AWS ECS / Fargate
- Any Docker-compatible host

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the ISC License. See `LICENSE` for more information.

---

## 📧 Contact

**YNM Safety Pvt. Ltd.**

Project Link: [https://github.com/yourusername/ynm-safety-portal](https://github.com/yourusername/ynm-safety-portal)

---

<p align="center">
  Built with ❤️ for YNM Safety Pvt. Ltd.
</p>
