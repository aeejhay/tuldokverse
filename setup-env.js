#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Setting up environment variables for deployment...\n');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Backend environment variables
const backendEnv = `# Database Configuration (Railway will provide these)
DB_HOST=\${MYSQLHOST}
DB_USER=\${MYSQLUSER}
DB_PASSWORD=\${MYSQLPASSWORD}
DB_DATABASE=\${MYSQLDATABASE}
DB_PORT=\${MYSQLPORT}

# JWT Configuration
JWT_SECRET=${jwtSecret}

# XRPL Configuration
XRPL_NODE_URL=https://s.altnet.rippletest.net:51234

# Frontend URL (update this after Vercel deployment)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Server Port
PORT=5000

# Email Configuration (update with your email settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
`;

// Frontend environment variables
const frontendEnv = `# API URL (update this with your Railway backend URL)
REACT_APP_API_URL=https://your-backend.railway.app/api
`;

// Write environment files
try {
    fs.writeFileSync(path.join(__dirname, 'backend', '.env'), backendEnv);
    fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), frontendEnv);
    
    console.log('✅ Environment files created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update the FRONTEND_URL in backend/.env after Vercel deployment');
    console.log('2. Update the REACT_APP_API_URL in frontend/.env after Railway deployment');
    console.log('3. Update email configuration in backend/.env if needed');
    console.log('\n🔐 Generated JWT Secret:', jwtSecret);
    console.log('\n⚠️  Remember to add these .env files to your .gitignore!');
    
} catch (error) {
    console.error('❌ Error creating environment files:', error.message);
} 