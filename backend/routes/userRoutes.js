const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  healthCheck
} = require('../controllers/userController');

// Health check - GET /api/health
router.get('/health', healthCheck);

// User Registration - POST /api/register
router.post('/register', registerUser);

// User Login - POST /api/login
router.post('/login', loginUser);

// Get User Profile - GET /api/profile/:walletAddress
router.get('/profile/:walletAddress', getUserProfile);

module.exports = router; 