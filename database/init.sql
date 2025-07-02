-- Tworzenie tabeli użytkowników
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opcjonalnie: Indeksy dla wydajności (jeśli potrzebujesz)
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- Tworzenie tabeli gier
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  white_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  black_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL dla bota
  fen TEXT NOT NULL, -- Dodano kolumnę fen
  current_turn TEXT NOT NULL DEFAULT 'w',
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, ongoing, finished
  result TEXT, -- checkmate, draw, resigned, timeout
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tworzenie tabeli ruchów
CREATE TABLE IF NOT EXISTS moves (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL dla bota
  from_square VARCHAR(2) NOT NULL, -- np. 'e2'
  to_square VARCHAR(2) NOT NULL, -- np. 'e4'
  promotion VARCHAR(1),
  move_number INTEGER NOT NULL, -- numer ruchu w grze
  fen TEXT NOT NULL, -- FEN po ruchu
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_game_id ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_player_id ON moves(player_id);