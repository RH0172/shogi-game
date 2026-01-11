import { create } from 'zustand';
import type {
  GameState,
  Position,
  PieceType,
  Player,
  Move,
  GameMode,
  AILevel,
  CapturedPieces,
} from '../logic/types';
import {
  createInitialBoard,
  applyMove,
  getUnpromotedPiece,
  positionEquals,
} from '../logic/board';
import {
  getLegalMoves,
  canPromote,
} from '../logic/moves';
import {
  isValidMove,
} from '../logic/validation';
import {
  checkGameStatus,
} from '../logic/judge';
import { boardToSfen, usiToMove } from '../utils/sfen';
import { getAIMove, getTimeForLevel } from '../services/aiService';

interface GameStore extends GameState {
  // AI state
  isAIThinking: boolean;

  // Actions
  selectSquare: (pos: Position) => void;
  selectCapturedPiece: (piece: PieceType | null) => void;
  makeMove: (to: Position, promote?: boolean) => void;
  resign: () => void;
  newGame: (mode: GameMode, aiLevel?: AILevel) => void;
  clearSelection: () => void;
  requestAIMove: () => Promise<void>;
}

const createInitialState = (): Omit<GameState, 'gameMode' | 'aiLevel'> => ({
  board: createInitialBoard(),
  capturedPieces: { sente: [], gote: [] },
  currentPlayer: 'sente',
  gameStatus: 'playing',
  winner: null,
  selectedSquare: null,
  selectedCapturedPiece: null,
  legalMoves: [],
  lastMove: null,
  moveHistory: [],
  positionHistory: [],
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  gameMode: 'pvp',
  aiLevel: 'medium',
  isAIThinking: false,

  selectSquare: (pos: Position) => {
    const state = get();

    // Game is over
    if (state.gameStatus === 'checkmate' || state.gameStatus === 'resigned') {
      return;
    }

    // Clear captured piece selection
    if (state.selectedCapturedPiece) {
      set({ selectedCapturedPiece: null, legalMoves: [] });
    }

    const piece = state.board[pos.row][pos.col];

    // Clicking on own piece - select it
    if (piece && piece.owner === state.currentPlayer) {
      const legalMoves = getLegalMoves(state.board, pos, state.capturedPieces);
      set({
        selectedSquare: pos,
        legalMoves,
      });
      return;
    }

    // Clicking on a legal move square - make the move
    if (state.selectedSquare) {
      const isLegalMove = state.legalMoves.some(move =>
        positionEquals(move, pos)
      );

      if (isLegalMove) {
        // Check if promotion is possible
        const selectedPiece = state.board[state.selectedSquare.row][state.selectedSquare.col];
        if (selectedPiece) {
          const promotionStatus = canPromote(
            selectedPiece,
            state.selectedSquare,
            pos,
            state.currentPlayer
          );

          if (promotionStatus === 'required') {
            // Auto-promote
            get().makeMove(pos, true);
          } else if (promotionStatus === 'optional') {
            // UI should show promotion dialog - for now, don't auto-promote
            // The makeMove will be called by the dialog
            get().makeMove(pos, false);
          } else {
            // No promotion
            get().makeMove(pos, false);
          }
        }
      } else {
        // Clicked on invalid square - clear selection
        set({ selectedSquare: null, legalMoves: [] });
      }
      return;
    }

    // Deselect
    set({ selectedSquare: null, legalMoves: [] });
  },

  selectCapturedPiece: (piece: PieceType | null) => {
    const state = get();

    // Game is over
    if (state.gameStatus === 'checkmate' || state.gameStatus === 'resigned') {
      return;
    }

    // Clear square selection
    if (state.selectedSquare) {
      set({ selectedSquare: null, legalMoves: [] });
    }

    if (!piece) {
      set({ selectedCapturedPiece: null, legalMoves: [] });
      return;
    }

    // Check if player has this piece
    const playerCaptured = state.currentPlayer === 'sente'
      ? state.capturedPieces.sente
      : state.capturedPieces.gote;

    if (!playerCaptured.includes(piece)) {
      return;
    }

    // Find all legal drop positions
    const legalMoves: Position[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const pos = { row, col };
        // Empty square only
        if (state.board[row][col] !== null) continue;

        const move: Move = {
          from: null,
          to: pos,
          piece,
          promote: false,
        };

        if (isValidMove(state.board, move, state.currentPlayer, state.capturedPieces)) {
          legalMoves.push(pos);
        }
      }
    }

    set({
      selectedCapturedPiece: piece,
      legalMoves,
    });
  },

  makeMove: (to: Position, promote: boolean = false) => {
    const state = get();

    let move: Move;

    // Drop move
    if (state.selectedCapturedPiece) {
      move = {
        from: null,
        to,
        piece: state.selectedCapturedPiece,
        promote: false,
      };
    }
    // Normal move
    else if (state.selectedSquare) {
      const piece = state.board[state.selectedSquare.row][state.selectedSquare.col];
      if (!piece) return;

      const capturedPiece = state.board[to.row][to.col];
      move = {
        from: state.selectedSquare,
        to,
        piece: piece.type,
        promote,
        captured: capturedPiece?.type,
      };
    } else {
      return;
    }

    // Validate move
    if (!isValidMove(state.board, move, state.currentPlayer, state.capturedPieces)) {
      return;
    }

    // Apply move
    const newBoard = applyMove(state.board, move);

    // Update captured pieces
    const newCapturedPieces: CapturedPieces = {
      sente: [...state.capturedPieces.sente],
      gote: [...state.capturedPieces.gote],
    };

    if (move.from === null) {
      // Remove dropped piece from captured
      const playerCaptured = state.currentPlayer === 'sente'
        ? newCapturedPieces.sente
        : newCapturedPieces.gote;
      const index = playerCaptured.indexOf(move.piece);
      if (index !== -1) {
        playerCaptured.splice(index, 1);
      }
    } else if (move.captured) {
      // Add captured piece (unpromoted)
      const unpromotedPiece = getUnpromotedPiece(move.captured);
      if (state.currentPlayer === 'sente') {
        newCapturedPieces.sente.push(unpromotedPiece);
      } else {
        newCapturedPieces.gote.push(unpromotedPiece);
      }
    }

    // Switch player
    const nextPlayer: Player = state.currentPlayer === 'sente' ? 'gote' : 'sente';

    // Generate current SFEN for position history
    const currentSfen = boardToSfen(newBoard, nextPlayer, newCapturedPieces, state.moveHistory.length + 1);

    // Check game status
    const gameStatus = checkGameStatus(newBoard, nextPlayer, state.positionHistory, newCapturedPieces, currentSfen);
    const winner = gameStatus === 'checkmate' ? state.currentPlayer : null;

    // Update state
    set({
      board: newBoard,
      capturedPieces: newCapturedPieces,
      currentPlayer: nextPlayer,
      gameStatus,
      winner,
      selectedSquare: null,
      selectedCapturedPiece: null,
      legalMoves: [],
      lastMove: move,
      moveHistory: [...state.moveHistory, move],
      positionHistory: [...state.positionHistory, currentSfen],
    });

    // If game is not over and it's PvE mode and AI's turn, request AI move
    const newState = get();
    if (
      newState.gameMode === 'pve' &&
      newState.gameStatus === 'playing' &&
      newState.currentPlayer === 'gote' // AI is always 'gote' (second player)
    ) {
      // Request AI move asynchronously
      setTimeout(() => {
        get().requestAIMove();
      }, 500); // Small delay for better UX
    }
  },

  resign: () => {
    const state = get();
    const winner: Player = state.currentPlayer === 'sente' ? 'gote' : 'sente';
    set({
      gameStatus: 'resigned',
      winner,
    });
  },

  newGame: (mode: GameMode, aiLevel: AILevel = 'medium') => {
    set({
      ...createInitialState(),
      gameMode: mode,
      aiLevel,
    });
  },

  clearSelection: () => {
    set({
      selectedSquare: null,
      selectedCapturedPiece: null,
      legalMoves: [],
    });
  },

  requestAIMove: async () => {
    const state = get();

    // Don't request if game is over or already thinking
    if (state.gameStatus !== 'playing' || state.isAIThinking) {
      return;
    }

    // Only AI (gote) should request moves
    if (state.currentPlayer !== 'gote') {
      return;
    }

    try {
      // Set thinking state
      set({ isAIThinking: true });

      // Get current position as SFEN
      const sfen = boardToSfen(
        state.board,
        state.currentPlayer,
        state.capturedPieces,
        state.moveHistory.length + 1
      );

      // Get time limit based on difficulty
      const timeMs = getTimeForLevel(state.aiLevel);

      // Request AI move
      const usiMove = await getAIMove(sfen, timeMs);

      // Parse USI move
      const parsedMove = usiToMove(usiMove);
      if (!parsedMove) {
        throw new Error('Invalid move from AI');
      }

      // Get the piece type from the board if it's a normal move
      let piece = parsedMove.piece;
      if (parsedMove.from !== null) {
        const boardPiece = state.board[parsedMove.from.row][parsedMove.from.col];
        if (boardPiece) {
          piece = boardPiece.type;
        }
      }

      // Create the move object
      const capturedPiece = state.board[parsedMove.to.row][parsedMove.to.col];
      const aiMove: Move = {
        from: parsedMove.from,
        to: parsedMove.to,
        piece,
        promote: parsedMove.promote,
        captured: capturedPiece?.type,
      };

      // Validate and apply the move
      if (!isValidMove(state.board, aiMove, state.currentPlayer, state.capturedPieces)) {
        throw new Error('AI returned invalid move');
      }

      // Apply the move
      const newBoard = applyMove(state.board, aiMove);

      // Update captured pieces
      const newCapturedPieces: CapturedPieces = {
        sente: [...state.capturedPieces.sente],
        gote: [...state.capturedPieces.gote],
      };

      if (aiMove.from === null) {
        // Remove dropped piece from captured
        const playerCaptured = newCapturedPieces.gote;
        const index = playerCaptured.indexOf(aiMove.piece);
        if (index !== -1) {
          playerCaptured.splice(index, 1);
        }
      } else if (aiMove.captured) {
        // Add captured piece (unpromoted)
        const unpromotedPiece = getUnpromotedPiece(aiMove.captured);
        newCapturedPieces.gote.push(unpromotedPiece);
      }

      // Switch to player's turn
      const nextPlayer: Player = 'sente';

      // Generate SFEN for position history
      const currentSfen = boardToSfen(newBoard, nextPlayer, newCapturedPieces, state.moveHistory.length + 2);

      // Check game status
      const gameStatus = checkGameStatus(newBoard, nextPlayer, state.positionHistory, newCapturedPieces, currentSfen);
      const winner = gameStatus === 'checkmate' ? state.currentPlayer : null;

      // Update state
      set({
        board: newBoard,
        capturedPieces: newCapturedPieces,
        currentPlayer: nextPlayer,
        gameStatus,
        winner,
        lastMove: aiMove,
        moveHistory: [...state.moveHistory, aiMove],
        positionHistory: [...state.positionHistory, currentSfen],
        isAIThinking: false,
      });
    } catch (error) {
      console.error('Failed to get AI move:', error);
      set({ isAIThinking: false });

      // Show error to user
      alert(`AI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}));
