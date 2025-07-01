/**
 * Chess Logic Service
 * Handles high-level chess game logic including move validation, execution, and game status checking.
 * Uses FEN notation for board representation and integrates with chessBoard.js for board operations.
 */

const { parseFen, getLegalMoves, applyMove } = require('./chessBoard');

/**
 * Validates if a move is legal in the given position
 * @param {string} fen - The current position in FEN notation
 * @param {string} from - Source square (e.g., 'e2')
 * @param {string} to - Destination square (e.g., 'e4')
 * @returns {boolean} True if the move is legal, false otherwise
 * @throws {Error} If FEN is invalid or coordinates are malformed
 */
function isLegalMove(fen, from, to) {
    console.log("FEN received in isLegalMove:", fen, typeof fen);
    if (!fen || typeof fen !== 'string') {
        throw new Error('Invalid FEN: FEN must be a non-empty string');
    }
    
    if (!isValidSquare(from) || !isValidSquare(to)) {
        throw new Error('Invalid coordinates: coordinates must be in format like "e2", "a1"');
    }

    try {
        const fenData = parseFen(fen);
        const legalMoves = getLegalMoves(fenData, from);
        return legalMoves.includes(to);
    } catch (error) {
        throw new Error(`Move validation failed: ${error.message}`);
    }
}

/**
 * Executes a move and returns the new game state
 * @param {string} fen - The current position in FEN notation
 * @param {string} from - Source square (e.g., 'e2')
 * @param {string} to - Destination square (e.g., 'e4')
 * @param {string} [promotion] - Promotion piece ('q', 'r', 'b', 'n') for pawn promotion
 * @returns {Object} Object containing newFen, isCheck, isCheckmate, isStalemate
 * @throws {Error} If move is illegal or parameters are invalid
 */
function makeMove(fen, from, to, promotion = null) {
    if (!fen || typeof fen !== 'string') {
        throw new Error('Invalid FEN: FEN must be a non-empty string');
    }
    
    if (!isValidSquare(from) || !isValidSquare(to)) {
        throw new Error('Invalid coordinates: coordinates must be in format like "e2", "a1"');
    }

    if (promotion && !['q', 'r', 'b', 'n'].includes(promotion.toLowerCase())) {
        throw new Error('Invalid promotion: must be one of "q", "r", "b", "n"');
    }

    // Validate the move is legal
    if (!isLegalMove(fen, from, to)) {
        throw new Error(`Illegal move: ${from} to ${to}`);
    }

    try {
        const fenData = parseFen(fen);
        const newFenData = applyMove(fenData, from, to, promotion);
        const newFen = buildFen(newFenData);
        
        // Check game status after the move
        const isCheck = isInCheck(newFenData);
        const hasLegalMoves = checkHasLegalMoves(newFenData);
        
        const isCheckmate = isCheck && !hasLegalMoves;
        const isStalemate = !isCheck && !hasLegalMoves;

        return {
            newFen,
            isCheck,
            isCheckmate,
            isStalemate
        };
    } catch (error) {
        throw new Error(`Move execution failed: ${error.message}`);
    }
}

/**
 * Determines the current game status
 * @param {string} fen - The current position in FEN notation
 * @returns {string} Game status: 'ongoing', 'checkmate', 'stalemate', 'draw'
 * @throws {Error} If FEN is invalid
 */
function getGameStatus(fen) {
    if (!fen || typeof fen !== 'string') {
        throw new Error('Invalid FEN: FEN must be a non-empty string');
    }

    try {
        const fenData = parseFen(fen);
        
        // Check for draw conditions first
        if (isDrawByFiftyMoveRule(fenData)) {
            return 'draw';
        }
        
        if (isDrawByInsufficientMaterial(fenData)) {
            return 'draw';
        }

        // Check for checkmate/stalemate
        const isCheck = isInCheck(fenData);
        const hasLegalMoves = checkHasLegalMoves(fenData);
        
        if (!hasLegalMoves) {
            return isCheck ? 'checkmate' : 'stalemate';
        }
        
        return 'ongoing';
    } catch (error) {
        throw new Error(`Game status check failed: ${error.message}`);
    }
}

/**
 * Helper function to validate square notation
 * @param {string} square - Square in algebraic notation (e.g., 'e4')
 * @returns {boolean} True if valid square notation
 */
function isValidSquare(square) {
    if (!square || typeof square !== 'string' || square.length !== 2) {
        return false;
    }
    
    const file = square[0];
    const rank = square[1];
    
    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
}

/**
 * Checks if the current player is in check
 * @param {Object} fenData - Parsed FEN data
 * @returns {boolean} True if current player is in check
 */
