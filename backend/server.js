require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const initializeDatabase = require('./config/initDb');

// Import routes
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DEBUG: Check if environment variables are loaded correctly
console.log("🔧 Environment Check:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "Not set");
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "***" : "Using default");
console.log("XRPL_NODE_URL:", process.env.XRPL_NODE_URL || "Using default");

// Initialize database and start server
const startServer = async () => {
  try {
    // Test DB connection
    await db.execute('SELECT 1');
    console.log('💾 Database Connected Successfully!');
    
    // Initialize database tables
    await initializeDatabase();
    
    // API Routes
    app.use('/api', userRoutes);
    app.use('/api', postRoutes);

    // Health check endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'TULDOK Social Backend Running! 🚀',
        version: '1.0.0',
        endpoints: {
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
        message: 'Endpoint not found'
      });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 TULDOK Social Backend Server started on port ${PORT}`);
      console.log(`📡 API available at: http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/`);
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
