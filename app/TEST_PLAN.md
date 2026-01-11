# Test Plan - USI Engine Integration (Phase 3-4)

## Overview
This document outlines the testing strategy for the USI engine integration implementation.

## Test Environment

### Prerequisites
- Rust toolchain installed
- Node.js and npm/pnpm installed
- Tauri CLI configured
- Development environment set up

### Build Commands
```bash
cd app
npm install
npm run tauri dev
```

## Unit Tests

### Rust Tests

#### Mock Engine Tests
**Location**: `src-tauri/src/usi/mock_engine.rs`

Run tests:
```bash
cd src-tauri
cargo test mock_engine
```

**Test Cases:**
- [x] `test_mock_engine_init` - Engine initializes correctly
- [x] `test_mock_engine_get_move` - Returns valid move for initial position
- [x] `test_mock_engine_not_initialized` - Rejects moves before init

#### Parser Tests
**Location**: `src-tauri/src/usi/parser.rs`

Run tests:
```bash
cargo test parser
```

**Test Cases:**
- [x] `test_parse_usiok` - Parses "usiok" response
- [x] `test_parse_readyok` - Parses "readyok" response
- [x] `test_parse_bestmove` - Parses "bestmove 7g7f"
- [x] `test_parse_bestmove_with_ponder` - Parses "bestmove 7g7f ponder 3c3d"
- [x] `test_parse_info` - Parses info depth/score/nodes/pv

#### Command Builder Tests
**Location**: `src-tauri/src/usi/commands.rs`

Run tests:
```bash
cargo test commands
```

**Test Cases:**
- [x] `test_build_usi_command` - "usi"
- [x] `test_build_isready_command` - "isready"
- [x] `test_build_position_command` - "position sfen <sfen>"
- [x] `test_build_position_command_with_moves` - "position sfen <sfen> moves <moves>"
- [x] `test_build_go_byoyomi_command` - "go byoyomi 1000"
- [x] `test_build_go_time_command` - "go btime X wtime Y"
- [x] `test_build_stop_command` - "stop"
- [x] `test_build_quit_command` - "quit"

### TypeScript Tests

#### SFEN Conversion (Existing)
**Location**: `src/utils/sfen.ts`

**Test Cases:**
- [ ] `boardToSfen()` generates correct SFEN
- [ ] `sfenToBoard()` parses SFEN correctly
- [ ] `moveToUsi()` converts internal move to USI format
- [ ] `usiToMove()` parses USI move correctly

## Integration Tests

### Tauri Command Tests

#### Test 1: Engine Initialization
**Objective**: Verify engine initializes successfully

**Steps:**
1. Launch application
2. Check browser console for initialization message
3. Call `is_engine_ready()` from console

**Expected:**
- Console shows "AI engine initialized successfully"
- `is_engine_ready()` returns `true`
- No errors in console

**Test Code:**
```javascript
// In browser console
const { invoke } = window.__TAURI__.core;
await invoke('is_engine_ready');
// Should return: true
```

#### Test 2: Get AI Move
**Objective**: Verify AI returns valid move for initial position

**Steps:**
1. Initialize engine
2. Request move for initial position
3. Validate move format

**Test Code:**
```javascript
const sfen = "lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1";
const move = await invoke('get_ai_move', { sfen, timeMs: 1000 });
console.log('AI move:', move);
// Should return: "7g7f" or similar valid USI move
```

**Expected:**
- Move is valid USI format (e.g., "7g7f")
- No errors thrown
- Response within timeout

#### Test 3: Shutdown Engine
**Objective**: Verify engine shuts down cleanly

**Steps:**
1. Initialize engine
2. Shutdown engine
3. Verify engine is no longer ready

**Test Code:**
```javascript
await invoke('shutdown_engine');
const ready = await invoke('is_engine_ready');
console.log('Engine ready after shutdown:', ready);
// Should return: false
```

## Functional Tests

### Game Flow Tests

#### Test 1: PvE Mode - Complete Game
**Objective**: Play a complete game against AI

**Steps:**
1. Launch application
2. Select "PvE" mode
3. Choose "Medium" difficulty
4. Play as Sente (first player)
5. Make opening move (7-7 pawn forward)
6. Wait for AI response
7. Continue playing for 10+ moves
8. Verify game state consistency

**Expected Results:**
- AI responds to every move
- "AIが思考中..." shows during AI turn
- Purple pulsing animation appears
- AI moves are legal and valid
- Game state updates correctly
- No crashes or freezes
- Can play until checkmate/resignation

#### Test 2: AI Difficulty Levels
**Objective**: Verify different difficulty levels work

**Steps:**
1. Play 3 moves with Easy (500ms)
2. Play 3 moves with Medium (2000ms)
3. Play 3 moves with Hard (5000ms)
4. Compare response times

**Expected Results:**
- Easy: AI responds in ~500ms
- Medium: AI responds in ~2000ms
- Hard: AI responds in ~5000ms
- Visual feedback during all levels
- All moves are valid

#### Test 3: PvP Mode Still Works
**Objective**: Ensure AI doesn't interfere with PvP

**Steps:**
1. Select "PvP" mode
2. Make several moves for both players
3. Verify no AI intervention

**Expected Results:**
- No AI moves triggered
- No "AI thinking" indicator
- Manual control of both players
- Game plays normally

### Error Handling Tests

#### Test 1: Invalid Position
**Objective**: Handle invalid SFEN gracefully

**Steps:**
1. Call `get_ai_move` with invalid SFEN
2. Observe error handling

