require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

app.use(express.json());
app.use(cors());

// DEBUG: Check if environment variables are loaded correctly
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);

// Test DB connection
db.execute('SELECT 1')
  .then(() => console.log('💾 Database Connected!'))
  .catch(err => console.error('DB Error:', err));

app.get('/', (req, res) => {
  res.send('Tuldok Backend Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
