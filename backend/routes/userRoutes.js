const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  healthCheck,
  verifyEmail,
  resendVerification,
  refreshUserBalances
} = require('../controllers/userController');

// Health check - GET /api/health
router.get('/health', healthCheck);

// Email verification - GET /api/verify-email
router.get('/verify-email', verifyEmail);

// User Registration - POST /api/register
router.post('/register', registerUser);

// User Login - POST /api/login
router.post('/login', loginUser);

// Resend verification email - POST /api/resend-verification
router.post('/resend-verification', resendVerification);

// Get User Profile - GET /api/profile/:walletAddress
router.get('/profile/:walletAddress', getUserProfile);

// Refresh User Balances - POST /api/refresh-balances/:walletAddress
router.post('/refresh-balances/:walletAddress', refreshUserBalances);

module.exports = router; 