const pool = require('../services/db');

exports.findByUsername = async (username) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  } catch (error) {
    console.error('Błąd zapytania:', error);
    throw error;
  }
};

exports.createUser = async (username, passwordHash) => {
  try {
    const res = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash]
    );
    return res.rows[0].id;
  } catch (error) {
    console.error('Błąd zapytania:', error);
    throw error;
  }
};