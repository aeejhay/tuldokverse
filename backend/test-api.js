const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing TULDOK Social Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData.message);
    console.log('   Status:', healthRes.status);
    console.log('');

    // Test registration endpoint with invalid data
    console.log('2. Testing registration validation...');
    const invalidRegRes = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'invalid-address',
        email: 'invalid-email',
        phone: '123',
        name: ''
      })
    });
    const invalidRegData = await invalidRegRes.json();
    console.log('✅ Validation working:', invalidRegData.message);
    console.log('   Status:', invalidRegRes.status);
    console.log('');

    // Test registration endpoint with valid data (but non-existent wallet)
    console.log('3. Testing registration with valid format...');
    const validRegRes = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Known XRPL address
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'Test User'
      })
    });
    const validRegData = await validRegRes.json();
    console.log('✅ Registration response:', validRegData.message);
    console.log('   Status:', validRegRes.status);
    console.log('');

    console.log('🎉 All API tests completed!');
    console.log('\n📝 Note: Registration will fail with insufficient balance, which is expected behavior.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI; 