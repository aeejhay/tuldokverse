const xrpl = require('xrpl');

// Test TULDOK balance fetching
async function testTuldokBalance() {
  console.log('🧪 Testing TULDOK Balance Fetching...\n');

  try {
    // Connect to XRPL
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    console.log('✅ Connected to XRPL');

    // Test wallet address (replace with a real one for testing)
    const testWallet = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'; // Known XRPL address
    
    console.log(`\n🔍 Testing wallet: ${testWallet}`);

    // Get account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: testWallet,
      ledger_index: 'validated'
    });

    console.log('📊 Account Info:', accountInfo.result.account_data);

    // Get XRP balance
    const balance = accountInfo.result.account_data.Balance;
    const xrpBalance = xrpl.dropsToXrp(balance);
    console.log(`💰 XRP Balance: ${xrpBalance} XRP`);

    // Get trust lines
    const trustLines = await client.request({
      command: 'account_lines',
      account: testWallet,
      ledger_index: 'validated'
    });

    console.log('\n🔗 Trust Lines:');
    if (trustLines.result.lines.length === 0) {
      console.log('   No trust lines found');
    } else {
      trustLines.result.lines.forEach((line, index) => {
        console.log(`   ${index + 1}. Currency: ${line.currency}, Issuer: ${line.account}, Balance: ${line.balance}`);
      });
    }

    // TULDOK token configuration
    const TULDOK_CURRENCY = 'TULDOK';
    const TULDOK_ISSUER = process.env.TULDOK_ISSUER_ADDRESS || 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
    
    console.log(`\n🪙 Looking for TULDOK token:`);
    console.log(`   Currency: ${TULDOK_CURRENCY}`);
    console.log(`   Issuer: ${TULDOK_ISSUER}`);

    let tuldokFound = false;
    let tuldokBalance = 0;

    // Check for TULDOK trust line
    for (const line of trustLines.result.lines) {
      if (line.currency === TULDOK_CURRENCY && line.account === TULDOK_ISSUER) {
        tuldokBalance = parseFloat(line.balance);
        tuldokFound = true;
        console.log(`✅ Found TULDOK balance: ${tuldokBalance}`);
        break;
      }
    }

    if (!tuldokFound) {
      console.log('⚠️ No TULDOK trust line found');
      console.log('🔄 Using XRP equivalent (XRP * 1000)');
      const tuldokEquivalent = parseFloat(xrpBalance) * 1000;
      console.log(`   TULDOK Equivalent: ${tuldokEquivalent.toFixed(2)}`);
    }

    await client.disconnect();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTuldokBalance(); 