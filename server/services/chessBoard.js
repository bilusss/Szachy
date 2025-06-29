/**
 * Chess Board Service
 * Handles low-level board representation, FEN parsing, and move generation
 */

/**
 * Parses a FEN string into a structured board representation
 * @param {string} fen - FEN notation string
 * @returns {Object} Parsed board state with board array and metadata
 * @throws {Error} If FEN string is invalid
 */
function parseFen(fen) {
  if (!fen || typeof fen !== 'string') {
    throw new Error('Invalid FEN: must be a non-empty string');
  }

  const parts = fen.trim().split(' ');
  if (parts.length !== 6) {
    throw new Error('Invalid FEN: must have 6 parts separated by spaces');
  }

  const [piecePlacement, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber] = parts;

  // Parse piece placement
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = piecePlacement.split('/');
  
  if (rows.length !== 8) {
    throw new Error('Invalid FEN: piece placement must have 8 ranks');
  }

  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else if ('pnbrqkPNBRQK'.includes(char)) {
        if (file >= 8) throw new Error('Invalid FEN: rank overflow');
        board[rank][file] = char;
        file++;
      } else {
        throw new Error(`Invalid FEN: invalid character '${char}' in piece placement`);
      }
    }
    if (file !== 8) throw new Error('Invalid FEN: incomplete rank');
  }

  // Validate other parts
  if (activeColor !== 'w' && activeColor !== 'b') {
    throw new Error('Invalid FEN: active color must be w or b');
  }

  if (!/^(-|[KQkq]{1,4})$/.test(castlingRights)) {
    throw new Error('Invalid FEN: invalid castling rights');
  }

  if (!/^(-|[a-h][36])$/.test(enPassantTarget)) {
    throw new Error('Invalid FEN: invalid en passant target');
  }

  const halfmove = parseInt(halfmoveClock);
  const fullmove = parseInt(fullmoveNumber);
  
  if (isNaN(halfmove) || halfmove < 0) {
    throw new Error('Invalid FEN: halfmove clock must be a non-negative integer');
  }
  
  if (isNaN(fullmove) || fullmove < 1) {
    throw new Error('Invalid FEN: fullmove number must be a positive integer');
  }

  return {
    board,
    turn: activeColor,
    castling: castlingRights,
    enPassant: enPassantTarget,
    halfmove,
    fullmove
  };
}

/**
 * Converts board state back to FEN string
 * @param {Object} boardState - Board state object
 * @returns {string} FEN notation string
 */
