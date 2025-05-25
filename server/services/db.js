const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'szachy',
  password: 'password',
  port: 5432,
});

module.exports = pool;