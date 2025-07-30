import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('No verification token found in the URL.');
          return;
        }

        console.log('🔍 Verifying email with token:', token.substring(0, 10) + '...');

        const response = await fetch(`${API_URL}/verify-email?token=${token}`);
        const data = await response.json();

        console.log('📊 Verification response:', { 
          status: response.status, 
          ok: response.ok, 
          data: data 
        });

        if (response.ok) {
          // If user is not verified, redirect to payment verification
          if (data.data && data.data.verified === 0) {
            const walletAddress = data.data.wallet_address;
            navigate(`/payment-verification?token=${token}&walletAddress=${walletAddress}`);
            return;
          }
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setUserData(data.data);
          
          // Store user data in localStorage
          if (data.data) {
            localStorage.setItem('tuldokUser', JSON.stringify(data.data));
          }
          
          console.log('✅ Email verification successful:', data.data);
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || `Email verification failed (Status: ${response.status})`);
          console.error('❌ Email verification failed:', { status: response.status, data });
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again.');
        console.error('❌ Verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="verification-status">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verification-status success">
            <div className="success-icon">✅</div>
            <h3>Email Verified Successfully!</h3>
            <p>{message}</p>
            {userData && (
              <div className="user-info">
                <p><strong>Welcome, {userData.name}!</strong></p>
                <p>Wallet: {userData.wallet_address}</p>
                <p>Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="verification-status error">
            <div className="error-icon">❌</div>
            <h3>Verification Failed</h3>
            <p>{message}</p>
            <div className="verification-actions">
              <button 
                onClick={() => navigate('/login')} 
                className="primary-button"
              >
                Go to Login
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="secondary-button"
              >
                Go to Registration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 