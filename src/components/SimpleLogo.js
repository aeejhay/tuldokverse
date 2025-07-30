import React from 'react';

// Simple base64 encoded logo (small white square with text)
const SimpleLogo = ({ className = '', style = {}, size = 80 }) => {
  return (
    <div 
      className={className}
      style={{
        ...style,
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        color: 'white',
        fontSize: size * 0.15,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid #333',
        minWidth: size,
        minHeight: size
      }}
    >
      <div style={{ fontSize: size * 0.12, fontWeight: 'bold' }}>TULDOK</div>
      <div style={{ fontSize: size * 0.08, color: '#888', marginTop: '2px' }}>SOCIAL</div>
    </div>
  );
};

export default SimpleLogo; 