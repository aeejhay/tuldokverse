const db = require('./db');

const initializeDatabase = async () => {
  try {
    console.log('🗄️ Initializing database tables...');

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wallet_address VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        balance_xrp DECIMAL(20,6) DEFAULT 0,
        balance_tuldok DECIMAL(20,6) DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP NULL,
        verification_token VARCHAR(255) NULL,
        verification_tx_hash VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table created/verified');

    // Create posts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        transaction_hash VARCHAR(255) NOT NULL,
        ledger_index BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Posts table created/verified');

    // Create transactions table (for tracking all XRPL transactions)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_transaction_hash (transaction_hash),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Transactions table created/verified');

    console.log('🎉 Database initialization completed successfully!');
    
    // Show table structure
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase; 