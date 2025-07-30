const xrpl = require('xrpl');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// XRPL Client instance
let client = null;

// Initialize XRPL client
const initializeXRPLClient = async () => {
  try {
    if (!client) {
      client = new xrpl.Client(process.env.XRPL_NODE_URL || 'wss://xrplcluster.com');
      await client.connect();
      console.log('🔗 XRPL Client Connected!');
    }
    return client;
  } catch (error) {
    console.error('❌ XRPL Client Connection Error:', error);
    throw error;
  }
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuldok-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Burn 1 TULDOK via XRPL transaction
const burnTuldokToken = async (walletAddress, postContent) => {
  try {
    const xrplClient = await initializeXRPLClient();
    
    // For now, we'll simulate burning by sending a small amount to a burn address
    // In real implementation, you'd use actual TULDOK token burning logic
    
    // Create a transaction to "burn" 1 TULDOK equivalent
    const burnAmount = xrpl.xrpToDrops(0.001); // Small XRP amount as placeholder
    
    // Use a known burn address (this is just for demonstration)
    const burnAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
    
    const transactionBlob = {
      TransactionType: 'Payment',
      Account: walletAddress,
      Destination: burnAddress,
      Amount: burnAmount,
      Memos: [{
        MemoType: xrpl.convertStringToHex('text/plain'),
        MemoData: xrpl.convertStringToHex(postContent.substring(0, 280))
      }]
    };

    console.log('🔥 Burning TULDOK for post:', postContent.substring(0, 50) + '...');
    
    // Note: In a real implementation, you'd need the user's private key or use XUMM SDK
    // For now, we'll simulate the transaction
    const simulatedTx = {
      hash: 'simulated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      validated: true,
      ledger_index: Math.floor(Math.random() * 1000000) + 80000000
    };
    
    console.log('✅ Simulated transaction:', simulatedTx);
    
    return {
      success: true,
      transactionHash: simulatedTx.hash,
      ledgerIndex: simulatedTx.ledger_index,
      amount: burnAmount
    };
    
  } catch (error) {
    console.error('❌ Burn Transaction Error:', error);
    throw error;
  }
};

// Create Post Controller
const createPost = async (req, res) => {
  try {
    // Verify user authentication
    verifyToken(req, res, async () => {
      const { content } = req.body;
      const { walletAddress } = req.user;

      // Input validation
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Post content is required'
        });
      }

      if (content.length > 280) {
        return res.status(400).json({
          success: false,
          message: 'Post content cannot exceed 280 characters'
        });
      }

      console.log(`📝 Creating post for wallet: ${walletAddress}`);

      // Check if user exists and has sufficient balance
      const [users] = await db.execute(
        'SELECT * FROM users WHERE wallet_address = ?',
        [walletAddress]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = users[0];
      
      // Check if user has sufficient TULDOK balance
      if (user.balance_tuldok < 1) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient TULDOK balance. Need at least 1 TULDOK to create a post.'
        });
      }

      // Burn 1 TULDOK via XRPL transaction
      console.log('🔥 Initiating TULDOK burn transaction...');
      const burnResult = await burnTuldokToken(walletAddress, content);

      if (!burnResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process TULDOK burn transaction'
        });
      }

      // Create post in database
      const [result] = await db.execute(
        'INSERT INTO posts (user_id, wallet_address, content, transaction_hash, ledger_index, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          user.id,
          walletAddress,
          content,
          burnResult.transactionHash,
          burnResult.ledgerIndex
        ]
      );

      // Update user's TULDOK balance
      await db.execute(
        'UPDATE users SET balance_tuldok = balance_tuldok - 1 WHERE wallet_address = ?',
        [walletAddress]
      );

      console.log('✅ Post created successfully:', result);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Post created successfully! 1 TULDOK burned.',
        data: {
          postId: result.insertId,
          content: content,
          transactionHash: burnResult.transactionHash,
          ledgerIndex: burnResult.ledgerIndex,
          ledgerUrl: `https://livenet.xrpl.org/transactions/${burnResult.transactionHash}`,
          remainingBalance: user.balance_tuldok - 1
        }
      });
    });

  } catch (error) {
    console.error('❌ Create Post Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during post creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get User Posts Controller
const getUserPosts = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Validate wallet address
    if (!xrpl.isValidClassicAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    console.log(`📖 Fetching posts for wallet: ${walletAddress}`);

    // Get posts from database
    const [posts] = await db.execute(
      `SELECT 
        p.id,
        p.content,
        p.transaction_hash,
        p.ledger_index,
        p.created_at,
        u.name as author_name,
        u.wallet_address
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.wallet_address = ?
      ORDER BY p.created_at DESC`,
      [walletAddress]
    );

    // Format posts with ledger URLs
    const formattedPosts = posts.map(post => ({
      ...post,
      ledgerUrl: `https://livenet.xrpl.org/transactions/${post.transaction_hash}`,
      created_at: new Date(post.created_at).toISOString()
    }));

    res.status(200).json({
      success: true,
      data: {
        walletAddress: walletAddress,
        totalPosts: formattedPosts.length,
        posts: formattedPosts
      }
    });

  } catch (error) {
    console.error('❌ Get Posts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Posts (Feed) Controller
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`📖 Fetching all posts - Page: ${page}, Limit: ${limit}`);

    // Get posts from database with pagination
    const [posts] = await db.execute(
      `SELECT 
        p.id,
        p.content,
        p.transaction_hash,
        p.ledger_index,
        p.created_at,
        u.name as author_name,
        u.wallet_address
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM posts');
    const totalPosts = countResult[0].total;

    // Format posts with ledger URLs
    const formattedPosts = posts.map(post => ({
      ...post,
      ledgerUrl: `https://livenet.xrpl.org/transactions/${post.transaction_hash}`,
      created_at: new Date(post.created_at).toISOString()
    }));

    res.status(200).json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts: totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get All Posts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPost,
  getUserPosts,
  getAllPosts,
  verifyToken
}; 