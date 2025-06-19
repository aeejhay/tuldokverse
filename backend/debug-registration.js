require('dotenv').config();
const fetch = require('node-fetch');

async function debugRegistration() {
  console.log('🔍 Debugging Registration Endpoint...\n');
  
  try {
    // Test registration with sample data
    const testData = {
      walletAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Known XRPL address
      email: 'test@example.com',
      phone: '+1234567890',
      name: 'Test User'
    };

    console.log('📝 Test registration data:', testData);
    console.log('');

    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers.get('content-type'));

    const data = await response.json();
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed with status:', response.status);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Make sure your backend server is running on port 5000');
    }
  }
}

// Run debug if this file is executed directly
if (require.main === module) {
  debugRegistration()
    .then(() => {
      console.log('\n✅ Debug completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Debug failed:', error);
      process.exit(1);
    });
}

module.exports = debugRegistration; 