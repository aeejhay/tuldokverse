import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationPage from './RegistrationPage';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ProfilePage from './ProfilePage';
import TuldokversePage from './TuldokversePage';
import SendTokenPage from './SendTokenPage';
import EmailVerification from './EmailVerification';
import PaymentVerification from './PaymentVerification';
import './App.css';

function App() {
  return (
    <Router>
    <div className="App">
        <Routes>
          <Route path="/" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/payment-verification" element={<PaymentVerification />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tuldokverse" element={<TuldokversePage />} />
          <Route path="/send-token" element={<SendTokenPage />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
