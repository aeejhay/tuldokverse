require('dotenv').config();
const db = require('./config/db');

const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing Railway database connection...');
    console.log('📊 Environment variables:');
    console.log('  DB_HOST:', process.env.DB_HOST);
    console.log('  DB_USER:', process.env.DB_USER);
    console.log('  DB_DATABASE:', process.env.DB_DATABASE);
    console.log('  DB_PORT:', process.env.DB_PORT);
    
    // Test connection
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log('📋 Test query result:', rows);
    
    // Check if tables exist
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Test users table
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users count:', userCount[0].count);
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('🔧 Make sure your environment variables are set correctly in Railway');
  } finally {
    process.exit(0);
  }
};

testDatabaseConnection(); 