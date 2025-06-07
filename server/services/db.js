const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'szachy',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err, client) => {
  console.error('Błąd w puli połączeń:', err.stack);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err.stack);
  } else {
    console.log('Połączono z bazą danych:', process.env.DB_NAME || 'szachy');
    release();
  }
});

module.exports = pool;