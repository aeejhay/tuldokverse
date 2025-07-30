import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onLogout }) => {
  // Menu configuration - easily add new pages here
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: '🏠',
      path: '/dashboard',
      active: currentPage === 'dashboard'
    },
    {
      id: 'tuldokverse',
      label: 'Tuldokverse',
      icon: '🌍',
      path: '/tuldokverse',
      active: currentPage === 'tuldokverse'
    },
    {
      id: 'send-token',
      label: 'Send Token',
      icon: '💸',
      path: '/send-token',
      active: currentPage === 'send-token'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile',
      active: currentPage === 'profile'
    },
    // Future menu items can be easily added here:
    // {
    //   id: 'posts',
    //   label: 'Posts',
    //   icon: '📝',
    //   path: '/posts',
    //   active: currentPage === 'posts'
    // },
    // {
    //   id: 'transactions',
    //   label: 'Transactions',
    //   icon: '💳',
    //   path: '/transactions',
    //   active: currentPage === 'transactions'
    // },
    // {
    //   id: 'settings',
    //   label: 'Settings',
    //   icon: '⚙️',
    //   path: '/settings',
    //   active: currentPage === 'settings'
    // }
  ];

  const handleNavigation = (path) => {
    if (path !== window.location.pathname) {
      window.location.href = path;
    }
  };

  return (
    <aside className="sidebar">
      <img src="/white_logo_tuldok.png" alt="Logo" className="sidebar-logo" />
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <button 
        onClick={onLogout} 
        className="logout-button"
        title="Logout"
      >
        <span className="logout-icon">🚪</span>
        <span className="logout-label">Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar; 