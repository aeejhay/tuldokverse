const express = require('express');
const router = express.Router();
const { 
  createPost, 
  getUserPosts, 
  getAllPosts,
  verifyToken 
} = require('../controllers/postController');

// Create Post - POST /api/post (requires authentication)
router.post('/post', verifyToken, createPost);

// Get User Posts - GET /api/posts/:walletAddress
router.get('/posts/:walletAddress', getUserPosts);

// Get All Posts (Feed) - GET /api/posts
router.get('/posts', getAllPosts);

module.exports = router; 