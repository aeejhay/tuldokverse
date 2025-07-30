const xrpl = require('xrpl');

// Test specific wallet address
async function testSpecificWallet() {
  console.log('🧪 Testing Specific Wallet: rwEttWakwVrvTFL4iEcRmq7cYUMTERxutz\n');

  try {
    // Connect to XRPL
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();
    console.log('✅ Connected to XRPL');

    const testWallet = 'rwEttWakwVrvTFL4iEcRmq7cYUMTERxutz';
    
    console.log(`🔍 Testing wallet: ${testWallet}`);

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
      console.log(`   Found ${trustLines.result.lines.length} trust lines:`);
      trustLines.result.lines.forEach((line, index) => {
        console.log(`   ${index + 1}. Currency: ${line.currency}, Issuer: ${line.account}, Balance: ${line.balance}`);
      });
    }

    // TULDOK token configuration
    const TULDOK_CURRENCY = 'TULDOK';
    const TULDOK_CURRENCY_HEX = '54554C444F4B0000000000000000000000000000'; // Hex representation of TULDOK
    const TULDOK_ISSUER = process.env.TULDOK_ISSUER_ADDRESS || 'r9qGMJMreNBYdEqJ7mNrUjyCj44fDUEe1G'; // Updated to match the actual issuer
    
    console.log(`\n🪙 Looking for TULDOK token:`);
    console.log(`   Currency: ${TULDOK_CURRENCY} or ${TULDOK_CURRENCY_HEX}`);
    console.log(`   Issuer: ${TULDOK_ISSUER}`);

    let tuldokFound = false;
    let tuldokBalance = 0;

    // Check for TULDOK trust line
    for (const line of trustLines.result.lines) {
      // Check for both string and hex representations of TULDOK
      if ((line.currency === TULDOK_CURRENCY || line.currency === TULDOK_CURRENCY_HEX) && 
          line.account === TULDOK_ISSUER) {
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

    // Check if there are any tokens with similar names
    console.log('\n🔍 Checking for similar token names:');
    const similarTokens = trustLines.result.lines.filter(line => 
      line.currency.toLowerCase().includes('tuldok') || 
      line.currency.toLowerCase().includes('tul') ||
      line.currency.toLowerCase().includes('dok')
    );
    
    if (similarTokens.length > 0) {
      console.log('   Found similar tokens:');
      similarTokens.forEach((token, index) => {
        console.log(`   ${index + 1}. Currency: ${token.currency}, Issuer: ${token.account}, Balance: ${token.balance}`);
      });
    } else {
      console.log('   No similar tokens found');
    }

    await client.disconnect();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSpecificWallet(); 