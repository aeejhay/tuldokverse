import React, { useState, useEffect } from 'react';

const Logo = ({ className = '', style = {}, size = 80 }) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('/logo.png');
  const [attempts, setAttempts] = useState(0);

  const handleImageError = () => {
    console.error('Logo failed to load:', currentSrc, 'Attempt:', attempts + 1);
    setAttempts(prev => prev + 1);
    
    if (attempts === 0) {
      // Try original filename
      setCurrentSrc('/white_logo_tuldok.png');
    } else if (attempts === 1) {
      // Try with PUBLIC_URL
      setCurrentSrc(`${process.env.PUBLIC_URL}/logo.png`);
    } else if (attempts === 2) {
      // Try SVG version
      setCurrentSrc('/tuldok-logo.svg');
    } else if (attempts === 3) {
      // Try relative path
      setCurrentSrc('./logo.png');
    } else if (attempts === 4) {
      // Try absolute path with domain
      setCurrentSrc(`${window.location.origin}/logo.png`);
    } else {
      // Fallback to text logo
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log('Logo loaded successfully:', currentSrc);
  };

  // Reset attempts when component mounts
  useEffect(() => {
    setAttempts(0);
    setCurrentSrc('/logo.png');
    setImageError(false);
  }, []);

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