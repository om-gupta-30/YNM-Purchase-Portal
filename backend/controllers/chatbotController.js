const { supabase } = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.error('WARNING: GEMINI_API_KEY is not set in environment variables!');
}

// Rate limiting: Track requests per user (by IP or user ID)
const requestTracker = new Map();
const RATE_LIMIT = {
  maxRequests: 10, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
  cooldownMs: 5 * 60 * 1000 // 5 minute cooldown after limit exceeded
};

// Database context caching (refresh every 5 minutes)
let cachedContext = null;
let contextCacheTime = null;
const CONTEXT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Check rate limit
function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = requestTracker.get(identifier) || { requests: [], blockedUntil: null };

  // Check if user is in cooldown period
  if (userRequests.blockedUntil && now < userRequests.blockedUntil) {
    const remainingSeconds = Math.ceil((userRequests.blockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Rate limit exceeded. Please wait ${remainingSeconds} seconds before trying again.`
    };
  }

  // Clear old requests outside the window
  userRequests.requests = userRequests.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );

  // Check if limit exceeded
  if (userRequests.requests.length >= RATE_LIMIT.maxRequests) {
    userRequests.blockedUntil = now + RATE_LIMIT.cooldownMs;
    requestTracker.set(identifier, userRequests);
    return {
      allowed: false,
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT.maxRequests} requests per minute. Please wait ${RATE_LIMIT.cooldownMs / 1000} seconds.`
    };
  }

  // Add current request
  userRequests.requests.push(now);
  requestTracker.set(identifier, userRequests);

  return { allowed: true };
}

// Safety filter keywords - questions must contain at least one of these
const ALLOWED_KEYWORDS = [
  'product', 'products', 'manufacturer', 'manufacturers', 'company', 'companies',
  'order', 'orders', 'purchase', 'purchases', 'task', 'tasks', 'assignment',
  'transport', 'route', 'routes', 'location', 'locations', 'city', 'cities',
  'price', 'pricing', 'cost', 'costs', 'ynm', 'safety', 'portal', 'barrier',
  'crash', 'paint', 'thermoplastic', 'signage', 'signages', 'employee', 'admin',
  'quantity', 'delivery', 'shipment', 'supplier', 'suppliers'
];

// Check if question is related to YNM Safety Portal
function isQuestionRelevant(question) {
  if (!question || typeof question !== 'string') return false;
  
  const normalized = question.toLowerCase();
  return ALLOWED_KEYWORDS.some(keyword => normalized.includes(keyword));
}

// Fetch and summarize database data (with caching)
async function getDatabaseContext() {
  const now = Date.now();
  
  // Return cached context if still valid
  if (cachedContext && contextCacheTime && (now - contextCacheTime) < CONTEXT_CACHE_TTL) {
    console.log('Using cached database context');
    return cachedContext;
  }

  try {
    console.log('Fetching fresh database context...');
    
    const [manufacturersResult, productsResult, ordersResult, tasksResult, locationsResult] = await Promise.all([
      supabase.from('manufacturers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('locations').select('*')
    ]);

    const manufacturers = manufacturersResult.data || [];
    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const tasks = tasksResult.data || [];
    const locations = locationsResult.data || [];

    const contextData = {
      products: products.map(p => ({
        name: p.name,
        subtypes: p.subtypes,
        unit: p.unit,
        notes: p.notes
      })),
      manufacturers: manufacturers.map(m => ({
        name: m.name,
        location: m.location,
        contact: m.contact,
        productsOffered: m.products_offered || []
      })),
      orders: orders.map(o => ({
        manufacturer: o.manufacturer,
        product: o.product,
        productType: o.product_type,
        quantity: o.quantity,
        fromLocation: o.from_location,
        toLocation: o.to_location,
        transportCost: o.transport_cost,
        productCost: o.product_cost,
        totalCost: o.total_cost,
        createdAt: o.created_at
      })),
      tasks: tasks.map(t => ({
        taskText: t.task_text,
        assignedTo: t.assigned_to,
        date: t.date,
        status: t.status,
        statusUpdate: t.status_update || '',
        createdAt: t.created_at
      })),
      locations: locations.map(l => ({
        locationId: l.location_id,
        city: l.city,
        state: l.state,
        latitude: l.latitude,
        longitude: l.longitude
      }))
    };

    // Cache the context
    cachedContext = contextData;
    contextCacheTime = now;
    console.log('Database context cached');

    return contextData;
  } catch (error) {
    console.error('Error fetching database context:', error);
    // Return cached context if available, even if expired
    if (cachedContext) {
      console.log('Using expired cache due to error');
      return cachedContext;
    }
    return {
      products: [],
      manufacturers: [],
      orders: [],
      tasks: [],
      locations: []
    };
  }
}

// Main chatbot handler
exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        answer: 'Please provide a valid question.'
      });
    }

    const trimmedQuestion = question.trim();

    // Rate limiting: Use user ID if available, otherwise use IP address
    const userIdentifier = req.user?.id || req.ip || 'anonymous';
    const rateLimitCheck = checkRateLimit(userIdentifier);
    
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user: ${userIdentifier}`);
      return res.status(429).json({
        success: false,
        answer: rateLimitCheck.message
      });
    }

    // Safety filter - check if question is relevant
    if (!isQuestionRelevant(trimmedQuestion)) {
      return res.status(200).json({
        success: true,
        answer: 'I can only answer questions related to YNM Safety Portal data such as products, manufacturers, orders, tasks, and transport.'
      });
    }

    // Fetch database context
    const dbContext = await getDatabaseContext();
    
    // Limit context size to avoid token limits (reduced to save costs)
    const contextString = JSON.stringify(dbContext, null, 2);
    const maxContextLength = 4000; // Reduced from 8000 to 4000 to save tokens
    
    let finalContext = contextString;
    if (contextString.length > maxContextLength) {
      // Truncate if too large, but keep structure
      finalContext = contextString.substring(0, maxContextLength) + '... (truncated)';
      console.log(`Context truncated from ${contextString.length} to ${maxContextLength} characters`);
    }

    // Log usage for monitoring
    console.log(`[Chatbot] Request from ${userIdentifier}: "${trimmedQuestion.substring(0, 50)}..." | Context size: ${finalContext.length} chars`);

    // Create system prompt
    const systemPrompt = `You are the official AI assistant for YNM Safety Portal. 
