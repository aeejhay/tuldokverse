const xrpl = require('xrpl');
const bcrypt = require('bcryptjs');
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

// Check XRPL wallet balance for TULDOK token
const checkTuldokBalance = async (walletAddress) => {
  try {
    const xrplClient = await initializeXRPLClient();
    
    // Get account info
    const accountInfo = await xrplClient.request({
      command: 'account_info',
      account: walletAddress,
      ledger_index: 'validated'
    });

    console.log('📊 Account Info:', accountInfo.result.account_data);

    // Check for TULDOK token balance
    // Note: TULDOK token would need to be issued on XRPL
    // For now, we'll check XRP balance as a placeholder
    const balance = accountInfo.result.account_data.Balance;
    const xrpBalance = xrpl.dropsToXrp(balance);
    
    console.log(`💰 Wallet ${walletAddress} has ${xrpBalance} XRP`);
    
    // Convert XRP to TULDOK equivalent (placeholder logic)
    // In real implementation, you'd check actual TULDOK token balance
    const tuldokEquivalent = parseFloat(xrpBalance) * 1000; // Placeholder conversion
    
    if (tuldokEquivalent < 33) {
      throw new Error(`Insufficient balance. Required: 33 TULDOK, Available: ${tuldokEquivalent.toFixed(2)} TULDOK`);
    }
    
    return {
      xrpBalance: parseFloat(xrpBalance),
      tuldokEquivalent: tuldokEquivalent,
      isValid: true
    };
  } catch (error) {
    console.error('❌ Balance Check Error:', error);
    throw error;
  }
};

// Validate XRPL wallet address
const validateWalletAddress = (address) => {
  try {
    return xrpl.isValidClassicAddress(address);
  } catch (error) {
    return false;
  }
};

// User Registration Controller
const registerUser = async (req, res) => {
  try {
    console.log('📝 Registration request received:', {
      walletAddress: req.body.walletAddress,
      email: req.body.email,
      name: req.body.name
    });

    const { walletAddress, email, phone, name } = req.body;

    // Input validation
    if (!walletAddress || !email || !phone || !name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: walletAddress, email, phone, name'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    console.log(`🔍 Validating wallet: ${walletAddress}`);

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE wallet_address = ? OR email = ?',
      [walletAddress, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this wallet address or email already exists'
      });
    }

    // Check XRPL wallet balance
    console.log('💰 Checking wallet balance...');
    const balanceInfo = await checkTuldokBalance(walletAddress);
    
    if (!balanceInfo.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance for registration'
      });
    }

    // Create user in database
    const [result] = await db.execute(
      'INSERT INTO users (wallet_address, email, phone, name, balance_xrp, balance_tuldok, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [
        walletAddress,
        email,
        phone,
        name,
        balanceInfo.xrpBalance,
        balanceInfo.tuldokEquivalent
      ]
    );

    console.log('✅ User created in database:', result);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        walletAddress: walletAddress,
        email: email 
      },
      process.env.JWT_SECRET || 'tuldok-secret-key',
      { expiresIn: '7d' }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully! Welcome to TULDOK Social! 🎉',
      data: {
        userId: result.insertId,
        walletAddress: walletAddress,
        email: email,
        name: name,
        balance: {
          xrp: balanceInfo.xrpBalance,
          tuldok: balanceInfo.tuldokEquivalent
        }
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Account not found')) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address not found on XRPL. Please check the address and try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Login Controller (placeholder for XUMM integration)
const loginUser = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address and signature are required'
      });
    }

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    // Find user in database
    const [users] = await db.execute(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    const user = users[0];

    // TODO: Implement XUMM signature verification
    // For now, we'll just check if the user exists
    console.log('🔐 User login attempt:', walletAddress);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        walletAddress: user.wallet_address,
        email: user.email 
      },
      process.env.JWT_SECRET || 'tuldok-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        userId: user.id,
        walletAddress: user.wallet_address,
        email: user.email,
        name: user.name
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    const [users] = await db.execute(
      'SELECT id, wallet_address, email, name, balance_xrp, balance_tuldok, created_at FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('❌ Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    res.status(200).json({
      success: true,
      message: 'TULDOK Social Backend is healthy! 🚀',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        xrpl: 'ready'
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  healthCheck,
  checkTuldokBalance,
  validateWalletAddress
}; 