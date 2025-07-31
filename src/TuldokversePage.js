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

const TuldokversePage = () => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({ xrp: 0, tuldok: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    console.log('🚀 TuldokversePage component mounted');
    const userData = localStorage.getItem('tuldokUser');
    console.log('👤 User data from localStorage:', userData ? 'Found' : 'Not found');
    
    if (userData) {
      const user = migrateUserData(userData);
      if (!user || !user.wallet_address) {
        setError('Invalid user data. Please login again.');
        setLoading(false);
        return;
      }
      console.log('✅ User data valid, fetching data...');
      setUser(user);
      fetchBalances(user.wallet_address);
      fetchTuldokTransactions();
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

  const fetchTuldokTransactions = async () => {
    try {
      console.log('🔄 Fetching TULDOK transactions...');
      console.log('🌐 API URL:', `${API_URL}/tuldok-transactions?limit=20`);
      setTransactionsLoading(true);
      
      const res = await fetch(`${API_URL}/tuldok-transactions?limit=20`);
      console.log('📡 API Response status:', res.status);
      console.log('📡 API Response headers:', res.headers);
      
      const data = await res.json();
      console.log('📊 API Response data:', data);
      
      if (res.ok && data.success) {
        console.log('✅ Transactions fetched successfully:', data.data.transactions.length, 'transactions');
        console.log('📋 First transaction:', data.data.transactions[0]);
        setTransactions(data.data.transactions);
      } else {
        console.error('❌ Failed to fetch transactions:', data.message);
        console.error('❌ Response data:', data);
      }
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      console.error('❌ Error details:', err.message);
    } finally {
      setTransactionsLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="tuldokverse">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Tuldokverse...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="tuldokverse">
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
    <Layout currentPage="tuldokverse">
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
        

        <div className="welcome-card">
          <div className="welcome-header">
            <div className="admin-avatar">🌍</div>
            <div className="admin-info">
              <span className="admin-name">Tuldokverse</span>
              <span className="admin-title">The Filipino Blockchain Universe</span>
              <span className="post-time">Coming Soon</span>
            </div>
          </div>
          
          <div className="welcome-content">
            <div className="welcome-title">
              <h2>🌍 Welcome to Tuldokverse</h2>
              <div className="welcome-subtitle">The Future of Filipino Blockchain Innovation</div>
            </div>
            
            <div className="welcome-message">
              <p className="highlight-text">
                <strong>"Tuldokverse is where Filipino dreams meet blockchain reality."</strong>
              </p>
              
              <h3>🚀 What is Tuldokverse?</h3>
              
              <p>
                Tuldokverse is our vision for a comprehensive blockchain ecosystem designed 
                specifically for the Filipino community. It's more than just a cryptocurrency 
                - it's a complete digital universe where Filipinos can learn, earn, and grow 
                together in the blockchain space.
              </p>
              
              <div className="vision-box">
                <h4>🌟 Our Mission</h4>
                <p><strong>To democratize blockchain technology for every Filipino.</strong></p>
              </div>
              
              <h3>🎯 What's Coming Soon</h3>
              
              <div className="feature-grid">
                <div className="feature-item">
                  <div className="feature-icon">📚</div>
                  <div className="feature-content">
                    <h4>Blockchain Academy</h4>
                    <p>Learn blockchain technology through interactive courses, tutorials, and real-world projects.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">💸</div>
                  <div className="feature-content">
                    <h4>OFW Remittance Hub</h4>
                    <p>Send money home faster and cheaper using blockchain technology.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">🤝</div>
                  <div className="feature-content">
                    <h4>Community Marketplace</h4>
                    <p>Buy, sell, and trade goods and services within the Filipino community.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">🎮</div>
                  <div className="feature-content">
                    <h4>Play-to-Earn Games</h4>
                    <p>Earn TULDOK tokens while playing fun, Filipino-themed games.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">🏦</div>
                  <div className="feature-content">
                    <h4>DeFi Services</h4>
                    <p>Access decentralized financial services like lending, borrowing, and yield farming.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">🌐</div>
                  <div className="feature-content">
                    <h4>Social Network</h4>
                    <p>Connect with fellow Filipinos worldwide in a secure, blockchain-powered social platform.</p>
                  </div>
                </div>
              </div>

              {/* TULDOK Transactions Section */}
        <div className="transactions-card">
          <div className="transactions-header">
            <div className="transactions-title">
              <h3>📊 TULDOK Transaction History</h3>
              <p>Recent transactions from the TULDOK issuer wallet for transparency</p>
            </div>
            <button 
              className="refresh-btn" 
              onClick={fetchTuldokTransactions} 
              disabled={transactionsLoading}
              title="Refresh Transactions"
            >
              {transactionsLoading ? '🔄' : '🔄'}
            </button>
          </div>

          {transactionsLoading ? (
            <div className="loading-transactions">
              <div className="spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : (() => {
            console.log('🔍 Current transactions state:', transactions);
            console.log('🔍 Transactions length:', transactions.length);
            return transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((tx, index) => (
                <div key={tx.hash} className={`transaction-item ${tx.successful ? 'successful' : 'failed'}`}>
                  <div className="transaction-header">
                    <div className="transaction-type">
                      <span className="type-icon">
                        {tx.transaction_type === 'Payment' ? '💸' : '🔗'}
                      </span>
                      <span className="type-text">{tx.transaction_type}</span>
                    </div>
                    <div className="transaction-status">
                      {tx.successful ? (
                        <span className="status-success">✅ Success</span>
                      ) : (
                        <span className="status-failed">❌ Failed</span>
                      )}
                    </div>
                  </div>

                  <div className="transaction-details">
                    {tx.amount && (
                      <div className="transaction-amount">
                        <span className="amount-value">
                          {parseFloat(tx.amount).toLocaleString(undefined, { 
                            maximumFractionDigits: tx.currency === 'XRP' ? 6 : 2 
                          })}
                        </span>
                        <span className="amount-currency">{tx.currency}</span>
                      </div>
                    )}

                    <div className="transaction-addresses">
                      {tx.source && (
                        <div className="address-item">
                          <span className="address-label">From:</span>
                          <a 
                            href={tx.account_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="address-link"
                          >
                            {tx.source.slice(0, 8)}...{tx.source.slice(-8)}
                          </a>
                        </div>
                      )}
                      {tx.destination && (
                        <div className="address-item">
                          <span className="address-label">To:</span>
                          <a 
                            href={`https://livenet.xrpl.org/accounts/${tx.destination}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="address-link"
                          >
                            {tx.destination.slice(0, 8)}...{tx.destination.slice(-8)}
                          </a>
                        </div>
                      )}
                    </div>

                    {tx.memo && (
                      <div className="transaction-memo">
                        <span className="memo-label">Memo:</span>
                        <span className="memo-text">{tx.memo}</span>
                      </div>
                    )}

                    <div className="transaction-meta">
                      <div className="transaction-date">
                        {new Date(tx.date).toLocaleString()}
                      </div>
                      <div className="transaction-fee">
                        Fee: {tx.fee} XRP
                      </div>
                    </div>
                  </div>

                  <div className="transaction-actions">
                    <a 
                      href={tx.ledger_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-transaction-btn"
                    >
                      🔍 View on XRPL
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No transactions found</p>
            </div>
          );
        })()}
        </div>
              
              <div className="coming-soon-message">
                <h4>⏰ Coming Soon</h4>
                <p>
                  <strong>We're building the future, one block at a time.</strong> The Tuldokverse 
                  is under active development, and we can't wait to share it with you.
                </p>
                <p>
                  Stay tuned for updates, and be among the first to experience the future 
                  of Filipino blockchain innovation.
                </p>
              </div>
              
              <div className="join-community">
                <h4>🎯 Join the Community</h4>
                <p>
                  <strong>Be part of the revolution.</strong> Follow our progress, share your ideas, 
                  and help us build the Tuldokverse together.
                </p>
              </div>
            </div>
          </div>
          
          <div className="welcome-actions">
            <button className="action-btn primary" title="Join the waitlist">🚀 Join Waitlist</button>
            <button className="action-btn" title="Learn more">📚 Learn More</button>
            <button className="action-btn" title="Follow updates">🔔 Follow Updates</button>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default TuldokversePage; 