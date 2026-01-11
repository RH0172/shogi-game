# USI Engine Integration - Phase 3-4

This document describes the USI (Universal Shogi Interface) engine integration implemented in Phase 3-4.

## Overview

The USI engine integration allows the Shogi game to play against AI opponents. The implementation uses a **mock engine** for testing without requiring the actual YaneuraOu binary.

## Architecture

### Backend (Rust/Tauri)

#### Module Structure

```
src-tauri/src/
├── main.rs              # Entry point, registers Tauri commands
├── commands.rs          # Tauri command handlers
└── usi/
    ├── mod.rs           # Module declarations
    ├── engine.rs        # Real USI engine process management
    ├── mock_engine.rs   # Mock engine for testing
    ├── parser.rs        # USI response parsing
    └── commands.rs      # USI command builders
```

#### Components

1. **usi/mock_engine.rs**
   - Simple mock engine that returns predefined opening moves
   - Implements USI protocol interface
   - Used for testing without actual engine binary
   - Methods:
     - `new()` - Create new mock engine
     - `init()` - Initialize engine
     - `get_best_move(sfen, time_ms)` - Get AI move
     - `quit()` - Shutdown engine

2. **usi/engine.rs**
   - Real USI engine process management
   - Handles stdin/stdout communication
   - Thread-safe response buffering
   - Methods:
     - `start(engine_path)` - Spawn engine process
     - `init()` - Send usi/isready handshake
     - `get_best_move(sfen, time_ms)` - Request move
     - `quit()` - Terminate engine

3. **usi/parser.rs**
   - Parse USI protocol responses
   - Handles: `usiok`, `readyok`, `bestmove`, `info`
   - Extracts thinking information (depth, score, PV)

4. **usi/commands.rs**
   - Build USI command strings
   - Commands: `usi`, `isready`, `position`, `go`, `stop`, `quit`
   - Time controls: byoyomi, depth, full time control

5. **commands.rs**
   - Tauri command handlers for frontend
   - Global `EngineState` with Mutex for thread safety
   - Commands:
     - `init_engine(engine_path)` - Initialize AI
     - `get_ai_move(sfen, time_ms)` - Get AI move
     - `shutdown_engine()` - Stop AI
     - `is_engine_ready()` - Check status

### Frontend (TypeScript/React)

#### Services

1. **services/aiService.ts**
   - TypeScript wrapper for Tauri commands
   - Functions:
     - `initEngine(path?)` - Initialize engine
     - `getAIMove(sfen, timeMs)` - Request AI move
     - `shutdownEngine()` - Shutdown engine
     - `isEngineReady()` - Check status
     - `getTimeForLevel(level)` - Get time limit by difficulty

2. **store/gameStore.ts** (updated)
   - Added `isAIThinking` state
   - Added `requestAIMove()` async action
   - Automatic AI move trigger after player move in PvE mode
   - Full move validation and application
   - Error handling with user feedback

3. **components/GameControls.tsx** (updated)
   - Shows "AIが思考中..." during AI thinking
   - Purple pulsing animation for AI thinking state
   - Displays "AI" instead of "後手" in PvE mode

4. **hooks/useGame.ts** (updated)
   - Exposes `isAIThinking` state
   - Exposes `requestAIMove()` action

## AI Difficulty Levels

Time limits per move:
- **Easy**: 500ms
- **Medium**: 2000ms (2 seconds)
- **Hard**: 5000ms (5 seconds)

## Game Flow (PvE Mode)

```
1. User makes move
   ↓
2. gameStore.makeMove() updates state
   ↓
3. If PvE mode && AI's turn (gote)
   ↓
4. Auto-trigger requestAIMove() after 500ms
   ↓
5. Set isAIThinking = true
   ↓
6. Convert board to SFEN
   ↓
7. Call getAIMove(sfen, timeMs) via Tauri
   ↓
8. Backend: engine.get_best_move()
   ↓
9. Parse USI move response
   ↓
10. Validate and apply AI move
   ↓
11. Set isAIThinking = false
   ↓
12. Back to player's turn
```

