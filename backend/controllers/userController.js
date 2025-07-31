const xrpl = require('xrpl');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { XummSdk } = require('xumm-sdk');

// Initialize XUMM SDK lazily to ensure environment variables are loaded
let xumm = null;
const getXummSdk = () => {
  if (!xumm) {
    if (!process.env.XUMM_API_KEY || !process.env.XUMM_API_SECRET) {
      throw new Error('XUMM_API_KEY and XUMM_API_SECRET must be set in environment variables');
    }
    xumm = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);
  }
  return xumm;
};

// XRPL Client instance
let client = null;

// Initialize XRPL client
const initializeXRPLClient = async () => {
  try {
    if (!client) {
      const xrplUrl = process.env.XRPL_NODE_URL || 'wss://xrplcluster.com';
      console.log('🔗 Connecting to XRPL node:', xrplUrl);
      
      // Validate URL format
      if (!xrplUrl.startsWith('wss://') && !xrplUrl.startsWith('ws://')) {
        throw new Error(`Invalid XRPL URL format: ${xrplUrl}. Must start with wss:// or ws://`);
      }
      
      client = new xrpl.Client(xrplUrl);
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

    // Check XRPL wallet balance (with fallback)
    console.log('💰 Checking wallet balance...');
    let balanceInfo;
    try {
      balanceInfo = await checkTuldokBalance(walletAddress);
      
      if (!balanceInfo.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance for registration'
        });
      }
    } catch (error) {
      console.error('❌ Balance Check Error:', error);
      console.log('⚠️ Using fallback balance check for registration');
      
      // Fallback: Allow registration with default values
      balanceInfo = {
        xrpBalance: 0,
        tuldokBalance: 0,
        hasTrustLine: false,
        isValid: true
      };
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
    console.log('🔍 Backend - Login user data from database:', user);
    console.log('🔍 Backend - Login verification status:', user.verified, 'Type:', typeof user.verified);

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please check your email and click the verification link.',
        data: {
          userId: user.id,
          wallet_address: user.wallet_address,
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
        wallet_address: user.wallet_address,
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
        wallet_address: user.wallet_address,
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
      'SELECT id, wallet_address, email, name, verified, created_at FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    console.log('🔍 Backend - Raw user data from database:', user);
    console.log('🔍 Backend - Verification status:', user.verified, 'Type:', typeof user.verified);

    // Always fetch balances live from XRPL
    const balanceInfo = await checkTuldokBalance(walletAddress);

    res.status(200).json({
      success: true,
      data: {
        ...user,
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
        verified: user.verified
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
        wallet_address: user.wallet_address,
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

// Verify TULDOK payment and mark user as verified
const verifyPayment = async (req, res) => {
  try {
    const { token, txHash } = req.body;
    if (!token || !txHash) {
      return res.status(400).json({ success: false, message: 'Missing token or transaction hash.' });
    }
    // Find user by verification token
    const [users] = await db.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired verification token.' });
    }
    const user = users[0];
    if (user.verified) {
      return res.status(400).json({ success: false, message: 'User already verified.' });
    }
    // Check transaction on XRPL
    const xrplClient = await initializeXRPLClient();
    const tx = await xrplClient.request({ command: 'tx', transaction: txHash });
    if (!tx.result || tx.result.TransactionType !== 'Payment' || tx.result.meta.TransactionResult !== 'tesSUCCESS') {
      return res.status(400).json({ success: false, message: 'Transaction not found or not successful.' });
    }
    // Check payment details
    const issuer = process.env.TULDOK_ISSUER_ADDRESS;
    const tuldokCurrency = '54554C444F4B0000000000000000000000000000'; // 40-char hex for TULDOK
    const deliveredAmount = tx.result.meta.delivered_amount || tx.result.Amount;
    const isTuldok = typeof deliveredAmount === 'object' && deliveredAmount.currency === tuldokCurrency && deliveredAmount.issuer === issuer && parseFloat(deliveredAmount.value) >= 33;
    const isFromUser = tx.result.Account === user.wallet_address;
    const isToIssuer = (deliveredAmount.issuer === issuer || tx.result.Destination === issuer);
    if (!isTuldok || !isFromUser || !isToIssuer) {
      return res.status(400).json({ success: false, message: 'Payment does not match required details.' });
    }
    // Mark user as verified and store tx hash
    await db.execute('UPDATE users SET verified = 1, verification_tx_hash = ? WHERE id = ?', [txHash, user.id]);
    return res.json({ success: true, message: 'Payment verified and user marked as verified.' });
  } catch (error) {
    console.error('❌ Payment Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed.', error: error.message });
  }
};

// Create Xumm payload for TULDOK payment
const createXummPayload = async (req, res) => {
  try {
    const { walletAddress, token } = req.body;

    // 1. Validate inputs
    if (!walletAddress || !token) {
      return res.status(400).json({ success: false, message: 'Missing wallet address or token' });
    }

    // 2. Find user by verification token
    const [users] = await db.execute('SELECT * FROM users WHERE verification_token = ? AND verified = 0', [token]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired verification token.' });
    }
    const user = users[0];

    // 3. Create Xumm Payload
    const TULDOK_AMOUNT = '33'; // Amount in TULDOK
    const TULDOK_CURRENCY_HEX = '54554C444F4B0000000000000000000000000000';
    const TULDOK_ISSUER = process.env.TULDOK_ISSUER_ADDRESS;

    if (!TULDOK_ISSUER) {
      console.error('TULDOK_ISSUER_ADDRESS is not set in .env');
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Account: user.wallet_address,
        Destination: TULDOK_ISSUER, // Pay to the issuer
        Amount: {
          currency: TULDOK_CURRENCY_HEX,
          value: TULDOK_AMOUNT,
          issuer: TULDOK_ISSUER,
        },
      },
      custom_meta: {
        identifier: `user_verification_${user.id}`,
        blob: {
          userId: user.id,
          token: token
        }
      }
    };

    console.log('Creating Xumm payload:', JSON.stringify(payload, null, 2));

    const createdPayload = await getXummSdk().payload.create(payload);

    console.log('✅ Xumm payload created:', createdPayload);
    
    // 4. Return payload details to frontend
    res.json({
      success: true,
      uuid: createdPayload.uuid,
      refs: createdPayload.refs,
    });

  } catch (error) {
    console.error('❌ Error creating Xumm payload:', error);
    // Log the full error if it's from Xumm
    if (error.response && error.response.data) {
      console.error('Xumm API Error:', error.response.data);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create payment payload.',
        error: error.response.data
      });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getPayloadStatus = async (req, res) => {
  const { uuid } = req.params;
  const { token } = req.query; // Pass token to re-associate user

  try {
    console.log(`👂 Subscribing to payload ${uuid}`);

    const subscription = await getXummSdk().payload.subscribe(uuid, event => {
      console.log(`🔔 Payload event for ${uuid}:`, event.data);

      if (event.data.signed === true) {
        console.log(`✅ Payload ${uuid} signed!`);
        return {
          signed: true,
          txid: event.data.txid
        };
      }

      if (event.data.signed === false) {
        console.log(`❌ Payload ${uuid} was rejected.`);
        return {
            signed: false
        };
      }
    });

    // The promise `subscription.resolved` will resolve when the subscription ends
    // (by returning a value from the callback)
    const result = await subscription.resolved;

    if (result && result.signed) {
        // If signed, proceed to verify the payment on the XRPL
        console.log(`Verifying transaction ${result.txid} for payload ${uuid}`);
        const verificationResult = await internalVerifyPayment(token, result.txid);

        if (verificationResult.success) {
            res.json({ success: true, message: 'Payment verified and account activated!' });
        } else {
            res.status(400).json({ success: false, message: verificationResult.message });
        }
    } else {
      // If rejected or cancelled
      res.status(400).json({ success: false, message: 'Payment was not approved.' });
    }

  } catch (error) {
    console.error(`Error with payload subscription ${uuid}:`, error);
     if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: 'Payment session not found or expired.' });
    }
    res.status(500).json({ success: false, message: 'Error checking payment status.' });
  }
};

// This is an internal function, not exposed as a route
const internalVerifyPayment = async (token, txHash) => {
    if (!token || !txHash) {
        return { success: false, message: 'Token and transaction hash are required.' };
    }

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE verification_token = ? AND verified = 0', [token]);
        if (users.length === 0) {
            return { success: false, message: 'Invalid or expired verification token.' };
        }
        const user = users[0];
        
        // You could add a step here to verify the transaction details on the XRPL
        // For now, we trust the Xumm payload result

        await db.execute('UPDATE users SET verified = 1, verification_tx_hash = ?, verified_at = NOW() WHERE id = ?', [txHash, user.id]);

        console.log(`✅ User ${user.id} verified with tx ${txHash}`);
        return { success: true };
    } catch (error) {
        console.error(`Failed to verify payment for token ${token}:`, error);
        return { success: false, message: 'Database error during verification.' };
    }
};

