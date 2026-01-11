import { useGameStore } from '../store/gameStore';
import type { Position, PieceType } from '../logic/types';

/**
 * Custom hook for accessing game store
 * Provides convenient access to game state and actions
 */
export const useGame = () => {
  const store = useGameStore();

  return {
    // State
    board: store.board,
    capturedPieces: store.capturedPieces,
    currentPlayer: store.currentPlayer,
    gameStatus: store.gameStatus,
    winner: store.winner,
    selectedSquare: store.selectedSquare,
    selectedCapturedPiece: store.selectedCapturedPiece,
    legalMoves: store.legalMoves,
    lastMove: store.lastMove,
    gameMode: store.gameMode,
    aiLevel: store.aiLevel,
    moveHistory: store.moveHistory,
    isAIThinking: store.isAIThinking,

    // Actions
    selectSquare: store.selectSquare,
    selectCapturedPiece: store.selectCapturedPiece,
    makeMove: store.makeMove,
    resign: store.resign,
    newGame: store.newGame,
    clearSelection: store.clearSelection,
    requestAIMove: store.requestAIMove,

    // Helper functions
    isSquareSelected: (pos: Position): boolean => {
      if (!store.selectedSquare) return false;
      return store.selectedSquare.row === pos.row && store.selectedSquare.col === pos.col;
    },

    isLegalMove: (pos: Position): boolean => {
      return store.legalMoves.some(
        move => move.row === pos.row && move.col === pos.col
      );
    },

    isLastMoveSquare: (pos: Position): boolean => {
      if (!store.lastMove) return false;
      if (store.lastMove.from &&
          store.lastMove.from.row === pos.row &&
          store.lastMove.from.col === pos.col) {
        return true;
      }
      if (store.lastMove.to.row === pos.row && store.lastMove.to.col === pos.col) {
        return true;
      }
      return false;
    },

    isCapturedPieceSelected: (piece: PieceType): boolean => {
      return store.selectedCapturedPiece === piece;
    },
  };
};
