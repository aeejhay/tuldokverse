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
// const isUserVerified = (user) => {
//   if (!user) return false;
//   // Handle both boolean true/false and numeric 1/0 from database
//   return Boolean(user.verified);
// };

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({ xrp: 0, tuldok: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // const [hasTrustLine, setHasTrustLine] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('tuldokUser');
    console.log('🔍 Dashboard - User data from localStorage:', userData);
    if (userData) {
      const user = migrateUserData(userData);
      console.log('🔍 Dashboard - Parsed user object:', user);
      if (!user) {
        console.error('❌ Dashboard - Failed to migrate user data');
        setError('Invalid user data. Please login again.');
        setLoading(false);
        return;
      }
      console.log('🔍 Dashboard - wallet_address property:', user.wallet_address);
      if (!user.wallet_address) {
        console.error('❌ Dashboard - No wallet_address found in user data');
        setError('No wallet address found. Please register or login again.');
        setLoading(false);
        return;
      }
      setUser(user);
      fetchBalances(user.wallet_address);
    } else {
      console.error('❌ Dashboard - No user data found in localStorage');
      setError('No user data found. Please register first.');
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
        // setHasTrustLine(data.data.hasTrustLine || false);
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
          // setHasTrustLine(data.data.hasTrustLine || false);
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

  if (loading) {
    return (
      <Layout currentPage="dashboard">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="dashboard">
        <div className="dashboard-container">
          <div className="error-message">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.href = '/'} className="primary-button">
              Go to Registration
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="dashboard">
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

      {/* Main feed */}
      <main className="main-feed">
        <div className="welcome-card">
          <div className="welcome-header">
            <div className="admin-avatar">👨‍💻</div>
            <div className="admin-info">
              <span className="admin-name">TULDOK Admin</span>
              <span className="admin-title">Founder & Creator</span>
              <span className="post-time">Just now</span>
            </div>
          </div>
          
          <div className="welcome-content">
            <div className="welcome-title">
              <h2>🌅 The TULDOK Awakening</h2>
              <div className="welcome-subtitle">From Accidental Creation to Global Filipino Dreams</div>
            </div>
            
            <div className="welcome-message">
              <p className="highlight-text">
                <strong>"Sometimes the best innovations happen when you're not even trying to innovate."</strong>
              </p>
              
              <h3>🎯 The Story That Changed Everything</h3>
              
              <p>
                Five years ago, in a moment of pure curiosity and technological exploration, 
                TULDOK was born. Not from a grand business plan or a calculated strategy, 
                but from a simple question: <em>"What if I could create something that connects Filipinos worldwide?"</em>
              </p>
              
              <div className="confession-box">
                <p><strong>Here's the truth: TULDOK was an accident.</strong></p>
                <p>But sometimes, the most beautiful revolutions start with happy accidents. ✨</p>
              </div>
              
              <p>
                I was just a curious Filipino tech enthusiast, playing with XRPL technology, 
                experimenting with token creation on Xumm. One day, I created TULDOK, 
                and before I knew it, the Filipino community was buzzing with excitement.
              </p>
              
              <p>
                The name "TULDOK" (Filipino for "dot" or "period") was instantly recognizable 
                to every Kababayan. It was our way of saying, <strong>"This is made by a Filipino, for Filipinos."</strong>
              </p>
              
              <h3>🌍 The Journey Continues</h3>
              
              <p>
                Fast forward to today, and I find myself in Dublin, Ireland, pursuing my passion 
                for technology and finance. Soon, I'll be taking my Masters in FinTech, 
                diving deeper into the world of financial technology that powers our dreams.
              </p>
              
              <div className="vision-box">
                <h4>🚀 Our Vision for the Future</h4>
                <p><strong>We're not just building a cryptocurrency. We're building bridges.</strong></p>
              </div>
              
              <h3>💡 The Bigger Picture</h3>
              
              <p>
                My mission is clear: <strong>Educate Filipinos about blockchain technology</strong> and 
                revolutionize how our OFW community sends money home. Think about it - 
                traditional cross-border payments are expensive, slow, and complicated.
              </p>
              
              <p>
                Through blockchain technology, we can slash those high fees, eliminate 
                waiting times, and make financial inclusion a reality for every Filipino family.
              </p>
              
              <div className="innovation-highlights">
                <h4>🌟 What We're Building</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  <li><strong>Blockchain Education:</strong> Empowering Filipinos with crypto knowledge</li>
                  <li><strong>OFW Remittances:</strong> Faster, cheaper, more secure money transfers</li>
                  <li><strong>Financial Inclusion:</strong> Bringing banking to the unbanked</li>
                  <li><strong>Community Building:</strong> Connecting Filipinos worldwide</li>
                </ul>
              </div>
              
              <div className="awakening-message">
                <h4>🌅 TULDOK is Not Dead - It's Awakening</h4>
                <p>
                  <strong>We've been quiet, but we've been working.</strong> Studying, learning, 
                  and preparing for something bigger than ourselves. The technology is evolving, 
                  and so are we.
                </p>
              </div>
              
              <div className="call-to-action">
                <h4>🎯 Join the Revolution</h4>
                <p>
                  <strong>This is just the beginning.</strong> Whether you're a Filipino in the Philippines, 
                  an OFW working abroad, or anyone who believes in the power of blockchain to 
                  change lives - you have a place in the TULDOK story.
                </p>
              </div>
              
              <div className="welcome-footer">
                <p><strong>Ready to be part of something revolutionary?</strong> 🚀</p>
                <p>Let's build the future of Filipino finance together.</p>
                <p><em>"Ang TULDOK ay para sa Pilipino, gawa ng Pilipino, para sa mundo."</em></p>
              </div>
            </div>
          </div>
          
          <div className="welcome-actions">
            <button className="action-btn primary" title="Like this welcome message">❤️ Welcome Back!</button>
            <button className="action-btn" title="Share this story">🔗 Share Story</button>
            <button className="action-btn" title="Learn more about TULDOK">📚 Learn More</button>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Dashboard; 