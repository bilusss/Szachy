const pool = require('../services/db');

const userModel = {
  findByUsername: async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },
  createUser: async (username, passwordHash) => {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash]
    );
    return result.rows[0].id;
  },
};

module.exports = userModel;