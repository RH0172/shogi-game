# Shogi Game Logic - Phase 3-2 Implementation

## Overview

This directory contains the complete core game logic for Shogi (Japanese Chess), implemented as a framework-agnostic TypeScript library. The logic layer is completely separated from the UI, making it testable and reusable.

## File Structure

```
logic/
├── types.ts         # Type definitions for all game entities
├── board.ts         # Board state management and manipulation
├── moves.ts         # Legal move generation for all pieces
├── validation.ts    # Special Shogi rules validation
├── judge.ts         # Game state determination (check, checkmate, etc.)
├── index.ts         # Main export file
├── demo.ts          # Demonstration/testing script
└── README.md        # This file
```

## Core Modules

### 1. types.ts - Type Definitions

Defines all TypeScript types used throughout the game:

```typescript
// Piece types: FU, KY, KE, GI, KI, KA, HI, OU (+ promoted versions)
type PieceType = 'FU' | 'KY' | 'KE' | 'GI' | 'KI' | 'KA' | 'HI' | 'OU' | 'TO' | 'NY' | 'NK' | 'NG' | 'UM' | 'RY';

// Players: sente (first/lower) or gote (second/upper)
type Player = 'sente' | 'gote';

// Position on the 9x9 board
interface Position { row: number; col: number; }

// Piece with owner
interface Piece { type: PieceType; owner: Player; }

// Move representation
interface Move {
  from: Position | null;  // null = drop from hand
  to: Position;
  piece: PieceType;
  promote?: boolean;
  captured?: PieceType;
}

// Board is 9x9 array
type Board = (Piece | null)[][];

// Captured pieces (持ち駒)
interface CapturedPieces {
  sente: PieceType[];
  gote: PieceType[];
}
```

### 2. board.ts - Board State Management

**Key Functions:**

- `createInitialBoard(): Board`
  - Generates the standard Shogi starting position
  - All 40 pieces in correct positions

- `applyMove(board: Board, move: Move): Board`
  - Immutable: returns new board with move applied
  - Handles normal moves, captures, and promotions
  - Handles piece drops from captured pieces

- `cloneBoard(board: Board): Board`
  - Deep copy of board state
  - Ensures immutability

- `getPromotedPiece(pieceType: PieceType): PieceType`
  - Returns promoted version: FU→TO, KA→UM, HI→RY, etc.

- `getUnpromotedPiece(pieceType: PieceType): PieceType`
  - Returns base piece: TO→FU, UM→KA, RY→HI, etc.
  - Used when pieces are captured

**Helper Functions:**
- `isInBounds(pos)` - Validates position is within 9x9 board
- `findKing(board, player)` - Locates king position
- `boardToString(board)` - Pretty-print board for debugging

### 3. moves.ts - Legal Move Generation

**Key Functions:**

- `getPieceMovementPattern(pieceType, position, player)`
  - Returns basic movement vectors for each piece type
  - Accounts for player direction (sente moves up, gote moves down)
  - Returns `{ moves: Position[], isRanged: boolean }`

**Piece Movement Rules:**
- **歩 (FU)**: Forward 1
- **香 (KY)**: Forward unlimited (ranged)
- **桂 (KE)**: L-shape: 2 forward + 1 left/right
- **銀 (GI)**: 5 directions (3 forward diagonals, 2 back diagonals)
- **金 (KI)**: 6 directions (3 forward, 2 sides, 1 back)
- **角 (KA)**: Diagonal unlimited (ranged)
- **飛 (HI)**: Orthogonal unlimited (ranged)
- **王 (OU)**: 8 directions, 1 square
- **と/成香/成桂/成銀**: Gold movement (6 directions)
- **馬 (UM)**: Bishop + king (diagonal unlimited + orthogonal 1)
- **竜 (RY)**: Rook + king (orthogonal unlimited + diagonal 1)

- `getLegalMoves(board, position, capturedPieces?)`
  - Filters movement patterns by:
    1. Board boundaries
    2. Own piece blocking
    3. Path blocking (ranged pieces)
    4. **王手放置** prevention (cannot leave own king in check)

- `getAllLegalMoves(board, player, capturedPieces)`
  - Returns ALL legal moves for a player
  - Includes board moves AND piece drops
  - Used for checkmate detection

