require('dotenv').config();

console.log('🔍 Database Connection Test');
console.log('==========================');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***');

const mysql = require('mysql2');

const testConnection = async () => {
  try {
    console.log('\n🔗 Testing connection...');
    
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT || 3306
    });

    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          console.error('❌ Connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Connection successful!');
          resolve();
        }
      });
    });

    connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testConnection(); 