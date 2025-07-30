import React, { useState, useEffect } from 'react';
// import { Xumm } from 'xumm-sdk'; // Uncomment and configure for real integration
import { useSearchParams, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TULDOK_AMOUNT = 33;

const PaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [status, setStatus] = useState('instructions'); // instructions, loading, qr, verifying, success, error
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [payloadUuid, setPayloadUuid] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  const token = searchParams.get('token');
  const walletAddress = searchParams.get('walletAddress');

  // Effect to handle payment verification once we have a UUID
  useEffect(() => {
    // Automatically start verifying once the QR code is displayed
    if (status === 'qr' && payloadUuid && token) {
      const waitForPayment = async () => {
        try {
          const res = await fetch(`${API_URL}/payload-status/${payloadUuid}?token=${token}`);
          const data = await res.json();

          if (res.ok && data.success) {
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
          } else {
            setError(data.message || 'Payment failed or was rejected by the wallet.');
            setStatus('error');
          }
        } catch (err) {
          console.error('Error waiting for payment confirmation:', err);
          setError('A network error occurred while verifying the payment. Please try again.');
          setStatus('error');
        }
      };
      
      waitForPayment();
    }
  }, [status, payloadUuid, token, navigate]);


  // 1. Create Xumm payload and get QR code
  const handleCreatePayload = async () => {
    if (!token || !walletAddress) {
        setError('Missing verification token or wallet address. Please go back to your email and click the link again.');
        setStatus('error');
        return;
    }
    
    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${API_URL}/create-xumm-payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, token })
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        setQrUrl(data.refs.qr_png);
        setPayloadUuid(data.uuid);
        setPaymentLink(data.refs.websocket_status); // This link can be opened on mobile
        setStatus('qr'); // Show the QR code
      } else {
        setError(data.message || 'Failed to create the payment request.');
        setStatus('error');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setStatus('error');
    }
  };
  
  // The handleProceedToVerification function is no longer needed
  /*
  const handleProceedToVerification = () => {
    setStatus('verifying');
  };
  */

  const renderContent = () => {
    switch (status) {
      case 'instructions':
        return (
          <>
            <p>To complete your registration, please pay <b>{TULDOK_AMOUNT} TULDOK</b> using your Xaman wallet.</p>
            <p><small>This is a one-time fee to activate your account.</small></p>
            <button className="primary-button" onClick={handleCreatePayload}>
              Generate Payment QR Code
            </button>
          </>
        );
      case 'loading':
        return (
          <>
            <div className="loading-spinner"><div className="spinner"></div></div>
            <p>Creating secure payment request...</p>
          </>
        );
      case 'qr':
        return (
          <>
            <img src={qrUrl} alt="Scan this QR code with your Xaman wallet" style={{ width: 200, margin: '0 auto 16px', display: 'block', border: '5px solid white', borderRadius: '10px' }} />
            <p>Scan the QR code with Xaman to approve the payment.</p>
            <p>
                <a href={paymentLink.replace('ws://', 'https://')} target="_blank" rel="noopener noreferrer" style={{ color: '#2323e4', fontWeight: 700 }}>
                    Or click here to open in Xaman
                </a>
            </p>
            <div className="loading-spinner" style={{marginTop: '20px'}}><div className="spinner"></div></div>
            <p>Listening for payment confirmation...</p>
          </>
        );
      case 'success':
        return (
          <>
            <div className="success-icon">✅</div>
            <h3>Payment Verified!</h3>
            <p>Your account is now fully active. Redirecting you to login...</p>
          </>
        );
      case 'error':
        return (
          <>
            <div className="error-icon">❌</div>
            <h3>An Error Occurred</h3>
            <p>{error}</p>
            <button className="primary-button" onClick={() => setStatus('instructions')}>
              Try Again
            </button>
          </>
        );
      default:
        return <p>Loading...</p>;
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>Complete Your Registration</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentVerification; 