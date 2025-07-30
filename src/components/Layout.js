import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, currentPage }) => {
  const handleLogout = () => {
    localStorage.removeItem('tuldokUser');
    window.location.href = '/';
  };

  return (
    <div className="layout">
      <Sidebar currentPage={currentPage} onLogout={handleLogout} />
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
};

export default Layout; 