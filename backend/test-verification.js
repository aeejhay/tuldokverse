const db = require('./config/db');

// Test verification token
async function testVerificationToken() {
  try {
    console.log('🧪 Testing verification token...\n');

    // Replace this with your actual token
    const testToken = '509eb1b8c134a7ef8fa34c94f4b761fbf6cf01a6f2b95785b471ae5d029e91b0';
    
    console.log(`🔍 Testing token: ${testToken.substring(0, 10)}...`);

    // Check if token exists in database
    const [users] = await db.execute(
      'SELECT id, wallet_address, email, name, verified, verification_token FROM users WHERE verification_token = ?',
      [testToken]
    );

    if (users.length === 0) {
      console.log('❌ Token not found in database');
      return;
    }

    const user = users[0];
    console.log('✅ Token found!');
    console.log('📊 User data:', {
      id: user.id,
      wallet_address: user.wallet_address,
      email: user.email,
      name: user.name,
      verified: user.verified,
      hasToken: !!user.verification_token
    });

    if (user.verified) {
      console.log('⚠️ User is already verified');
    } else {
      console.log('✅ User is not verified yet - token should work');
    }

    await db.end();
    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVerificationToken(); 