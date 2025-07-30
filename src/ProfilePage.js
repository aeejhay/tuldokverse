import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to migrate and validate user data
const migrateUserData = (userData) => {
  try {
    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    
    // Check if wallet_address exists, if not try walletAddress (for backward compatibility)
    if (!user.wallet_address && user.walletAddress) {
      console.log('🔄 Migrating walletAddress to wallet_address');
      user.wallet_address = user.walletAddress;
      delete user.walletAddress;
      // Update localStorage with corrected data
      localStorage.setItem('tuldokUser', JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error migrating user data:', error);
    return null;
  }
};

// Helper function to check if user is verified (handles both boolean and numeric values)
const isUserVerified = (user) => {
  if (!user) return false;
  // Handle both boolean true/false and numeric 1/0 from database
  return Boolean(user.verified);
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({ xrp: 0, tuldok: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasTrustLine, setHasTrustLine] = useState(false);
  const [showNote, setShowNote] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('tuldokUser');
    console.log('🔍 ProfilePage - User data from localStorage:', userData);
    if (userData) {
      const user = migrateUserData(userData);
      console.log('🔍 ProfilePage - Parsed user object:', user);
      if (!user) {
        console.error('❌ ProfilePage - Failed to migrate user data');
        setError('Invalid user data. Please login again.');
        setLoading(false);
        return;
      }
      console.log('🔍 ProfilePage - wallet_address property:', user.wallet_address);
      if (!user.wallet_address) {
        console.error('❌ ProfilePage - No wallet_address found in user data');
        setError('No wallet address found. Please login again.');
        setLoading(false);
        return;
      }
      setUser(user);
      fetchProfile(user.wallet_address);
    } else {
      console.error('❌ ProfilePage - No user data found in localStorage');
      setError('No user data found. Please login first.');
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (walletAddress) => {
    try {
      console.log('🔍 ProfilePage - Fetching profile for wallet:', walletAddress);
      setRefreshing(true);
      const res = await fetch(`${API_URL}/profile/${walletAddress}`);
      const data = await res.json();
      console.log('🔍 ProfilePage - API response:', data);
      if (res.ok) {
        console.log('🔍 ProfilePage - User verification status:', data.data.verified, 'Type:', typeof data.data.verified);
        console.log('🔍 ProfilePage - Is user verified (helper):', isUserVerified(data.data));
        setBalances({
          xrp: parseFloat(data.data.balance_xrp || 0),
          tuldok: parseFloat(data.data.balance_tuldok || 0),
        });
        setUser(data.data);
        setHasTrustLine(data.data.hasTrustLine || false);
        localStorage.setItem('tuldokUser', JSON.stringify(data.data));
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('❌ ProfilePage - Fetch profile error:', err);
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

  // const handleLogout = () => {
  //   localStorage.removeItem('tuldokUser');
  //   window.location.href = '/';
  // };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Layout currentPage="profile">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="profile">
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
    <Layout currentPage="profile">
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
        {/* Animated Security Note */}
        {showNote && (
          <div className="security-note">
            <div className="security-note-header">
              <div className="security-icon">🔐</div>
              <div className="security-title">
                <h3>Secure Passwordless Authentication</h3>
                <p>Your security is our priority</p>
              </div>
              <button 
                className="close-note-btn" 
                onClick={() => setShowNote(false)}
                title="Dismiss this note"
              >
                ✕
              </button>
            </div>
            <div className="security-note-content">
              <div className="security-feature">
                <div className="feature-icon">📱</div>
                <div className="feature-text">
                  <strong>Xaman App Integration</strong>
                  <p>All transactions are signed and validated using your Xaman app for maximum security</p>
                </div>
              </div>
              <div className="security-feature">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <strong>No Passwords Required</strong>
                  <p>We don't store passwords because your wallet signature is your authentication</p>
                </div>
              </div>
              <div className="security-feature">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">
                  <strong>Instant Verification</strong>
                  <p>Every action is cryptographically verified on the XRPL blockchain</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-left">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="verification-badge">
                  {isUserVerified(user) ? '✅' : '⏳'}
                </div>
              </div>
              <div className="profile-info">
                <h1>{user?.name || 'User'}</h1>
                <p className="profile-email">{user?.email}</p>
                <p className="profile-wallet">
                  <span className="wallet-label">Wallet:</span> 
                  <code>{formatWalletAddress(user?.wallet_address)}</code>
                  <button 
                    className="copy-btn" 
                    onClick={() => navigator.clipboard.writeText(user?.wallet_address)}
                    title="Copy wallet address"
                  >
                    📋
                  </button>
                </p>
                <div className="profile-status">
                  <span className={`status-badge ${isUserVerified(user) ? 'verified' : 'pending'}`}>
                    {isUserVerified(user) ? 'Verified Account' : 'Pending Verification'}
                  </span>
                  {isUserVerified(user) && (
                    <span className="member-since">
                      Member since {formatDate(user?.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-right">
              <div className="balance-grid">
                <div className="balance-item">
                  <div className="balance-icon">💎</div>
                  <div className="balance-content">
                    <h3>XRP Balance</h3>
                    <p className="balance-value">{balances.xrp.toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP</p>
                    <p className="balance-label">Native XRPL Currency</p>
                  </div>
                </div>
                
                <div className="balance-item">
                  <div className="balance-icon">🪙</div>
                  <div className="balance-content">
                    <h3>TULDOK Balance</h3>
                    <p className="balance-value">{balances.tuldok.toLocaleString(undefined, { maximumFractionDigits: 2 })} TULDOK</p>
                    <p className="balance-label">Filipino Community Token</p>
                  </div>
                </div>
                
                <div className="balance-item">
                  <div className="balance-icon">🔗</div>
                  <div className="balance-content">
                    <h3>Trust Line</h3>
                    <p className="balance-value">{hasTrustLine ? 'Active' : 'Not Set'}</p>
                    <p className="balance-label">{hasTrustLine ? 'Can hold TULDOK tokens' : 'Required for TULDOK transactions'}</p>
                  </div>
                </div>
                
                <div className="balance-item">
                  <div className="balance-icon">📅</div>
                  <div className="balance-content">
                    <h3>Account Age</h3>
                    <p className="balance-value">
                      {user?.created_at ? 
                        Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0
                      } days
                    </p>
                    <p className="balance-label">Since {formatDate(user?.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="profile-actions">
            <h2>Account Actions</h2>
            <div className="action-grid">
              <button className="action-card" onClick={() => window.open('https://bithomp.com/paperwallet/', '_blank')}>
                <div className="action-icon">🏠</div>
                <h3>Create Your Paper Wallet</h3>
                <p>Create your paper wallet to store your TULDOK tokens</p>
              </button>
              
      
              
              <button className="action-card" onClick={() => window.open('https://livenet.xrpl.org/', '_blank')}>
                <div className="action-icon">🌐</div>
                <h3>XRPL Explorer</h3>
                <p>View your wallet on XRPL Explorer</p>
              </button>
              
              <button className="action-card" onClick={() => window.open('https://xaman.app', '_blank')}>
                <div className="action-icon">📱</div>
                <h3>Xaman App</h3>
                <p>Download or open Xaman wallet</p>
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="account-info">
            <h2>Account Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <p>{user?.name || 'Not provided'}</p>
              </div>
              
              <div className="info-item">
                <label>Email Address</label>
                <p>{user?.email || 'Not provided'}</p>
              </div>
              
              <div className="info-item">
                <label>Wallet Address</label>
                <p className="wallet-full">{user?.wallet_address || 'Not provided'}</p>
              </div>
              
              <div className="info-item">
                <label>Account Status</label>
                <p className={`status-text ${isUserVerified(user) ? 'verified' : 'pending'}`}>
                  {isUserVerified(user) ? '✅ Verified' : '⏳ Pending Verification'}
                </p>
              </div>
              
              <div className="info-item">
                <label>Registration Date</label>
                <p>{user?.created_at ? formatDate(user.created_at) : 'Not available'}</p>
              </div>
              
              <div className="info-item">
                <label>Last Updated</label>
                <p>{user?.updated_at ? formatDate(user.updated_at) : 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default ProfilePage; 