**Test Code:**
```javascript
try {
  await invoke('get_ai_move', { sfen: 'invalid', timeMs: 1000 });
} catch (error) {
  console.log('Expected error:', error);
}
```

**Expected:**
- Error caught and displayed
- App continues normally
- No crash

#### Test 2: Resignation During AI Thinking
**Objective**: Verify resignation works during AI turn

**Steps:**
1. Start PvE game
2. Make move to trigger AI
3. Click "投了" (resign) while AI is thinking
4. Confirm resignation

**Expected Results:**
- Resignation dialog appears
- Game ends properly
- AI thinking stops
- Winner declared correctly

#### Test 3: New Game During AI Thinking
**Objective**: Verify new game works during AI turn

**Steps:**
1. Start PvE game
2. Make move to trigger AI
3. Click "新規対局" while AI is thinking
4. Select mode for new game

**Expected Results:**
- Mode selection dialog appears
- New game starts cleanly
- Previous game state cleared
- AI state reset

### Edge Cases

#### Test 1: Rapid Moves
**Objective**: Test rapid successive moves

**Steps:**
1. Make move quickly after AI responds
2. Repeat 5 times rapidly
3. Verify no state corruption

**Expected:**
- All moves process correctly
- No race conditions
- State remains consistent

#### Test 2: Multiple New Games
**Objective**: Start multiple games in succession

**Steps:**
1. Start PvE game
2. Make 3 moves
3. Start new game
4. Repeat 3 times

**Expected:**
- Each game starts fresh
- No state leakage
- Engine continues working

#### Test 3: Switch Modes
**Objective**: Switch between PvP and PvE

**Steps:**
1. Start PvE game, make 2 moves
2. New game, select PvP
3. Play 2 moves
4. New game, select PvE again

**Expected:**
- Mode switches correctly
- AI only active in PvE mode
- No interference between modes

## Performance Tests

### Test 1: AI Response Time
**Objective**: Verify AI responds within time limit

**Measurements:**
- Easy: Should respond in < 1000ms
- Medium: Should respond in < 3000ms
- Hard: Should respond in < 6000ms

**Method:**
```javascript
const start = Date.now();
await invoke('get_ai_move', { sfen, timeMs: 2000 });
const elapsed = Date.now() - start;
console.log('Response time:', elapsed, 'ms');
```

### Test 2: Memory Leaks
**Objective**: Ensure no memory leaks during extended play

**Steps:**
1. Open DevTools -> Performance Monitor
2. Play 20+ moves in PvE mode
3. Monitor memory usage

**Expected:**
- Memory usage stable
- No significant growth
- GC clears unused objects

### Test 3: UI Responsiveness
**Objective**: UI remains responsive during AI thinking

**Steps:**
1. Trigger AI move (Hard difficulty, 5000ms)
2. Try clicking other UI elements
3. Try hovering over pieces

**Expected:**
- UI remains interactive
- No freezing
- Smooth animations

## Regression Tests

### Test 1: Existing Features Still Work
**Checklist:**
- [x] Board renders correctly
- [x] Pieces move correctly
- [x] Captured pieces display
- [x] Legal move highlighting
- [x] Promotion dialog (if applicable)
- [x] Checkmate detection
- [x] Game over dialog
- [x] Resignation works

### Test 2: Move Validation
**Objective**: Ensure move rules still enforced

**Test Cases:**
- [ ] Cannot move opponent's pieces
- [ ] Cannot make illegal moves
- [ ] 二歩 (double pawn) prevented
- [ ] King in check validation
- [ ] Forced promotion works

## User Acceptance Tests

### Test 1: First-Time User Experience
**Scenario**: New user plays first game

**Steps:**
1. Fresh install/build
2. Launch app
3. Follow on-screen instructions
4. Play game without documentation

**Expected:**
- Intuitive interface
- Clear instructions
- Obvious AI is thinking
- Game flow makes sense

### Test 2: Experienced Player
**Scenario**: Shogi player tests AI strength

**Steps:**
1. Play strategic game
2. Try standard openings
3. Test AI responses

**Expected:**
- AI makes reasonable moves
- Game plays smoothly
- Performance acceptable

## Bug Tracking Template

```markdown
### Bug Report
**Title**: [Brief description]
**Severity**: Critical | High | Medium | Low
**Reproducible**: Always | Sometimes | Rare

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Environment:**
- OS:
- Browser:
- Build:

**Console Errors:**
```
[Paste errors here]
```

**Screenshots:**
[If applicable]
```

## Test Execution Log

### Date: [To be filled]

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| UNIT-1 | Mock engine tests | ⏸️ | Requires cargo |
| UNIT-2 | Parser tests | ⏸️ | Requires cargo |
| UNIT-3 | Command tests | ⏸️ | Requires cargo |
| INT-1 | Engine init | ⏸️ | Requires runtime |
| INT-2 | Get AI move | ⏸️ | Requires runtime |
| INT-3 | Shutdown | ⏸️ | Requires runtime |
| FUNC-1 | Complete game | ⏸️ | Requires runtime |
| FUNC-2 | Difficulty levels | ⏸️ | Requires runtime |
| FUNC-3 | PvP mode | ⏸️ | Requires runtime |
| ERR-1 | Invalid position | ⏸️ | Requires runtime |
| ERR-2 | Resign during AI | ⏸️ | Requires runtime |
| ERR-3 | New game during AI | ⏸️ | Requires runtime |

**Legend:**
- ✅ Passed
- ❌ Failed
- ⏸️ Pending
- ⚠️ Partial

## Sign-off

**Tester**: _______________
**Date**: _______________
**Status**: ⏸️ Pending Testing

**Notes:**
[Add any additional notes or observations]