function isInCheck(fenData) {
    try {
        // Find the king position for the current player
        const kingSquare = findKingSquare(fenData, fenData.activeColor);
        if (!kingSquare) {
            return false; // No king found (shouldn't happen in valid positions)
        }
        
        // Check if any opponent piece can attack the king
        return isSquareAttacked(fenData, kingSquare, fenData.activeColor === 'w' ? 'b' : 'w');
    } catch (error) {
        return false;
    }
}

/**
 * Checks if the current player has any legal moves
 * @param {Object} fenData - Parsed FEN data
 * @returns {boolean} True if player has legal moves
 */
function checkHasLegalMoves(fenData) {
    try {
        // Check all squares for pieces of the current player
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const piece = fenData.board[rank][file];
                if (piece && piece !== '-') {
                    const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
                    if (pieceColor === fenData.activeColor) {
                        const square = String.fromCharCode(97 + file) + (8 - rank);
                        const moves = getLegalMoves(fenData, square);
                        if (moves.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Finds the king square for the specified color
 * @param {Object} fenData - Parsed FEN data
 * @param {string} color - 'w' or 'b'
 * @returns {string|null} King square or null if not found
 */
function findKingSquare(fenData, color) {
    const king = color === 'w' ? 'K' : 'k';
    
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            if (fenData.board[rank][file] === king) {
                return String.fromCharCode(97 + file) + (8 - rank);
            }
        }
    }
    return null;
}

/**
 * Checks if a square is attacked by pieces of the specified color
 * @param {Object} fenData - Parsed FEN data
 * @param {string} square - Target square
 * @param {string} attackingColor - Color of attacking pieces ('w' or 'b')
 * @returns {boolean} True if square is attacked
 */
function isSquareAttacked(fenData, square, attackingColor) {
    // Create a temporary FEN with the attacking color to move
    const tempFenData = { ...fenData, activeColor: attackingColor };
    
    // Check all squares for attacking pieces
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const piece = tempFenData.board[rank][file];
            if (piece && piece !== '-') {
                const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
                if (pieceColor === attackingColor) {
                    const fromSquare = String.fromCharCode(97 + file) + (8 - rank);
                    try {
                        const moves = getLegalMoves(tempFenData, fromSquare);
                        if (moves.includes(square)) {
                            return true;
                        }
                    } catch (error) {
                        // Continue checking other pieces if one fails
                        continue;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Checks for draw by fifty-move rule
 * @param {Object} fenData - Parsed FEN data
 * @returns {boolean} True if draw by fifty-move rule
 */
function isDrawByFiftyMoveRule(fenData) {
    return fenData.halfmoveClock >= 100; // 50 moves = 100 half-moves
}

/**
 * Checks for draw by insufficient material
 * @param {Object} fenData - Parsed FEN data
 * @returns {boolean} True if draw by insufficient material
 */
function isDrawByInsufficientMaterial(fenData) {
    const pieces = [];
    
    // Collect all pieces on the board
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const piece = fenData.board[rank][file];
            if (piece && piece !== '-' && piece.toLowerCase() !== 'k') {
                pieces.push(piece.toLowerCase());
            }
        }
    }
    
    // No pieces besides kings
    if (pieces.length === 0) {
        return true;
    }
    
    // Only one knight or bishop
    if (pieces.length === 1 && (pieces[0] === 'n' || pieces[0] === 'b')) {
        return true;
    }
    
    // Both sides have only bishops on same color squares
    if (pieces.length === 2 && pieces.every(p => p === 'b')) {
        // This is a simplified check - in practice, we'd need to verify
        // that bishops are on same-colored squares
        return true;
    }
    
    return false;
}

/**
 * Builds FEN string from parsed FEN data
 * @param {Object} fenData - Parsed FEN data
 * @returns {string} FEN string
 */
function buildFen(fenData) {
    // Build piece placement
    let placement = '';
    for (let rank = 0; rank < 8; rank++) {
        let emptyCount = 0;
        let rankStr = '';
        
        for (let file = 0; file < 8; file++) {
            const piece = fenData.board[rank][file];
            if (piece === '-') {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rankStr += emptyCount;
                    emptyCount = 0;
                }
                rankStr += piece;
            }
        }
        
        if (emptyCount > 0) {
            rankStr += emptyCount;
        }
        
        placement += rankStr;
        if (rank < 7) placement += '/';
    }
    
    // Build castling availability
    let castling = '';
    if (fenData.castlingRights.whiteKingside) castling += 'K';
    if (fenData.castlingRights.whiteQueenside) castling += 'Q';
    if (fenData.castlingRights.blackKingside) castling += 'k';
    if (fenData.castlingRights.blackQueenside) castling += 'q';
    if (castling === '') castling = '-';
    
    // Build en passant target
    const enPassant = fenData.enPassantTarget || '-';
    
    return `${placement} ${fenData.activeColor} ${castling} ${enPassant} ${fenData.halfmoveClock} ${fenData.fullmoveNumber}`;
}

module.exports = {
    isLegalMove,
    makeMove,
    getGameStatus
};