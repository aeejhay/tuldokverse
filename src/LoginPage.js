import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import Logo from './components/Logo';
import ImageTest from './components/ImageTest';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LoginPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResendVerification(false);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: 'dummy-signature' // Placeholder for now
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data.verified) {
          // User is verified, save to localStorage and go to dashboard
          localStorage.setItem('tuldokUser', JSON.stringify(data.data));
          navigate('/dashboard');
        } else {
          // User exists but not verified
          setError('Your email is not verified. Please check your email and click the verification link.');
          setShowResendVerification(true);
        }
      } else {
        if (data.message.includes('not found')) {
          setError('Wallet address not found. Please register first.');
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress
        })
      });

      const data = await response.json();

      if (response.ok) {
        setError('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ImageTest />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, marginBottom: 16 }}>
        <Logo size={80} />
      </div>
      <div className="login-container">
        <h2>Login to TULDOK Social</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="walletAddress"
            placeholder="Enter your XRP Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            maxLength={40}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <div className="error-message">{error}</div>}
          
          {showResendVerification && (
            <div className="verification-reminder">
              <p>Need to verify your email?</p>
              <button 
                type="button" 
                onClick={handleResendVerification}
                disabled={loading}
                className="resend-button"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <button onClick={() => navigate('/')} className="link-button">Register here</button></p>
        </div>
      </div>
    </>
  );
};

export default LoginPage; 