import React, { useState, useEffect } from 'react';

const ImageTest = () => {
  const [testResults, setTestResults] = useState([]);

  const testImage = (src, name) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`✅ ${name} loaded successfully:`, src);
        setTestResults(prev => [...prev, { name, src, status: 'success' }]);
        resolve({ name, src, status: 'success' });
      };
      img.onerror = () => {
        console.error(`❌ ${name} failed to load:`, src);
        setTestResults(prev => [...prev, { name, src, status: 'error' }]);
        resolve({ name, src, status: 'error' });
      };
      img.src = src;
    });
  };

  useEffect(() => {
    const runTests = async () => {
      const tests = [
        { src: '/white_logo_tuldok.png', name: 'PNG Logo (root)' },
        { src: `${process.env.PUBLIC_URL}/white_logo_tuldok.png`, name: 'PNG Logo (PUBLIC_URL)' },
        { src: '/tuldok-logo.svg', name: 'SVG Logo' },
        { src: '/favicon.ico', name: 'Favicon (test)' },
        { src: '/logo192.png', name: 'Logo192 (test)' },
      ];

      for (const test of tests) {
        await testImage(test.src, test.name);
      }
    };

    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px' }}>
      <h3>Image Loading Test Results:</h3>
      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            margin: '5px 0', 
            color: result.status === 'success' ? 'green' : 'red' 
          }}>
            {result.status === 'success' ? '✅' : '❌'} {result.name}: {result.src}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <h4>Environment Info:</h4>
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <div>PUBLIC_URL: {process.env.PUBLIC_URL || 'undefined'}</div>
          <div>NODE_ENV: {process.env.NODE_ENV}</div>
          <div>REACT_APP_API_URL: {process.env.REACT_APP_API_URL}</div>
        </div>
      </div>
    </div>
  );
};

export default ImageTest; 