- `canPromote(piece, from, to, player)`
  - Returns: `'required'` | `'optional'` | `'forbidden'`
  - **Required**: Piece would have no moves from destination
    - FU/KY on first rank
    - KE on first/second rank
  - **Optional**: Moving into or within enemy territory (敵陣)
  - **Forbidden**: Cannot promote (already promoted, or not in enemy zone)

### 4. validation.ts - Special Rules

**Key Functions:**

- `isNifuViolation(board, move, player): boolean`
  - **二歩 (Nifu)**: Double pawn rule
  - Cannot drop a pawn in a column that already has an unpromoted pawn
  - Only applies to drops, not moves

- `isUchifuzumeViolation(board, move, player): boolean`
  - **打ち歩詰め (Uchifuzume)**: Pawn drop checkmate rule
  - Cannot drop a pawn that directly causes immediate checkmate
  - Most complex rule: checks if checkmate exists only because of the dropped pawn

- `canPlacePiece(board, piece, position, player): boolean`
  - **行き所のない駒**: Piece with no legal moves
  - FU/KY cannot drop on first rank (cannot move forward)
  - KE cannot drop on first/second rank (cannot jump forward)

- `isValidMove(board, move, player, capturedPieces): boolean`
  - Comprehensive validation combining:
    - Bounds checking
    - Piece ownership
    - Legal move verification
    - Special rules (二歩、打ち歩詰め、行き所のない駒)
    - 王手放置 prevention

### 5. judge.ts - Game State Determination

**Key Functions:**

- `isKingInCheck(board, player): boolean`
  - **王手 (Check)**: King under attack
  - Checks if any opponent piece can capture the king
  - Handles ranged pieces with path blocking

- `isCheckmate(board, player, capturedPieces): boolean`
  - **詰み (Tsumi)**: Checkmate
  - King is in check AND no legal moves exist
  - Checks all possible moves (board + drops)

- `isStalemate(board, player, capturedPieces): boolean`
  - No legal moves but king is NOT in check
  - Rare in Shogi (unlike chess)

- `isRepetition(positionHistory, currentSfen): boolean`
  - **千日手 (Sennichite)**: Repetition draw
  - Same position occurs 4 times → draw

- `checkGameStatus(board, player, positionHistory, capturedPieces, currentSfen?)`
  - Returns overall game state:
    - `'playing'` - Normal game in progress
    - `'check'` - King is in check
    - `'checkmate'` - Game over, player loses
    - `'stalemate'` - No legal moves (rare)
    - `'repetition'` - Draw by repetition

- `canDeclareWin(board, player): boolean`
  - **入玉宣言勝ち (Nyuugyoku)**: Entering king win
  - King enters enemy camp with 24+ points
  - Advanced rule (optional to implement in UI)

**Helper Functions:**
- `getKingEscapeSquares(board, player)` - Find where king can escape
- `getCheckingPieces(board, player)` - Find which pieces are giving check

## SFEN Support (utils/sfen.ts)

The SFEN module provides position serialization:

- `boardToSfen(board, player, capturedPieces, moveNumber): string`
  - Converts game state to SFEN notation
  - Format: `<board> <turn> <hand> <movenum>`
  - Example: `lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1`

- `sfenToBoard(sfen): { board, player, capturedPieces, moveNumber }`
  - Parses SFEN back to game state
  - Validates format

- `moveToUsi(move): string` - Convert move to USI engine format
- `usiToMove(usi): Move` - Parse USI move string

**Use Cases:**
- Position history tracking (for 千日手 detection)
- Save/load game state
- Communication with USI engines
- Game replay

## Usage Examples

### Basic Game Flow

```typescript
import {
  createInitialBoard,
  getLegalMoves,
  applyMove,
  checkGameStatus,
  isValidMove
} from './logic';

// Initialize game
let board = createInitialBoard();
let capturedPieces = { sente: [], gote: [] };
let currentPlayer: Player = 'sente';
let positionHistory: string[] = [];

// Player selects a piece
const selectedPos = { row: 6, col: 4 }; // 5筋の歩
const legalMoves = getLegalMoves(board, selectedPos, capturedPieces);

// Player makes a move
const move = {
  from: selectedPos,
  to: { row: 5, col: 4 },
  piece: 'FU',
  promote: false
};

// Validate and apply
if (isValidMove(board, move, currentPlayer, capturedPieces)) {
  board = applyMove(board, move);

  // Switch players
  currentPlayer = currentPlayer === 'sente' ? 'gote' : 'sente';

  // Check game status
  const status = checkGameStatus(
    board,
    currentPlayer,
    positionHistory,
    capturedPieces
  );

  if (status === 'checkmate') {
    console.log('Checkmate! Winner:', currentPlayer === 'sente' ? 'gote' : 'sente');
  } else if (status === 'check') {
    console.log('Check!');
  }
}
```

