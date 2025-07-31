require('dotenv').config();

console.log('🔧 Testing environment variables loading...');
console.log('Current working directory:', process.cwd());
console.log('');

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'Not set');
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('XUMM_API_KEY:', process.env.XUMM_API_KEY ? '***' : 'Not set');
console.log('XUMM_API_SECRET:', process.env.XUMM_API_SECRET ? '***' : 'Not set');
console.log('');

// Try to read the .env file directly
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('🔍 Checking .env file...');
console.log('Env file path:', envPath);
console.log('Env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Env file size:', envContent.length, 'characters');
  console.log('First 200 characters:');
  console.log(envContent.substring(0, 200));
  console.log('');
  
  // Check for non-commented lines
  const lines = envContent.split('\n');
  const activeLines = lines.filter(line => line.trim() && !line.trim().startsWith('#'));
  console.log('Active (non-commented) lines:', activeLines.length);
  activeLines.forEach(line => {
    console.log('  ', line.trim());
  });
} 