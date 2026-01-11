# Shogi Game Logic - Implementation Demo

This document demonstrates the core Shogi game logic implemented in Phase 3-2.

## Implemented Files

### 1. **app/src/logic/board.ts** - Board State Management
Handles the board representation and basic operations:
- `createInitialBoard()` - Generates the starting position with all pieces in their correct positions
- `applyMove(board, move)` - Applies a move to the board and returns a new board state
- `cloneBoard(board)` - Creates a deep copy of the board
- `getPromotedPiece(pieceType)` - Returns the promoted version of a piece
- `getUnpromotedPiece(pieceType)` - Returns the unpromoted version (for captured pieces)
- `isPromoted(pieceType)` - Checks if a piece is promoted
- `canBePromoted(pieceType)` - Checks if a piece can be promoted
- `isInBounds(pos)` - Validates position is within the 9x9 board
- `positionEquals(pos1, pos2)` - Compares two positions
- `findKing(board, player)` - Finds the king's position
- `boardToString(board)` - Converts board to readable string (for debugging)

### 2. **app/src/logic/moves.ts** - Legal Move Generation
Implements movement rules for all pieces:
- `getPieceMovementPattern(pieceType, position, player)` - Returns basic movement patterns for each piece type:
  - **歩 (FU)**: Forward 1 square
  - **香 (KY)**: Forward any number of squares (lance)
  - **桂 (KE)**: L-shaped jump (knight)
  - **銀 (GI)**: 5 directions (forward 3, diagonal back 2)
  - **金 (KI)**: 6 directions (forward 3, sides 2, back 1)
  - **角 (KA)**: Diagonal any distance (bishop)
  - **飛 (HI)**: Orthogonal any distance (rook)
  - **王 (OU)**: Any direction 1 square (king)
  - **と/成香/成桂/成銀**: Gold movement
  - **馬 (UM)**: Bishop + orthogonal 1 square
  - **竜 (RY)**: Rook + diagonal 1 square

- `getLegalMoves(board, position, capturedPieces)` - Returns all legal moves from a position, including:
  - Filtering out-of-bounds moves
  - Blocking by own pieces
  - Path blocking for ranged pieces (香、角、飛、馬、竜)
  - **王手放置** prevention (cannot leave king in check)

- `getAllLegalMoves(board, player, capturedPieces)` - Returns all legal moves for a player, including:
  - All piece moves on the board
  - All possible drops from captured pieces

- `canPromote(piece, from, to, player)` - Determines promotion status:
  - `'required'` - Must promote (行き所のない駒 - piece cannot move from destination)
  - `'optional'` - Can choose to promote or not
  - `'forbidden'` - Cannot promote

### 3. **app/src/logic/validation.ts** - Special Rules Validation
Enforces Shogi's unique rules:
- `isNifuViolation(board, move, player)` - **二歩 (Double Pawn)** check:
  - Prevents dropping a pawn in a column where the player already has an unpromoted pawn

- `isUchifuzumeViolation(board, move, player)` - **打ち歩詰め (Pawn Drop Checkmate)** check:
  - Prevents dropping a pawn that directly causes checkmate
  - The critical rule: the pawn drop itself causes the mate (opponent cannot escape even if they could capture the pawn)

- `canPlacePiece(board, piece, position, player)` - **行き所のない駒 (Piece with No Valid Moves)** check:
  - Pawns and lances cannot be dropped on the first rank
  - Knights cannot be dropped on the first or second rank

- `isValidMove(board, move, player, capturedPieces)` - Comprehensive move validation:
  - Combines all validation rules
  - Checks if destination is in bounds
  - Verifies piece ownership
  - Validates special rules (二歩、打ち歩詰め、行き所のない駒)
  - Ensures move doesn't leave king in check

### 4. **app/src/logic/judge.ts** - Game State Determination
Determines game outcomes:
- `isKingInCheck(board, player)` - **王手 (Check)** detection:
  - Checks if opponent's pieces can capture the king
  - Handles both ranged and non-ranged pieces
  - Considers path blocking for ranged pieces

- `isCheckmate(board, player, capturedPieces)` - **詰み (Checkmate)** detection:
  - King is in check AND
  - No legal moves available (no escape, no block, no capture)

- `isStalemate(board, player, capturedPieces)` - **ステイルメイト** detection:
  - No legal moves available but king is NOT in check
  - Rare in Shogi but included for completeness

- `isRepetition(positionHistory, currentSfen)` - **千日手 (Repetition Draw)** detection:
  - Same position appears 4 times = draw
  - Uses SFEN strings to compare positions

- `checkGameStatus(board, player, positionHistory, capturedPieces, currentSfen)` - Overall game state:
  - Returns: `'playing'`, `'check'`, `'checkmate'`, `'stalemate'`, `'repetition'`

