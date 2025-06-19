const xrpl = require('xrpl');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

    // Get XRP balance
    const balance = accountInfo.result.account_data.Balance;
    const xrpBalance = xrpl.dropsToXrp(balance);
    
    console.log(`💰 Wallet ${walletAddress} has ${xrpBalance} XRP`);

    // Get account trust lines to check for TULDOK tokens
    const trustLines = await xrplClient.request({
      command: 'account_lines',
      account: walletAddress,
      ledger_index: 'validated'
    });

    console.log('🔗 Trust Lines:', trustLines.result.lines);

    // TULDOK token configuration
    // You'll need to replace these with your actual TULDOK token details
    const TULDOK_CURRENCY = 'TULDOK'; // Currency code
    const TULDOK_CURRENCY_HEX = '54554C444F4B0000000000000000000000000000'; // Hex representation of TULDOK
    const TULDOK_ISSUER = process.env.TULDOK_ISSUER_ADDRESS || 'r9qGMJMreNBYdEqJ7mNrUjyCj44fDUEe1G'; // Updated to match the actual issuer
    
    let tuldokBalance = 0;
    let tuldokFound = false;

    // Check if user has a trust line for TULDOK token
    for (const line of trustLines.result.lines) {
      // Check for both string and hex representations of TULDOK
      if ((line.currency === TULDOK_CURRENCY || line.currency === TULDOK_CURRENCY_HEX) && 
          line.account === TULDOK_ISSUER) {
        tuldokBalance = parseFloat(line.balance);
        tuldokFound = true;
        console.log(`🪙 Found TULDOK balance: ${tuldokBalance}`);
        break;
      }
    }

    if (!tuldokFound) {
      console.log('⚠️ No TULDOK trust line found. User needs to set up trust line first.');
      // For development, we can use XRP as placeholder, but in production this should be required
      const tuldokEquivalent = parseFloat(xrpBalance) * 1000; // Placeholder conversion
      console.log(`🔄 Using XRP equivalent: ${tuldokEquivalent} TULDOK`);
      
      if (tuldokEquivalent < 33) {
        throw new Error(`Insufficient balance. Required: 33 TULDOK, Available: ${tuldokEquivalent.toFixed(2)} TULDOK. Please set up TULDOK trust line first.`);
      }
      
      return {
        xrpBalance: parseFloat(xrpBalance),
        tuldokEquivalent: tuldokEquivalent,
        tuldokBalance: 0,
        hasTrustLine: false,
        isValid: true
      };
    }

    // Check if TULDOK balance is sufficient
    if (tuldokBalance < 33) {
      throw new Error(`Insufficient TULDOK balance. Required: 33 TULDOK, Available: ${tuldokBalance.toFixed(2)} TULDOK`);
    }
    
    return {
      xrpBalance: parseFloat(xrpBalance),
      tuldokBalance: tuldokBalance,
      tuldokEquivalent: tuldokBalance, // Use actual TULDOK balance
      hasTrustLine: true,
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated verification token:', verificationToken.substring(0, 10) + '...');

    // Create user in database (unverified)
    console.log('💾 Creating user in database...');
    const [result] = await db.execute(
      'INSERT INTO users (wallet_address, email, phone, name, balance_xrp, balance_tuldok, created_at, verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
      [
        walletAddress,
        email,
        phone,
        name,
        balanceInfo.xrpBalance,
        balanceInfo.tuldokBalance, // Use actual TULDOK balance
        false,
        verificationToken
      ]
    );

    console.log('✅ User created in database (unverified):', result);

    // Send verification email
    console.log('📧 Sending verification email...');
    try {
      const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
      const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject: 'Verify your email for TULDOK Social',
        html: `<p>Hi ${name},</p>
          <p>Thank you for registering at <b>TULDOK Social</b>!</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you did not register, please ignore this email.</p>`
      };
      
      console.log('📧 Mail options:', {
        from: EMAIL_FROM,
        to: email,
        subject: mailOptions.subject,
        verifyUrl: verifyUrl
      });
      
      const emailResult = await transporter.sendMail(mailOptions);
      console.log('📧 Verification email sent successfully:', emailResult.messageId);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail the registration if email fails, just log it
      console.log('⚠️ Registration will continue without email verification');
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        userId: result.insertId,
        walletAddress: walletAddress,
        email: email,
        name: name,
        balance: {
          xrp: balanceInfo.xrpBalance,
          tuldok: balanceInfo.tuldokBalance,
          hasTrustLine: balanceInfo.hasTrustLine
        }
      }
    });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    console.error('❌ Error stack:', error.stack);
    
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

