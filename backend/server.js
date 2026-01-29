const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/supabase');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
// - Allow localhost/dev
// - Allow any Vercel preview/prod domain (*.vercel.app)
// - Optionally allow a specific origin via FRONTEND_ORIGIN env var
const allowedOrigins = new Set([
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5002",
  "http://127.0.0.1:5002"
]);

if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.add(process.env.FRONTEND_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, health checks)
    if (!origin) return callback(null, true);

    // Allow all Vercel preview/prod URLs
    if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return callback(null, true);

    // Allow explicit known origins
    if (allowedOrigins.has(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/manufacturers', require('./routes/manufacturers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Health check
app.get('/api/health', async (req, res) => {
  const { supabase } = require('./config/supabase');
  try {
    // Test query to verify connection
    const { error } = await supabase.from('users').select('count').limit(1);
    const dbStatus = error && error.code === 'PGRST116' ? 'tables_not_created' : 'connected';
    res.json({ 
      status: 'ok', 
      db: dbStatus 
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      db: 'error' 
    });
  }
});

const PORT = process.env.PORT || 5002;

// Connect to database BEFORE starting server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;