### Handling Captures

```typescript
// When a piece is captured
const targetPiece = board[move.to.row][move.to.col];
if (targetPiece && targetPiece.owner !== currentPlayer) {
  const capturedType = getUnpromotedPiece(targetPiece.type);
  if (currentPlayer === 'sente') {
    capturedPieces.sente.push(capturedType);
  } else {
    capturedPieces.gote.push(capturedType);
  }
}
```

### Dropping Pieces

```typescript
// Drop a piece from hand
const dropMove: Move = {
  from: null,  // null indicates drop
  to: { row: 4, col: 4 },
  piece: 'FU',  // Must be in capturedPieces
  promote: false
};

if (isValidMove(board, dropMove, currentPlayer, capturedPieces)) {
  board = applyMove(board, dropMove);

  // Remove from captured pieces
  const hand = currentPlayer === 'sente'
    ? capturedPieces.sente
    : capturedPieces.gote;
  const index = hand.indexOf('FU');
  if (index > -1) hand.splice(index, 1);
}
```

### Promotion Handling

```typescript
import { canPromote } from './logic';

const piece = board[move.from.row][move.from.col];
const promotionStatus = canPromote(piece, move.from, move.to, currentPlayer);

if (promotionStatus === 'required') {
  move.promote = true;  // Must promote
} else if (promotionStatus === 'optional') {
  // Ask player if they want to promote
  move.promote = promptUserForPromotion();
}
// If 'forbidden', move.promote must be false
```

## Testing

Run the demo file to verify basic functionality:

```bash
npx tsx src/logic/demo.ts
```

This will:
1. Create initial board
2. Show legal moves for pieces
3. Apply moves and display results
4. Check game status
5. Convert to/from SFEN

## Integration with UI (Phase 3-4)

The logic layer is designed to integrate easily with React/Zustand:

```typescript
// In Zustand store
import { createInitialBoard, getLegalMoves, applyMove, checkGameStatus } from './logic';

interface GameState {
  board: Board;
  capturedPieces: CapturedPieces;
  currentPlayer: Player;
  selectedSquare: Position | null;
  legalMoves: Position[];
  gameStatus: GameStatus;

  selectSquare: (pos: Position) => void;
  makeMove: (move: Move) => void;
  // ... other actions
}

const useGameStore = create<GameState>((set, get) => ({
  board: createInitialBoard(),
  capturedPieces: { sente: [], gote: [] },
  currentPlayer: 'sente',
  selectedSquare: null,
  legalMoves: [],
  gameStatus: 'playing',

  selectSquare: (pos) => {
    const { board } = get();
    const legalMoves = getLegalMoves(board, pos);
    set({ selectedSquare: pos, legalMoves });
  },

  makeMove: (move) => {
    const { board, currentPlayer, capturedPieces, positionHistory } = get();
    const newBoard = applyMove(board, move);
    const nextPlayer = currentPlayer === 'sente' ? 'gote' : 'sente';
    const status = checkGameStatus(newBoard, nextPlayer, positionHistory, capturedPieces);

    set({
      board: newBoard,
      currentPlayer: nextPlayer,
      gameStatus: status,
      selectedSquare: null,
      legalMoves: []
    });
  }
}));
```

## Design Principles

1. **Immutability**: All functions return new objects, never mutate inputs
2. **Framework-Agnostic**: Pure TypeScript, no React/UI dependencies
3. **Type-Safe**: Full TypeScript type coverage
4. **Testable**: Each function can be unit tested independently
5. **Documented**: Japanese comments for Shogi-specific rules
6. **Performance**: Efficient algorithms for move generation and validation

## Next Steps

- **Phase 3-3**: Write comprehensive unit tests
- **Phase 3-4**: Integrate with React UI and Zustand store
- **Phase 4**: Add AI opponent using USI engine communication

---

**Implementation Status: ✅ Complete**

All core game logic for Phase 3-2 has been implemented and is ready for testing and UI integration.
