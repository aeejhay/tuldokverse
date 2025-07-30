import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to migrate and validate user data
const migrateUserData = (userData) => {
  try {
    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    
    if (!user.wallet_address && user.walletAddress) {
      console.log('🔄 Migrating walletAddress to wallet_address');
      user.wallet_address = user.walletAddress;
      delete user.walletAddress;
      localStorage.setItem('tuldokUser', JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error migrating user data:', error);
    return null;
  }
};

// Helper function to validate XRPL address
const isValidXRPLAddress = (address) => {
  return /^r[a-zA-Z0-9]{25,34}$/.test(address);
};

// Helper function to validate amount
const isValidAmount = (amount, tokenType) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  
  if (tokenType === 'XRP') {
    // XRP has 6 decimal places, minimum 0.000001
    return num >= 0.000001 && num <= 1000000000;
  } else {
    // TULDOK can have more decimal places
    return num > 0;
  }
};

const SendTokenPage = () => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({ xrp: 0, tuldok: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasTrustLine, setHasTrustLine] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    tokenType: 'XRP',
    recipientName: '',
    recipientAddress: '',
    amount: '',
    memo: '',
    destinationTag: '',
    fee: '12', // Default XRPL fee in drops
  });
  
  // UI states
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Preview, 3: QR
  const [formErrors, setFormErrors] = useState({});
  const [transactionData, setTransactionData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('tuldokUser');
    if (userData) {
      const user = migrateUserData(userData);
      if (!user || !user.wallet_address) {
        setError('Invalid user data. Please login again.');
        setLoading(false);
        return;
      }
      setUser(user);
      fetchBalances(user.wallet_address);
    } else {
      setError('No user data found. Please login first.');
      setLoading(false);
    }
  }, []);

  const fetchBalances = async (walletAddress) => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/profile/${walletAddress}`);
      const data = await res.json();
      if (res.ok) {
        setBalances({
          xrp: parseFloat(data.data.balance_xrp || 0),
          tuldok: parseFloat(data.data.balance_tuldok || 0),
        });
        setUser(data.data);
        setHasTrustLine(data.data.hasTrustLine || false);
        localStorage.setItem('tuldokUser', JSON.stringify(data.data));
      } else {
        throw new Error(data.message || 'Failed to fetch balances');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (user) {
      try {
        setRefreshing(true);
        const res = await fetch(`${API_URL}/refresh-balances/${user.wallet_address}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setBalances({
            xrp: parseFloat(data.data.balance_xrp || 0),
            tuldok: parseFloat(data.data.balance_tuldok || 0),
          });
          setUser(data.data);
          setHasTrustLine(data.data.hasTrustLine || false);
          localStorage.setItem('tuldokUser', JSON.stringify(data.data));
          setError('');
        } else {
          throw new Error(data.message || 'Failed to refresh balances');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate recipient name
    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Recipient name is required';
    }
    
    // Validate recipient address
    if (!formData.recipientAddress.trim()) {
      errors.recipientAddress = 'Recipient address is required';
    } else if (!isValidXRPLAddress(formData.recipientAddress)) {
      errors.recipientAddress = 'Invalid XRPL address format';
    }
    
    // Validate amount
    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else if (!isValidAmount(formData.amount, formData.tokenType)) {
      errors.amount = `Invalid amount. ${formData.tokenType === 'XRP' ? 'Minimum 0.000001 XRP' : 'Must be greater than 0'}`;
    }
    
    // Check if user has sufficient balance
    const amount = parseFloat(formData.amount);
    if (formData.tokenType === 'XRP') {
      const totalNeeded = amount + (parseInt(formData.fee) / 1000000); // Convert drops to XRP
      if (totalNeeded > balances.xrp) {
        errors.amount = `Insufficient XRP balance. You need ${totalNeeded.toFixed(6)} XRP (including fee)`;
      }
    } else {
      if (amount > balances.tuldok) {
        errors.amount = `Insufficient TULDOK balance. You have ${balances.tuldok.toFixed(2)} TULDOK`;
      }
      if (!hasTrustLine) {
        errors.tokenType = 'Trust line required for TULDOK transactions';
      }
    }
    
    // Validate destination tag (optional but if provided, must be numeric)
    if (formData.destinationTag && !/^\d+$/.test(formData.destinationTag)) {
      errors.destinationTag = 'Destination tag must be a number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      const transaction = {
        ...formData,
        senderAddress: user.wallet_address,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        estimatedFee: formData.tokenType === 'XRP' ? 
          `${(parseInt(formData.fee) / 1000000).toFixed(6)} XRP` : 
          '12 drops (paid in XRP)'
      };
      setTransactionData(transaction);
      setCurrentStep(2);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep(1);
    setTransactionData(null);
  };

  const generateQRCode = async () => {
    try {
      // Submit transaction data to backend to create Xaman payload
      const res = await fetch(`${API_URL}/create-send-token-payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: user.wallet_address,
          recipientAddress: formData.recipientAddress,
          recipientName: formData.recipientName,
          tokenType: formData.tokenType,
          amount: formData.amount,
          memo: formData.memo,
          destinationTag: formData.destinationTag,
          fee: formData.fee
        })
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        setQrCodeData({
          qrUrl: data.refs.qr_png,
          payloadUuid: data.uuid,
          paymentLink: data.refs.websocket_status,
          transactionData: {
            senderAddress: user.wallet_address,
            recipientAddress: formData.recipientAddress,
            recipientName: formData.recipientName,
            tokenType: formData.tokenType,
            amount: formData.amount,
            memo: formData.memo,
            destinationTag: formData.destinationTag,
            fee: formData.fee
          }
        });
        setCurrentStep(3);
      } else {
        throw new Error(data.message || 'Failed to create Xaman payload');
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      setError('Failed to generate QR code: ' + err.message);
    }
  };

  const handleBackToPreview = () => {
    setCurrentStep(2);
    setQrCodeData(null);
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Layout currentPage="send-token">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Send Token...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="send-token">
        <div className="dashboard-container">
          <div className="error-message">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.href = '/login'} className="primary-button">
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="send-token">
      {/* Top bar */}
      <div className="topbar">
        <div className="balances">
          <span>🪙 TULDOK: {balances.tuldok.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span>💠 XRP: {balances.xrp.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh Balances">
            {refreshing ? '🔄' : '🔄'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="main-feed">
        <div className="send-token-container">
          {/* Header */}
          <div className="send-token-header">
            <h1>💸 Send Tokens</h1>
            <p>Send XRP or TULDOK tokens to any XRPL address</p>
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Transaction Details</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Preview</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Approve with Xaman</div>
            </div>
          </div>

          {/* Step 1: Transaction Form */}
          {currentStep === 1 && (
            <div className="transaction-form">
              <div className="form-section">
                <h3>Token Selection</h3>
                <div className="token-selection">
                  <label className={`token-option ${formData.tokenType === 'XRP' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tokenType"
                      value="XRP"
                      checked={formData.tokenType === 'XRP'}
                      onChange={(e) => handleInputChange('tokenType', e.target.value)}
                    />
                    <div className="token-info">
                      <div className="token-icon">💠</div>
                      <div className="token-details">
                        <strong>XRP</strong>
                        <span>Available: {balances.xrp.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`token-option ${formData.tokenType === 'TULDOK' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tokenType"
                      value="TULDOK"
                      checked={formData.tokenType === 'TULDOK'}
                      onChange={(e) => handleInputChange('tokenType', e.target.value)}
                    />
                    <div className="token-info">
                      <div className="token-icon">🪙</div>
                      <div className="token-details">
                        <strong>TULDOK</strong>
                        <span>Available: {balances.tuldok.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        {!hasTrustLine && <span className="trust-line-warning">⚠️ Trust line required</span>}
                      </div>
                    </div>
                  </label>
                </div>
                {formErrors.tokenType && <div className="error-text">{formErrors.tokenType}</div>}
              </div>

              <div className="form-section">
                <h3>Recipient Information</h3>
                <div className="form-group">
                  <label>Recipient Name</label>
                  <input
                    type="text"
                    placeholder="Enter recipient name"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    className={formErrors.recipientName ? 'error' : ''}
                  />
                  {formErrors.recipientName && <div className="error-text">{formErrors.recipientName}</div>}
                </div>
                
                <div className="form-group">
                  <label>Recipient Address</label>
                  <input
                    type="text"
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={formData.recipientAddress}
                    onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                    className={formErrors.recipientAddress ? 'error' : ''}
                  />
                  {formErrors.recipientAddress && <div className="error-text">{formErrors.recipientAddress}</div>}
                </div>
              </div>

              <div className="form-section">
                <h3>Transaction Details</h3>
                <div className="form-group">
                  <label>Amount</label>
                  <div className="amount-input">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className={formErrors.amount ? 'error' : ''}
                      step={formData.tokenType === 'XRP' ? '0.000001' : '0.01'}
                    />
                    <span className="amount-unit">{formData.tokenType}</span>
                  </div>
                  {formErrors.amount && <div className="error-text">{formErrors.amount}</div>}
                </div>
                
                <div className="form-group">
                  <label>Memo (Optional)</label>
                  <textarea
                    placeholder="Add a memo to this transaction"
                    value={formData.memo}
                    onChange={(e) => handleInputChange('memo', e.target.value)}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Destination Tag (Optional)</label>
                  <input
                    type="number"
                    placeholder="Enter destination tag"
                    value={formData.destinationTag}
                    onChange={(e) => handleInputChange('destinationTag', e.target.value)}
                    className={formErrors.destinationTag ? 'error' : ''}
                  />
                  {formErrors.destinationTag && <div className="error-text">{formErrors.destinationTag}</div>}
                </div>
                
                <div className="form-group">
                  <label>Network Fee (Drops)</label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => handleInputChange('fee', e.target.value)}
                    min="12"
                    max="1000000"
                  />
                  <small>Default: 12 drops (0.000012 XRP)</small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="primary-button" 
                  onClick={handlePreview}
                  disabled={!formData.recipientName || !formData.recipientAddress || !formData.amount}
                >
                  Continue to Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Transaction Preview */}
          {currentStep === 2 && transactionData && (
            <div className="transaction-preview">
              <div className="preview-header">
                <h3>📋 Transaction Preview</h3>
                <p>Please review your transaction details before proceeding</p>
              </div>
              
              <div className="preview-content">
                <div className="preview-section">
                  <h4>Token Information</h4>
                  <div className="preview-item">
                    <span className="label">Token Type:</span>
                    <span className="value">{transactionData.tokenType}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Amount:</span>
                    <span className="value">{transactionData.amount} {transactionData.tokenType}</span>
                  </div>
                </div>
                
                <div className="preview-section">
                  <h4>Recipient Information</h4>
                  <div className="preview-item">
                    <span className="label">Name:</span>
                    <span className="value">{transactionData.recipientName}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Address:</span>
                    <span className="value">{formatWalletAddress(transactionData.recipientAddress)}</span>
                  </div>
                </div>
                
                <div className="preview-section">
                  <h4>Transaction Details</h4>
                  <div className="preview-item">
                    <span className="label">From:</span>
                    <span className="value">{formatWalletAddress(transactionData.senderAddress)}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Estimated Fee:</span>
                    <span className="value">{transactionData.estimatedFee}</span>
                  </div>
                  {transactionData.memo && (
                    <div className="preview-item">
                      <span className="label">Memo:</span>
                      <span className="value">{transactionData.memo}</span>
                    </div>
                  )}
                  {transactionData.destinationTag && (
                    <div className="preview-item">
                      <span className="label">Destination Tag:</span>
                      <span className="value">{transactionData.destinationTag}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="preview-actions">
                <button className="secondary-button" onClick={handleBackToForm}>
                  ← Back to Form
                </button>
                <button className="primary-button" onClick={generateQRCode}>
                  Generate QR Code
                </button>
              </div>
            </div>
          )}

          {/* Step 3: QR Code for Xaman */}
          {currentStep === 3 && qrCodeData && (
            <div className="qr-code-section">
              <div className="qr-header">
                <h3>📱 Approve with Xaman</h3>
                <p>Scan this QR code with your Xaman app to approve the transaction</p>
              </div>
              
              <div className="qr-content">
                <div className="qr-code-placeholder">
                  {qrCodeData.qrUrl ? (
                    <div className="qr-code-container">
                      <img 
                        src={qrCodeData.qrUrl} 
                        alt="QR Code for Xaman" 
                        className="qr-code-image"
                      />
                      <p>Scan the QR code with Xaman to approve the transaction</p>
                      <p>
                        <a 
                          href={qrCodeData.paymentLink?.replace('ws://', 'https://')} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="xaman-link"
                        >
                          Or click here to open in Xaman
                        </a>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="qr-icon">📱</div>
                      <p>Generating QR Code...</p>
                    </>
                  )}
                  <div className="transaction-summary">
                    <div className="summary-item">
                      <strong>Amount:</strong> {formData.amount} {formData.tokenType}
                    </div>
                    <div className="summary-item">
                      <strong>To:</strong> {formatWalletAddress(formData.recipientAddress)}
                    </div>
                    <div className="summary-item">
                      <strong>Fee:</strong> {(parseInt(formData.fee) / 1000000).toFixed(6)} XRP
                    </div>
                  </div>
                  <small>Transaction data is ready for Xaman approval</small>
                </div>
                
                <div className="xaman-instructions">
                  <h4>How to approve:</h4>
                  <ol>
                    <li>Open your Xaman app</li>
                    <li>Tap the QR code scanner</li>
                    <li>Scan the QR code above</li>
                    <li>Review the transaction details</li>
                    <li>Tap "Approve" to send</li>
                  </ol>
                  
                  <div className="manual-entry">
                    <h4>Manual Entry (Alternative)</h4>
                    <p>If QR scanning doesn't work, you can manually enter the transaction in Xaman:</p>
                    <div className="manual-data">
                      <strong>From:</strong> {formatWalletAddress(user?.wallet_address)}
                      <br />
                      <strong>To:</strong> {formatWalletAddress(formData.recipientAddress)}
                      <br />
                      <strong>Amount:</strong> {formData.amount} {formData.tokenType}
                      {formData.memo && (
                        <>
                          <br />
                          <strong>Memo:</strong> {formData.memo}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="qr-actions">
                <button className="secondary-button" onClick={handleBackToPreview}>
                  ← Back to Preview
                </button>
                <button className="primary-button" onClick={() => window.open('https://xaman.app', '_blank')}>
                  Download Xaman
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default SendTokenPage; 