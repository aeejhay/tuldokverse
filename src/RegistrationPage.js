import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to validate XRP wallet address (starts with 'r' and base58)
function isValidXRPAddress(address) {
  // Base58 regex for XRP: starts with r, 25-35 chars, only base58 chars
  const base58 = /^[r][1-9A-HJ-NP-Za-km-z]{24,34}$/;
  return base58.test(address);
}

const RegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    walletAddress: '',
    email: '',
    phone: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Check for verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-email?token=${token}`);
      const data = await res.json();
      if (res.ok) {
        setVerificationStatus({ success: true, message: data.message });
        // Save user data to localStorage
        if (data.data) {
          localStorage.setItem('tuldokUser', JSON.stringify(data.data));
        }
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setVerificationStatus({ success: false, message: data.message });
      }
    } catch (err) {
      setVerificationStatus({ success: false, message: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);
    // Validate wallet address
    if (!isValidXRPAddress(form.walletAddress)) {
      setError('Invalid XRP wallet address. It must start with "r" and be in base58 format.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setSuccess(data.message);
      setShowVerificationMessage(true);
      setForm({ walletAddress: '', email: '', phone: '', name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show verification status if token is in URL
  if (verificationStatus) {
    return (
      <div className="register-container">
        <div className={`verification-message ${verificationStatus.success ? 'success' : 'error'}`}>
          <h2>{verificationStatus.success ? '✅ Email Verified!' : '❌ Verification Failed'}</h2>
          <p>{verificationStatus.message}</p>
          {verificationStatus.success && (
            <p>Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    );
  }

  // Show verification message after registration
  if (showVerificationMessage) {
    return (
      <div className="register-container">
        <div className="verification-message success">
          <h2>📧 Check Your Email!</h2>
          <p>{success}</p>
          <p>We've sent a verification link to your email address.</p>
          <p>Please click the link to verify your account and access your dashboard.</p>
          <button 
            onClick={() => setShowVerificationMessage(false)}
            className="back-button"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, marginBottom: 16 }}>
        <img src="/white_logo_tuldok.png" alt="Logo" style={{ width: 80, height: 80 }} />
      </div>
      <div className="register-container">
        <h2>TULDOK Social Registration</h2>
        <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            name="walletAddress"
            placeholder="XRPL Wallet Address"
            value={form.walletAddress}
            onChange={handleChange}
            maxLength={40}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
        <div className="register-footer">
          <small>Already have an account? <button onClick={() => window.location.href = '/login'} className="link-button">Login here</button></small>
        </div>
      </div>
    </>
  );
};

export default RegistrationPage; 