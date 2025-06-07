const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const pool = require('../services/db');


// Rejestracja użytkownika
exports.register = async (req, res) => {
  const { username, password } = req.body;

  // Walidacja danych
  if (!username || !password) {
    return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
  }

  try {
    // Sprawdzenie, czy użytkownik już istnieje
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Użytkownik już istnieje' });
    }

    // Haszowanie hasła
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Zapisanie użytkownika do bazy
    const userId = await userModel.createUser(username, hashedPassword);
    res.status(201).json({ message: 'Użytkownik zarejestrowany', userId });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
};

// Logowanie użytkownika
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Walidacja danych
  if (!username || !password) {
    return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
  }

  try {
    // Znalezienie użytkownika
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Sprawdzanie hasła
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }

    // Generowanie tokenu JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
};

// Weryfikacja tokena
exports.verifyToken = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Brak tokena' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!pool) {
      throw new Error('Baza danych nie jest zainicjalizowana');
    }

    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    const user = result.rows[0];
    res.json({ username: user.username });
  } catch (err) {
    console.error('Błąd weryfikacji tokena:', err.message);
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};