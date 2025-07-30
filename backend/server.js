require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const initializeDatabase = require('./config/initDb');

// Import routes
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// CORS configuration for frontend integration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://tuldokverse.vercel.app',
      'https://tuldokverse.vercel.app/',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      // TEMPORARY: Allow all origins for debugging
      console.log('⚠️ Temporarily allowing blocked origin for debugging');
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// DEBUG: Check if environment variables are loaded correctly
console.log("🔧 Environment Check:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "Not set");
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "***" : "Using default");
console.log("XRPL_NODE_URL:", process.env.XRPL_NODE_URL || "Using default");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "http://localhost:3000");

// API Routes - Register immediately
console.log('🔧 Registering API routes...');
app.use('/api', userRoutes);
console.log('✅ User routes registered');
app.use('/api', postRoutes);
console.log('✅ Post routes registered');

// Debug endpoint to test route registration
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Routes are registered',
    availableRoutes: [
      'GET /api/health',
      'POST /api/register',
      'POST /api/login',
      'GET /api/profile/:walletAddress',
      'POST /api/refresh-balances/:walletAddress',
      'GET /api/verify-email',
      'POST /api/resend-verification'
    ],
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Test login endpoint (simple version)
app.post('/api/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint is reachable',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// List all registered routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    message: 'All registered routes',
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TULDOK Social Backend Running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cors: {
      frontendUrl: process.env.FRONTEND_URL,
      allowedOrigins: ['https://tuldokverse.vercel.app', 'http://localhost:3000']
    },
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login',
        profile: 'GET /api/profile/:walletAddress'
      },
      posts: {
        create: 'POST /api/post',
        userPosts: 'GET /api/posts/:walletAddress',
        allPosts: 'GET /api/posts'
      }
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  // Start server immediately, then try database
  app.listen(PORT, () => {
    console.log(`🚀 TULDOK Social Backend Server started on port ${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
  
  // Try database connection in background
  try {
    // Test DB connection
    await db.execute('SELECT 1');
    console.log('💾 Database Connected Successfully!');
    
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database initialization completed!');

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('⚠️ Server running without database connection');
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