function boardToFen(boardState) {
  const { board, turn, castling, enPassant, halfmove, fullmove } = boardState;
  
  // Convert board to piece placement
  const ranks = [];
  for (let rank = 0; rank < 8; rank++) {
    let rankStr = '';
    let emptyCount = 0;
    
    for (let file = 0; file < 8; file++) {
      if (board[rank][file]) {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        rankStr += board[rank][file];
      } else {
        emptyCount++;
      }
    }
    
    if (emptyCount > 0) {
      rankStr += emptyCount;
    }
    ranks.push(rankStr);
  }
  
  return `${ranks.join('/')} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

/**
 * Converts square notation to array indices
 * @param {string} square - Square in algebraic notation (e.g., 'e4')
 * @returns {Array} [rank, file] indices
 */
function squareToIndices(square) {
  if (!square || square.length !== 2) {
    throw new Error('Invalid square notation');
  }
  
  const file = square.charCodeAt(0) - 97; // 'a' = 0
  const rank = 8 - parseInt(square[1]); // '8' = 0
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error('Square out of bounds');
  }
  
  return [rank, file];
}

/**
 * Converts array indices to square notation
 * @param {number} rank - Rank index (0-7)
 * @param {number} file - File index (0-7)
 * @returns {string} Square in algebraic notation
 */
function indicesToSquare(rank, file) {
  return String.fromCharCode(97 + file) + (8 - rank);
}

/**
 * Checks if a square is under attack by the opponent
 * @param {Array} board - 8x8 board array
 * @param {number} rank - Target rank
 * @param {number} file - Target file
 * @param {string} color - Color of the defending piece ('w' or 'b')
 * @returns {boolean} True if square is under attack
 */
function isSquareAttacked(board, rank, file, color) {
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  // Check pawn attacks
  const pawnRank = color === 'w' ? rank + 1 : rank - 1;
  if (pawnRank >= 0 && pawnRank < 8) {
    const pawn = opponentColor === 'w' ? 'P' : 'p';
    if (file > 0 && board[pawnRank][file - 1] === pawn) return true;
    if (file < 7 && board[pawnRank][file + 1] === pawn) return true;
  }
  
  // Check knight attacks
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const knight = opponentColor === 'w' ? 'N' : 'n';
  for (const [dr, df] of knightMoves) {
    const newRank = rank + dr;
    const newFile = file + df;
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      if (board[newRank][newFile] === knight) return true;
    }
  }
  
  // Check sliding piece attacks (bishop, rook, queen)
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Rook directions
    [-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop directions
  ];
  
  for (let i = 0; i < directions.length; i++) {
    const [dr, df] = directions[i];
    const isRookDirection = i < 4;
    
    for (let step = 1; step < 8; step++) {
      const newRank = rank + dr * step;
      const newFile = file + df * step;
      
      if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
      
      const piece = board[newRank][newFile];
      if (piece) {
        const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
        if (pieceColor === opponentColor) {
          const pieceType = piece.toLowerCase();
          if (pieceType === 'q' || 
              (isRookDirection && pieceType === 'r') ||
              (!isRookDirection && pieceType === 'b')) {
            return true;
          }
        }
        break;
      }
    }
  }
  
  // Check king attacks
  const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const king = opponentColor === 'w' ? 'K' : 'k';
  for (const [dr, df] of kingMoves) {
    const newRank = rank + dr;
    const newFile = file + df;
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      if (board[newRank][newFile] === king) return true;
    }
  }
  
  return false;
}

/**
 * Finds the king position for a given color
 * @param {Array} board - 8x8 board array
 * @param {string} color - Color of the king ('w' or 'b')
 * @returns {Array|null} [rank, file] of king or null if not found
 */
function findKing(board, color) {
  const king = color === 'w' ? 'K' : 'k';
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (board[rank][file] === king) {
        return [rank, file];
      }
    }
  }
  return null;
}

/**
 * Generates possible moves for a piece (without checking for check)
 * @param {Array} board - 8x8 board array
 * @param {number} rank - Piece rank
 * @param {number} file - Piece file
 * @param {string} enPassant - En passant target square
 * @param {string} castling - Castling rights
 * @returns {Array} Array of possible move squares
 */
function generatePieceMoves(board, rank, file, enPassant, castling) {
  const piece = board[rank][file];
  if (!piece) return [];
  
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const pieceType = piece.toLowerCase();
  const moves = [];
  
  switch (pieceType) {
    case 'p':
      // Pawn moves
      const direction = color === 'w' ? -1 : 1;
      const startRank = color === 'w' ? 6 : 1;
      
      // Forward moves
      if (rank + direction >= 0 && rank + direction < 8 && !board[rank + direction][file]) {
        moves.push(indicesToSquare(rank + direction, file));
        
        // Double move from starting position
        if (rank === startRank && !board[rank + 2 * direction][file]) {
          moves.push(indicesToSquare(rank + 2 * direction, file));
        }
      }
      
      // Captures
      for (const df of [-1, 1]) {
        const newFile = file + df;
        if (newFile >= 0 && newFile < 8 && rank + direction >= 0 && rank + direction < 8) {
          const target = board[rank + direction][newFile];
          if (target && (target === target.toUpperCase()) !== (color === 'w')) {
            moves.push(indicesToSquare(rank + direction, newFile));
          }
          
          // En passant
          if (enPassant !== '-' && indicesToSquare(rank + direction, newFile) === enPassant) {
            moves.push(enPassant);
          }
        }
      }
      break;
      
    case 'n':
      // Knight moves
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      for (const [dr, df] of knightMoves) {
        const newRank = rank + dr;
        const newFile = file + df;
        if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
          const target = board[newRank][newFile];
          if (!target || (target === target.toUpperCase()) !== (color === 'w')) {
            moves.push(indicesToSquare(newRank, newFile));
          }
        }
      }
      break;
      
    case 'b':
      // Bishop moves
      const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, df] of bishopDirections) {
        for (let step = 1; step < 8; step++) {
          const newRank = rank + dr * step;
          const newFile = file + df * step;
          
          if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
          
          const target = board[newRank][newFile];
          if (!target) {
            moves.push(indicesToSquare(newRank, newFile));
          } else {
            if ((target === target.toUpperCase()) !== (color === 'w')) {
              moves.push(indicesToSquare(newRank, newFile));
            }
            break;
          }
        }
      }
      break;
      
    case 'r':
      // Rook moves
      const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, df] of rookDirections) {
        for (let step = 1; step < 8; step++) {
          const newRank = rank + dr * step;
          const newFile = file + df * step;
          
          if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
          
          const target = board[newRank][newFile];
          if (!target) {
            moves.push(indicesToSquare(newRank, newFile));
          } else {
            if ((target === target.toUpperCase()) !== (color === 'w')) {
              moves.push(indicesToSquare(newRank, newFile));
            }
            break;
          }
        }
      }
      break;
      
    case 'q':
      // Queen moves (combination of rook and bishop)
      const queenDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, df] of queenDirections) {
        for (let step = 1; step < 8; step++) {
          const newRank = rank + dr * step;
          const newFile = file + df * step;
          
          if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
          
          const target = board[newRank][newFile];
          if (!target) {
            moves.push(indicesToSquare(newRank, newFile));
          } else {
            if ((target === target.toUpperCase()) !== (color === 'w')) {
              moves.push(indicesToSquare(newRank, newFile));
            }
            break;
          }
        }
      }
      break;
      
    case 'k':
      // King moves
      const kingDirections = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      for (const [dr, df] of kingDirections) {
        const newRank = rank + dr;
        const newFile = file + df;
        if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
          const target = board[newRank][newFile];
          if (!target || (target === target.toUpperCase()) !== (color === 'w')) {
            moves.push(indicesToSquare(newRank, newFile));
          }
        }
      }
      
      // Castling
      if (castling !== '-') {
        const kingRank = color === 'w' ? 7 : 0;
        if (rank === kingRank && file === 4) {
          // Kingside castling
          if ((color === 'w' && castling.includes('K')) || (color === 'b' && castling.includes('k'))) {
            if (!board[kingRank][5] && !board[kingRank][6] && board[kingRank][7] === (color === 'w' ? 'R' : 'r')) {
              if (!isSquareAttacked(board, kingRank, 4, color) &&
                  !isSquareAttacked(board, kingRank, 5, color) &&
                  !isSquareAttacked(board, kingRank, 6, color)) {
                moves.push(indicesToSquare(kingRank, 6));
              }
            }
          }
          
          // Queenside castling
          if ((color === 'w' && castling.includes('Q')) || (color === 'b' && castling.includes('q'))) {
            if (!board[kingRank][3] && !board[kingRank][2] && !board[kingRank][1] && board[kingRank][0] === (color === 'w' ? 'R' : 'r')) {
              if (!isSquareAttacked(board, kingRank, 4, color) &&
                  !isSquareAttacked(board, kingRank, 3, color) &&
                  !isSquareAttacked(board, kingRank, 2, color)) {
                moves.push(indicesToSquare(kingRank, 2));
              }
            }
          }
        }
      }
      break;
  }
  
  return moves;
}

/**
 * Gets all legal moves for a piece on a given square
 * @param {string} fen - Current FEN position
 * @param {string} square - Square in algebraic notation
 * @returns {Array} Array of legal move squares
 * @throws {Error} If FEN or square is invalid
 */
function getLegalMoves(fen, square) {
  const boardState = parseFen(fen);
  const [rank, file] = squareToIndices(square);
  
  const piece = boardState.board[rank][file];
  if (!piece) {
    return [];
  }
  
  const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
  if (pieceColor !== boardState.turn) {
    return [];
  }
  
  const possibleMoves = generatePieceMoves(boardState.board, rank, file, boardState.enPassant, boardState.castling);
  const legalMoves = [];
  
  // Filter moves that would leave king in check
  for (const move of possibleMoves) {
    const testFen = applyMove(fen, square, move);
    const testBoard = parseFen(testFen);
    const kingPos = findKing(testBoard.board, pieceColor);
    
    if (kingPos && !isSquareAttacked(testBoard.board, kingPos[0], kingPos[1], pieceColor)) {
      legalMoves.push(move);
    }
  }
  
  return legalMoves;
}

/**
 * Applies a move to the board and returns the new FEN
 * @param {string} fen - Current FEN position
 * @param {string} from - Source square
 * @param {string} to - Target square
 * @param {string} promotion - Promotion piece (optional)
 * @returns {string} New FEN string after the move
 * @throws {Error} If move is invalid
 */
function applyMove(fen, from, to, promotion = null) {
  const boardState = parseFen(fen);
  const [fromRank, fromFile] = squareToIndices(from);
  const [toRank, toFile] = squareToIndices(to);
  
  const piece = boardState.board[fromRank][fromFile];
  if (!piece) {
    throw new Error('No piece on source square');
  }
  
  const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
  if (pieceColor !== boardState.turn) {
    throw new Error('Not your turn');
  }
  
  // Create new board state
  const newBoard = boardState.board.map(row => [...row]);
  let newCastling = boardState.castling;
  let newEnPassant = '-';
  let newHalfmove = boardState.halfmove + 1;
  let newFullmove = boardState.fullmove;
  
  // Handle captures and pawn moves (reset halfmove counter)
  if (newBoard[toRank][toFile] || piece.toLowerCase() === 'p') {
    newHalfmove = 0;
  }
  
  // Make the move
  newBoard[fromRank][fromFile] = null;
  newBoard[toRank][toFile] = piece;
  
  // Handle special moves
  const pieceType = piece.toLowerCase();
  
  // Pawn special moves
  if (pieceType === 'p') {
    // En passant capture
    if (to === boardState.enPassant) {
      const captureRank = pieceColor === 'w' ? toRank + 1 : toRank - 1;
      newBoard[captureRank][toFile] = null;
    }
    
    // Double pawn move (set en passant target)
    if (Math.abs(toRank - fromRank) === 2) {
      newEnPassant = indicesToSquare(fromRank + (toRank - fromRank) / 2, fromFile);
    }
    
    // Promotion
    if ((pieceColor === 'w' && toRank === 0) || (pieceColor === 'b' && toRank === 7)) {
      if (!promotion || !'nbrq'.includes(promotion.toLowerCase())) {
        promotion = 'q'; // Default to queen
      }
      newBoard[toRank][toFile] = pieceColor === 'w' ? promotion.toUpperCase() : promotion.toLowerCase();
    }
  }
  
  // King moves (update castling rights and handle castling)
  if (pieceType === 'k') {
    if (pieceColor === 'w') {
      newCastling = newCastling.replace(/[KQ]/g, '');
      
      // Kingside castling
      if (from === 'e1' && to === 'g1') {
        newBoard[7][7] = null; // Remove rook
        newBoard[7][5] = 'R';  // Place rook
      }
      // Queenside castling
      else if (from === 'e1' && to === 'c1') {
        newBoard[7][0] = null; // Remove rook
        newBoard[7][3] = 'R';  // Place rook
      }
    } else {
      newCastling = newCastling.replace(/[kq]/g, '');
      
      // Kingside castling
      if (from === 'e8' && to === 'g8') {
        newBoard[0][7] = null; // Remove rook
        newBoard[0][5] = 'r';  // Place rook
      }
      // Queenside castling
      else if (from === 'e8' && to === 'c8') {
        newBoard[0][0] = null; // Remove rook
        newBoard[0][3] = 'r';  // Place rook
      }
    }
  }
  
  // Rook moves (update castling rights)
  if (pieceType === 'r') {
    if (from === 'a1') newCastling = newCastling.replace('Q', '');
    if (from === 'h1') newCastling = newCastling.replace('K', '');
    if (from === 'a8') newCastling = newCastling.replace('q', '');
    if (from === 'h8') newCastling = newCastling.replace('k', '');
  }
  
  // Rook captured (update castling rights)
  if (to === 'a1') newCastling = newCastling.replace('Q', '');
  if (to === 'h1') newCastling = newCastling.replace('K', '');
  if (to === 'a8') newCastling = newCastling.replace('q', '');
  if (to === 'h8') newCastling = newCastling.replace('k', '');
  
  if (newCastling === '') newCastling = '-';
  
  // Update turn and fullmove counter
  const newTurn = boardState.turn === 'w' ? 'b' : 'w';
  if (newTurn === 'w') {
    newFullmove++;
  }
  
  return boardToFen({
    board: newBoard,
    turn: newTurn,
    castling: newCastling,
    enPassant: newEnPassant,
    halfmove: newHalfmove,
    fullmove: newFullmove
  });
}

module.exports = {
  parseFen,
  getLegalMoves,
  applyMove,
  boardToFen,
  squareToIndices,
  indicesToSquare,
  isSquareAttacked,
  findKing
};