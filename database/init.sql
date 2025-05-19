-- Tworzenie tabeli użytkowników
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opcjonalnie: Indeksy dla wydajności (jeśli potrzebujesz)
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- Tworzenie historie partii (pózniej)