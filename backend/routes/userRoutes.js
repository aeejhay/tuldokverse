const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile 
} = require('../controllers/userController');

// User Registration - POST /api/register
router.post('/register', registerUser);

// User Login - POST /api/login
router.post('/login', loginUser);

// Get User Profile - GET /api/profile/:wallet_address
router.get('/profile/:walletAddress', getUserProfile);

module.exports = router; 