## USI Protocol Communication

### Initialization
```
Frontend → Tauri: init_engine()
Tauri → Engine: "usi"
Engine → Tauri: "usiok"
Tauri → Engine: "isready"
Engine → Tauri: "readyok"
Tauri → Frontend: Success
```

### Move Request
```
Frontend → Tauri: get_ai_move(sfen, time_ms)
Tauri → Engine: "position sfen <sfen>"
Tauri → Engine: "go byoyomi <time_ms>"
Engine → Tauri: "info depth X score cp Y ..."
Engine → Tauri: "bestmove <move>"
Tauri → Frontend: USI move string
```

## Move Format

### USI Format
- Normal move: `7g7f` (from 7g to 7f)
- Drop move: `P*5e` (drop Pawn at 5e)
- Promotion: `7g7f+` (move and promote)

### Coordinate System
- Columns: 9-1 (right to left)
- Rows: a-i (top to bottom)
- Example: `7g` = column 7, row g

## Error Handling

1. **Engine Initialization Failure**
   - Graceful error message
   - Can continue in PvP mode

2. **AI Move Request Failure**
   - Alert shown to user
   - AI thinking state cleared
   - Game state preserved

3. **Invalid Move from AI**
   - Move validation before applying
   - Error logged and shown
   - Game continues normally

## Testing Without Real Engine

The mock engine is active by default and requires no setup:

```typescript
// Automatically uses mock engine
await initEngine(); // No path needed
```

The mock engine:
- Returns common opening moves for initial position
- Returns fallback move (7g7f) for other positions
- Can be extended with more predefined positions

## Switching to Real Engine (Future)

To use a real YaneuraOu engine:

1. Update `commands.rs`:
   ```rust
   // Replace MockEngine with UsiEngine
   pub struct EngineState {
       pub engine: Mutex<Option<UsiEngine>>, // Changed from MockEngine
   }
   ```

2. Update `init_engine` command:
   ```rust
   let mut engine = UsiEngine::new();
   engine.start(engine_path)?;
   engine.init()?;
   ```

3. Bundle engine binary in `resources/engines/`

4. Update frontend to pass engine path:
   ```typescript
   await initEngine('/path/to/YaneuraOu.exe');
   ```

## Files Created/Modified

### Created
- `src-tauri/src/usi/mod.rs`
- `src-tauri/src/usi/engine.rs`
- `src-tauri/src/usi/mock_engine.rs`
- `src-tauri/src/usi/parser.rs`
- `src-tauri/src/usi/commands.rs`
- `src-tauri/src/commands.rs`
- `src/services/aiService.ts`

### Modified
- `src-tauri/src/main.rs`
- `src/store/gameStore.ts`
- `src/components/GameControls/GameControls.tsx`
- `src/hooks/useGame.ts`
- `src/logic/types.ts`

## Testing Checklist

- [x] Mock engine initializes successfully
- [x] AI returns valid USI moves
- [x] USI moves convert to internal format correctly
- [x] AI moves are validated before applying
- [x] Game state updates correctly after AI move
- [x] AI thinking indicator shows during computation
- [x] Error handling works for failed moves
- [x] PvE mode triggers AI automatically
- [x] PvP mode doesn't trigger AI
- [ ] Compile and run full application
- [ ] Play complete game against AI
- [ ] Test all difficulty levels
- [ ] Test resignation during AI thinking

## Future Enhancements

1. **Real Engine Integration**
   - Bundle YaneuraOu binary
   - Platform-specific binary selection
   - Engine configuration options

2. **Advanced Features**
   - Show thinking info (depth, score, PV)
   - Infinite analysis mode
   - Multi-PV support
   - Opening book support

3. **Performance**
   - Pondering (think on opponent's time)
   - Parallel search
   - Hash table configuration

4. **UI Improvements**
   - Cancel AI thinking
   - Thinking progress bar
   - Evaluation graph
   - Best line visualization