// Test endpoint to check user verification status
const testUserVerification = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XRPL wallet address'
      });
    }

    console.log(`🔍 Testing verification for wallet: ${walletAddress}`);

    // Direct database query to check verification status
    const [users] = await db.execute(
      'SELECT id, wallet_address, email, name, verified, created_at FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const user = users[0];
    
    res.status(200).json({
      success: true,
      message: 'Database verification check',
      data: {
        wallet_address: user.wallet_address,
        email: user.email,
        name: user.name,
        verified: user.verified,
        verified_type: typeof user.verified,
        verified_boolean: Boolean(user.verified),
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Test verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
};

// Create Xumm payload for sending tokens
const createSendTokenPayload = async (req, res) => {
  try {
    const { 
      senderAddress, 
      recipientAddress, 
      recipientName, 
      tokenType, 
      amount, 
      memo, 
      destinationTag, 
      fee 
    } = req.body;

    // 1. Validate inputs
    if (!senderAddress || !recipientAddress || !tokenType || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: senderAddress, recipientAddress, tokenType, amount' 
      });
    }

    // 2. Validate wallet addresses
    if (!validateWalletAddress(senderAddress) || !validateWalletAddress(recipientAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid wallet address format' 
      });
    }

    // 3. Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // 4. Create Xumm Payload based on token type
    let payload;

    if (tokenType === 'XRP') {
      // XRP payment
      const amountInDrops = Math.floor(numAmount * 1000000); // Convert to drops
      
      payload = {
        txjson: {
          TransactionType: 'Payment',
          Account: senderAddress,
          Destination: recipientAddress,
          Amount: amountInDrops.toString(),
          Fee: fee || '12'
        }
      };
    } else if (tokenType === 'TULDOK') {
      // TULDOK token payment
      const TULDOK_CURRENCY_HEX = '54554C444F4B0000000000000000000000000000';
      const TULDOK_ISSUER = process.env.TULDOK_ISSUER_ADDRESS;

      if (!TULDOK_ISSUER) {
        console.error('TULDOK_ISSUER_ADDRESS is not set in .env');
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error.' 
        });
      }

      payload = {
        txjson: {
          TransactionType: 'Payment',
          Account: senderAddress,
          Destination: recipientAddress,
          Amount: {
            currency: TULDOK_CURRENCY_HEX,
            value: amount,
            issuer: TULDOK_ISSUER,
          },
          Fee: fee || '12'
        }
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token type. Supported: XRP, TULDOK' 
      });
    }

    // 5. Add optional fields
    if (memo) {
      payload.txjson.Memos = [{
        Memo: {
          MemoData: Buffer.from(memo).toString('hex'),
          MemoType: Buffer.from('text/plain').toString('hex')
        }
      }];
    }

    if (destinationTag) {
      payload.txjson.DestinationTag = parseInt(destinationTag);
    }

    // 6. Add custom metadata
    payload.custom_meta = {
      identifier: `send_token_${Date.now()}`,
      blob: {
        senderAddress,
        recipientAddress,
        recipientName,
        tokenType,
        amount,
        memo,
        destinationTag,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Creating send token Xumm payload:', JSON.stringify(payload, null, 2));

    const createdPayload = await getXummSdk().payload.create(payload);

    console.log('✅ Send token Xumm payload created:', createdPayload);
    
    // 7. Return payload details to frontend
    res.json({
      success: true,
      uuid: createdPayload.uuid,
      refs: createdPayload.refs,
    });

  } catch (error) {
    console.error('❌ Error creating send token Xumm payload:', error);
    // Log the full error if it's from Xumm
    if (error.response && error.response.data) {
      console.error('Xumm API Error:', error.response.data);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create send token payload.',
        error: error.response.data
      });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
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
  refreshUserBalances,
  verifyPayment,
  createXummPayload,
  getPayloadStatus,
  internalVerifyPayment,
  testUserVerification,
  createSendTokenPayload,
}; 