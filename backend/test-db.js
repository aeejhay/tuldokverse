require('dotenv').config();
const db = require('./config/db');

async function testDatabase() {
  console.log('🧪 Testing database connection...\n');
  
  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'Not set');
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  console.log('');

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const [result] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful:', result[0]);
    console.log('');

    // Test database exists
    console.log('2. Testing database access...');
    const [databases] = await db.execute('SHOW DATABASES');
    const dbNames = databases.map(db => db.Database);
    console.log('Available databases:', dbNames);
    
    if (dbNames.includes(process.env.DB_DATABASE)) {
      console.log('✅ Database exists:', process.env.DB_DATABASE);
    } else {
      console.log('❌ Database not found:', process.env.DB_DATABASE);
    }
    console.log('');

    // Test table creation
    console.log('3. Testing table creation...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255)
      )
    `);
    console.log('✅ Test table created successfully');
    
    // Clean up
    await db.execute('DROP TABLE test_table');
    console.log('✅ Test table cleaned up');
    console.log('');

    console.log('🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 