- `canDeclareWin(board, player)` - **入玉宣言勝ち (Entering King Declaration)**:
  - Advanced rule: King enters enemy territory with sufficient points (24+ points)
  - Big pieces (飛角竜馬) = 5 points, others = 1 point

- `getKingEscapeSquares(board, player)` - Helper for finding king escape routes
- `getCheckingPieces(board, player)` - Helper for finding which pieces are giving check

### 5. **app/src/utils/sfen.ts** - SFEN Notation
Implements Shogi Forsyth-Edwards Notation for position serialization:
- `boardToSfen(board, player, capturedPieces, moveNumber)` - Converts game state to SFEN string:
  - Format: `<board> <turn> <hand> <movenum>`
  - Example: `lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1`
  - Used for position history tracking (千日手 detection)
  - Compatible with USI engines

- `sfenToBoard(sfen)` - Parses SFEN string back to game state:
  - Reconstructs board, player turn, captured pieces, and move number
  - Useful for loading saved games or positions

- `moveToUsi(move)` - Converts internal move to USI format:
  - Example: `7g7f` (move from 7g to 7f)
  - Example: `P*5e` (drop pawn at 5e)

- `usiToMove(usi)` - Converts USI move string to internal format

- `INITIAL_SFEN` - Constant for starting position

## Usage Example

```typescript
import {
  createInitialBoard,
  getLegalMoves,
  applyMove,
  isKingInCheck,
  checkGameStatus,
  boardToString
} from './logic';
import { boardToSfen } from './utils';

// Create initial board
const board = createInitialBoard();
console.log(boardToString(board));

// Get legal moves for a piece (e.g., 7th file pawn at row 6, col 6)
const pawnPosition = { row: 6, col: 6 };
const legalMoves = getLegalMoves(board, pawnPosition);
console.log('Legal moves:', legalMoves); // [{row: 5, col: 6}]

// Apply a move
const move = {
  from: { row: 6, col: 6 },
  to: { row: 5, col: 6 },
  piece: 'FU',
  promote: false
};
const newBoard = applyMove(board, move);

// Check game status
const capturedPieces = { sente: [], gote: [] };
const status = checkGameStatus(newBoard, 'gote', [], capturedPieces);
console.log('Game status:', status); // 'playing'

// Convert to SFEN for storage/USI engine
const sfen = boardToSfen(newBoard, 'gote', capturedPieces, 1);
console.log('SFEN:', sfen);
```

## Key Implementation Details

### 1. Coordinate System
- Row: 0-8 (一段目 to 九段目)
- Column: 0-8 (1筋 to 9筋, but reversed: col 0 = 1筋, col 8 = 9筋)
- Position: `{ row: number, col: number }`

### 2. Piece Movement Patterns
Each piece type has unique movement:
- **Ranged pieces** (香、角、飛、馬、竜): Can move multiple squares but are blocked by pieces
- **Non-ranged pieces**: Move fixed patterns (歩、桂、銀、金、王、成駒)

### 3. Special Rules Enforcement
- **王手放置 (Leaving King in Check)**: Every legal move is verified to ensure it doesn't leave the king in check
- **二歩 (Double Pawn)**: Checked before allowing pawn drops
- **打ち歩詰め (Pawn Drop Checkmate)**: Special validation - dropping pawn cannot directly cause checkmate
- **行き所のない駒**: Pieces cannot be dropped where they have no future moves

### 4. Performance Considerations
- Board state is immutable - all operations return new boards
- Legal move generation uses efficient path-blocking algorithms
- Move validation is layered (basic rules → special rules → check validation)

## Testing Recommendations

For Phase 3-3 (Testing), implement tests for:

1. **Board Tests**:
   - Initial board setup correctness
   - Move application (normal moves, captures, promotions)
   - Board cloning (deep copy verification)

2. **Move Generation Tests**:
   - Each piece type's movement pattern
   - Path blocking for ranged pieces
   - Legal moves with check prevention
   - Promotion rules (required vs optional)

3. **Validation Tests**:
   - 二歩 detection
   - 打ち歩詰め detection
   - 行き所のない駒 detection
   - Edge cases (corner moves, boundary conditions)

4. **Judge Tests**:
   - Check detection
   - Checkmate scenarios
   - Repetition draw
   - Game status transitions

5. **SFEN Tests**:
   - Round-trip conversion (board → SFEN → board)
   - Initial position SFEN
   - Complex positions with captured pieces
   - USI move format conversion

## Next Steps

Phase 3-3 will involve:
- Writing comprehensive unit tests for all logic functions
- Testing edge cases and special Shogi rules
- Integration tests for complete game flows

Phase 3-4 will implement:
- React components using this logic
- Zustand store integrating the game state
- UI for piece selection and move visualization

The logic layer is now complete and ready for testing and UI integration!
