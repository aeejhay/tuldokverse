# TULDOK Social Backend

A blockchain-based minimalist social media platform leveraging the XRP Ledger (XRPL) and XUMM Wallet integration.

## 🚀 Features

- **User Registration & Authentication**: XRPL wallet-based registration with balance verification
- **Post Creation**: Create posts by burning 1 TULDOK token per post
- **Blockchain Integration**: Full XRPL integration with transaction tracking
- **JWT Authentication**: Secure token-based authentication
- **MySQL Database**: Robust data storage with proper indexing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- XRPL wallet with sufficient balance

## 🛠️ Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_DATABASE=tuldok_social

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # XRPL Configuration
   XRPL_NODE_URL=wss://xrplcluster.com

   # TULDOK Token Configuration
   # Replace with your actual TULDOK token issuer address
   TULDOK_ISSUER_ADDRESS=rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh

   # Email Configuration (Gmail)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

5. **Create MySQL database:**
   ```sql
   CREATE DATABASE tuldok_social;
   ```

6. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## 🪙 TULDOK Token Configuration

### Setting Up TULDOK Token

To properly use TULDOK tokens, you need to:

1. **Create/Issue TULDOK Token on XRPL:**
   - Use an XRPL wallet to issue the TULDOK token
   - Note down the issuer address and currency code

2. **Configure Environment Variables:**
   ```env
   TULDOK_ISSUER_ADDRESS=your_actual_issuer_address_here
   ```

3. **Set Up Trust Lines:**
   - Users need to set up trust lines for TULDOK tokens
   - This allows them to hold and transact with TULDOK tokens

### Development Mode

In development mode, if no TULDOK trust line is found:
- The system uses XRP balance as a placeholder
- Converts XRP to TULDOK equivalent (XRP * 1000)
- Shows a warning in the dashboard

### Production Mode

In production:
- Users must have a valid TULDOK trust line
- Actual TULDOK token balances are checked
- No fallback to XRP equivalent

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "walletAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "email": "user@example.com",
  "phone": "+1234567890",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "data": {
    "userId": 1,
    "walletAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "email": "user@example.com",
    "name": "John Doe",
    "balance": {
      "xrp": 100.5,
      "tuldok": 100500
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /api/login
Content-Type: application/json

{
  "walletAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "signature": "user_signature_here"
}
```

#### Get User Profile
```http
GET /api/profile/:walletAddress
```

#### Refresh User Balances
```http
POST /api/refresh-balances/:walletAddress
```

**Response:**
```json
{
  "success": true,
  "message": "Balances refreshed successfully!",
  "data": {
    "userId": 1,
    "walletAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "email": "user@example.com",
    "name": "John Doe",
    "balance_xrp": 100.5,
    "balance_tuldok": 100500,
    "hasTrustLine": true,
    "verified": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Posts

#### Create Post
```http
POST /api/post
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "What's your dots today? This is my first TULDOK post!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully! 1 TULDOK burned.",
  "data": {
    "postId": 1,
    "content": "What's your dots today? This is my first TULDOK post!",
    "transactionHash": "simulated_1234567890_abc123",
    "ledgerIndex": 80012345,
    "ledgerUrl": "https://livenet.xrpl.org/transactions/simulated_1234567890_abc123",
    "remainingBalance": 99
  }
}
```

#### Get User Posts
```http
GET /api/posts/:walletAddress
```

#### Get All Posts (Feed)
```http
GET /api/posts?page=1&limit=20
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  balance_xrp DECIMAL(20,6) DEFAULT 0,
  balance_tuldok DECIMAL(20,6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  ledger_index BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  transaction_hash VARCHAR(255) UNIQUE NOT NULL,
  transaction_type ENUM('burn', 'transfer', 'mint') NOT NULL,
  amount DECIMAL(20,6) NOT NULL,
  ledger_index BIGINT NOT NULL,
  status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 Development

### Project Structure
```
backend/
├── config/
│   ├── db.js              # Database connection
│   └── initDb.js          # Database initialization
├── controllers/
│   ├── userController.js  # User management logic
│   └── postController.js  # Post management logic
├── routes/
│   ├── userRoutes.js      # User API routes
│   └── postRoutes.js      # Post API routes
├── server.js              # Main server file
└── package.json
```

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (placeholder)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Secure configuration management

## 🌐 XRPL Integration

The backend integrates with the XRP Ledger for:
- Wallet balance verification
- TULDOK token burning for posts
- Transaction tracking and verification
- Memo field usage for post content storage

## 🚨 Important Notes

1. **TULDOK Token**: Currently using XRP balance as placeholder for TULDOK tokens
2. **XRPL Transactions**: Transaction simulation for development; real implementation requires private keys or XUMM SDK
3. **Balance Requirements**: Users need minimum 33 TULDOK equivalent for registration
4. **Post Cost**: Each post burns exactly 1 TULDOK token

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License. 