You ONLY answer questions using the database information provided in the context below. 
DO NOT hallucinate any manufacturers, products, orders, or tasks that do not exist in the data.
If information is missing or not found in the context, say: "No matching data found in the system."
If the question is unrelated to YNM Safety Portal operations, politely refuse.
Always be helpful, concise, and accurate based on the provided data.

Database Context:
${finalContext}`;

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY || !genAI) {
      console.error('Gemini API key is missing!');
      return res.status(500).json({
        success: false,
        answer: 'AI service is not configured. Please contact the administrator.'
      });
    }

    // Call Gemini API
    try {
      console.log('Calling Gemini API with question:', trimmedQuestion.substring(0, 50) + '...');
      
      // Get the generative model (using gemini-1.5-flash for better performance)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Combine system prompt and user question for Gemini
      const fullPrompt = `${systemPrompt}\n\nUser Question: ${trimmedQuestion}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const answer = response.text() || 'Sorry, I could not generate a response.';
      
      console.log(`[Chatbot] Response received from Gemini`);

      res.status(200).json({
        success: true,
        answer: answer
      });

    } catch (geminiError) {
      // Log full error details for debugging
      console.error('=== Gemini API Error ===');
      console.error('Error message:', geminiError.message);
      console.error('Error status:', geminiError.status);
      console.error('Error code:', geminiError.code);
      console.error('Full error:', JSON.stringify(geminiError, null, 2));
      console.error('======================');
      
      // Handle API key errors
      if (geminiError.status === 401 || geminiError.status === 403 || 
          geminiError.message?.includes('API key') || 
          geminiError.message?.includes('authentication')) {
        return res.status(500).json({
          success: false,
          answer: 'AI service authentication failed. The API key may be invalid or expired. Please contact the administrator.'
        });
      }

      // Handle quota exceeded
      if (geminiError.status === 429 || 
          geminiError.message?.includes('quota') ||
          geminiError.message?.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          answer: 'The AI service quota has been exceeded or rate limit reached. Please try again later or contact the administrator.'
        });
      }

      // Handle network errors
      if (geminiError.code === 'ECONNREFUSED' || geminiError.code === 'ETIMEDOUT' || 
          geminiError.message?.includes('fetch failed') ||
          geminiError.message?.includes('network')) {
        return res.status(500).json({
          success: false,
          answer: 'Unable to connect to AI service. Please check your internet connection and try again.'
        });
      }

      // Handle content safety errors (Gemini-specific)
      if (geminiError.message?.includes('safety') || geminiError.message?.includes('blocked')) {
        return res.status(400).json({
          success: false,
          answer: 'The question was blocked by content safety filters. Please rephrase your question.'
        });
      }

      // Generic error
      const errorMsg = geminiError.message || 'Unknown error occurred';
      console.error('Returning generic error:', errorMsg);
      return res.status(500).json({
        success: false,
        answer: `Sorry, I encountered an error: ${errorMsg}. Please check the server logs for more details.`
      });
    }

  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.status(500).json({
      success: false,
      answer: 'Sorry, I encountered an error processing your question. Please try again.'
    });
  }
};

