const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'szachy',
  password: 'password',
  port: 5432,
});

async function initDatabase() {
  try {
    const sql = fs.readFileSync('../database/init.sql', 'utf8');
    await pool.query(sql);
    console.log('Baza danych zainicjalizowana pomyślnie');
  } catch (error) {
    console.error('Błąd inicjalizacji bazy danych:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();