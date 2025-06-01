exports.getGames = (req, res) => {
  // Placeholder: na razie zwracamy statyczną listę gier
  const games = [
    { id: 1, creator: 'Player1', status: 'open' },
    { id: 2, creator: 'Player2', status: 'open' },
  ];
  res.json(games);
};

exports.createGame = (req, res) => {
  // Placeholder: na razie zwracamy przykładową grę
  const newGame = { id: Date.now(), creator: 'CurrentUser', status: 'open' };
  res.status(201).json(newGame);
};