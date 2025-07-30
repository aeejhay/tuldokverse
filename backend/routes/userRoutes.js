const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  healthCheck,
  verifyEmail,
  resendVerification,
  refreshUserBalances,
  verifyPayment,
  createXummPayload,
  getPayloadStatus,
  testUserVerification,
  createSendTokenPayload
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

// Verify TULDOK payment - POST /api/verify-payment
router.post('/verify-payment', verifyPayment);

// Create Xumm payload for TULDOK payment - POST /api/create-xumm-payload
router.post('/create-xumm-payload', createXummPayload);

// Create Xumm payload for sending tokens - POST /api/create-send-token-payload
router.post('/create-send-token-payload', createSendTokenPayload);

// Get Xumm payload status - GET /api/payload-status/:uuid
router.get('/payload-status/:uuid', getPayloadStatus);

// Test user verification status - GET /api/test-verification/:walletAddress
router.get('/test-verification/:walletAddress', testUserVerification);

module.exports = router; 