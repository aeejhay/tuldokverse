import React from 'react';

// Professional styled logo component
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
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        borderRadius: '12px',
        color: 'white',
        fontSize: size * 0.15,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid #333',
        minWidth: size,
        minHeight: size,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #00d4ff, #0099cc)'
      }} />
      
      <div style={{ 
        fontSize: size * 0.12, 
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        letterSpacing: '0.5px'
      }}>
        TULDOK
      </div>
      <div style={{ 
        fontSize: size * 0.08, 
        color: '#00d4ff', 
        marginTop: '2px',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}>
        SOCIAL
      </div>
    </div>
  );
};

export default SimpleLogo; 