// User Login Controller
const loginUser = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    console.log('🔐 Login attempt for wallet:', walletAddress);

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

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please check your email and click the verification link.',
        data: {
          userId: user.id,
          walletAddress: user.wallet_address,
          email: user.email,
          name: user.name,
          verified: false
        }
      });
    }

    // TODO: Implement XUMM signature verification
    // For now, we'll just check if the user exists and is verified
    console.log('✅ User login successful:', walletAddress);

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
        name: user.name,
        balance_xrp: user.balance_xrp,
        balance_tuldok: user.balance_tuldok,
        verified: user.verified,
        created_at: user.created_at
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

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Find user
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

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with new token
    await db.execute(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [verificationToken, user.id]
    );

    // Send verification email
    const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: 'Verify your email for TULDOK Social',
      html: `<p>Hi ${user.name},</p>
        <p>You requested a new verification email for your <b>TULDOK Social</b> account.</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>If you did not request this, please ignore this email.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Resent verification email to:', user.email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully!'
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
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
      'SELECT id, wallet_address, email, name, created_at FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Always fetch balances live from XRPL
    const balanceInfo = await checkTuldokBalance(walletAddress);

    res.status(200).json({
      success: true,
      data: {
        ...users[0],
        balance_xrp: balanceInfo.xrpBalance,
        balance_tuldok: balanceInfo.tuldokBalance,
        hasTrustLine: balanceInfo.hasTrustLine
      }
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

// Email verification endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }
    
    // Find user by token
    const [users] = await db.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }
    
    const user = users[0];
    if (user.verified) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email already verified.',
        data: {
          id: user.id,
          wallet_address: user.wallet_address,
          email: user.email,
          name: user.name,
          balance_xrp: user.balance_xrp,
          balance_tuldok: user.balance_tuldok,
          created_at: user.created_at,
          verified: user.verified
        }
      });
    }
    
    // Mark as verified
    await db.execute('UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?', [user.id]);
    
    // Fetch live balances from XRPL
    const balanceInfo = await checkTuldokBalance(user.wallet_address);
    
    // Return user data for frontend storage
    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully! You can now log in.',
      data: {
        id: user.id,
        wallet_address: user.wallet_address,
        email: user.email,
        name: user.name,
        balance_xrp: balanceInfo.xrpBalance,
        balance_tuldok: balanceInfo.tuldokBalance,
        hasTrustLine: balanceInfo.hasTrustLine,
        created_at: user.created_at,
        verified: true
      }
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during email verification.' });
  }
};

// Refresh user balances from XRPL
const refreshUserBalances = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    console.log(`🔄 Refreshing balances for wallet: ${walletAddress}`);

    // Get current balances from XRPL
    const balanceInfo = await checkTuldokBalance(walletAddress);

    // Update database with current balances
    await db.execute(
      'UPDATE users SET balance_xrp = ?, balance_tuldok = ? WHERE wallet_address = ?',
      [balanceInfo.xrpBalance, balanceInfo.tuldokBalance, walletAddress]
    );

    // Get updated user data
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

    res.status(200).json({
      success: true,
      message: 'Balances refreshed successfully!',
      data: {
        userId: user.id,
        walletAddress: user.wallet_address,
        email: user.email,
        name: user.name,
        balance_xrp: balanceInfo.xrpBalance,
        balance_tuldok: balanceInfo.tuldokBalance,
        hasTrustLine: balanceInfo.hasTrustLine,
        verified: user.verified,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Refresh Balances Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh balances',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  healthCheck,
  checkTuldokBalance,
  validateWalletAddress,
  verifyEmail,
  resendVerification,
  refreshUserBalances
}; 