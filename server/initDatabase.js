const { Pool, Client } = require('pg');
const fs = require('fs');

// Najpierw łączymy się z domyślną bazą postgres, aby stworzyć szachy
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
});

async function initDatabase() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE szachy');
    console.log('Baza danych szachy utworzona');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Baza danych szachy już istnieje');
    } else {
      console.error('Błąd tworzenia bazy danych:', error);
      return;
    }
  } finally {
    await client.end();
  }

  // Teraz łączymy się z bazą szachy, aby stworzyć tabele
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'szachy',
    password: 'password',
    port: 5432,
  });

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