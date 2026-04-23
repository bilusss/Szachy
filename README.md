# Multiplayer Chess ♟️

A real-time multiplayer chess application built with React, Node.js, Socket.io, and PostgreSQL. Play chess with friends in your browser — no account required to jump in.

![Demo](docs/video.gif)

## Features

- **Real-time gameplay** — moves sync instantly between players via WebSockets
- **Full chess rules** — move validation, check, checkmate, and stalemate detection
- **Game lobby** — create or join rooms to play with others
- **User accounts** — register and log in; match history stored in PostgreSQL
- **Live chat** — in-game chat between players
- **Responsive UI** — built with Tailwind CSS, works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Database | PostgreSQL |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bilusss/Szachy.git
   cd Szachy
   ```

2. **Set up the database**

   Create a PostgreSQL database and update the connection config in `server/db.js`:
   ```js
   user: 'admin',
   host: 'localhost',
   database: 'szachy',
   password: 'password',
   port: 5432
   ```

3. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Run the app**

   In one terminal (backend):
   ```bash
   cd server && npm start
   ```

   In another terminal (frontend):
   ```bash
   cd client && npm run dev
   ```

5. Open `http://localhost:5173` in your browser and start playing.

## Recommended VS Code Extensions

- **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
- **ESLint** — JavaScript linting
- **Prettier** — code formatting
- **PostgreSQL** — database explorer inside VS Code

## Project Structure

```
Szachy/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # Board, Lobby, Login, Chat
│   │   └── ...
│   └── package.json
├── server/          # Node.js backend
│   ├── index.js     # Express + Socket.io server
│   ├── db.js        # PostgreSQL connection
│   └── package.json
└── docs/
    └── video.gif
```

## License

MIT
