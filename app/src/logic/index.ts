/**
 * Shogi Game Logic - Main Export
 *
 * This module exports all the core game logic functions for the Shogi game.
 * Import from this file for easy access to all logic functionality.
 */

// Types
export * from './types';

// Board management
export {
  createInitialBoard,
  cloneBoard,
  applyMove,
  getPromotedPiece,
  getUnpromotedPiece,
  isPromoted,
  canBePromoted,
  isInBounds,
  positionEquals,
  findKing,
  boardToString,
} from './board';

// Move generation
export {
  getPieceMovementPattern,
  getLegalMoves,
  getAllLegalMoves,
  canPromote,
} from './moves';

// Validation
export {
  isNifuViolation,
  isUchifuzumeViolation,
  canPlacePiece,
  isValidMove,
  isRepetitionDraw,
} from './validation';

// Game state判定
export {
  isKingInCheck,
  isCheckmate,
  isStalemate,
  isRepetition,
  checkGameStatus,
  canDeclareWin,
  getKingEscapeSquares,
  getCheckingPieces,
} from './judge';
