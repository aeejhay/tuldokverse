import React, { useState } from 'react';

const Logo = ({ className = '', style = {}, size = 80 }) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('/white_logo_tuldok.png');

  const handleImageError = () => {
    console.error('Logo failed to load:', currentSrc);
    
    if (currentSrc === '/white_logo_tuldok.png') {
      // Try with PUBLIC_URL
      setCurrentSrc(`${process.env.PUBLIC_URL}/white_logo_tuldok.png`);
    } else if (currentSrc.includes('PUBLIC_URL')) {
      // Try SVG version
      setCurrentSrc('/tuldok-logo.svg');
    } else if (currentSrc === '/tuldok-logo.svg') {
      // Try relative path
      setCurrentSrc('./white_logo_tuldok.png');
    } else {
      // Fallback to text logo
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log('Logo loaded successfully:', currentSrc);
  };

  if (imageError) {
    // Text-based fallback logo with better styling
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
          border: '1px solid #333'
        }}
      >
        <div style={{ fontSize: size * 0.12, fontWeight: 'bold' }}>TULDOK</div>
        <div style={{ fontSize: size * 0.08, color: '#888', marginTop: '2px' }}>SOCIAL</div>
      </div>
    );
  }

  return (
    <img 
      src={currentSrc}
      alt="TULDOK Logo" 
      className={className}
      style={{ 
        ...style, 
        width: size, 
        height: size,
        objectFit: 'contain'
      }}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default Logo; 