# Quick Start Guide - USI Engine Integration

## Prerequisites

- Rust and Cargo installed
- Node.js and npm/pnpm installed
- Tauri CLI installed

## Setup and Run

### 1. Install Dependencies

```bash
# Frontend dependencies
cd app
npm install

# Rust dependencies (automatic with first build)
cd src-tauri
cargo build
```

### 2. Initialize AI Engine

The app automatically initializes the mock engine when you start a PvE game. To manually initialize:

```typescript
import { initEngine } from './services/aiService';

// Initialize with mock engine (default)
await initEngine();
```

### 3. Start Development Server

```bash
cd app
npm run tauri dev
```

### 4. Play Against AI

1. Launch the application
2. Select "PvE" mode when starting a new game
3. Choose AI difficulty (Easy/Medium/Hard)
4. Play as Sente (first player) - AI will be Gote (second player)
5. After each of your moves, the AI will automatically respond

## How It Works

### Mock Engine (Current)

The application uses a **mock engine** by default that:
- Returns predefined opening moves for common positions
- Requires no external engine binary
- Perfect for development and testing

### AI Difficulty Settings

| Level  | Time per Move | Description |
|--------|--------------|-------------|
| Easy   | 500ms        | Quick responses, less analysis |
| Medium | 2000ms       | Balanced thinking time |
| Hard   | 5000ms       | Deep analysis, stronger play |

### Visual Feedback

- **Purple pulsing indicator**: AI is thinking
- **"AIが思考中..."**: Shown during AI turn
- **AI moves highlighted**: Last move squares are highlighted

## Troubleshooting

### AI Not Responding

1. Check browser console for errors
2. Ensure engine was initialized (check on game start)
3. Verify PvE mode is selected
4. Try starting a new game

### Invalid Move Error

This shouldn't happen with the mock engine, but if it does:
- The error will be shown in an alert
- Game state is preserved
- You can continue playing normally

### Performance Issues

- Reduce AI difficulty level
- Check system resources
- Ensure no other heavy processes running

## Development

### Running Tests

```bash
# Rust tests
cd src-tauri
cargo test

# Frontend tests (if configured)
cd app
npm test
```

### Debugging

Enable debug logging in `src-tauri/src/main.rs`:

```rust
fn main() {
    env_logger::init(); // Add this
    tauri::Builder::default()
        // ... rest of setup
}
```

Add to `Cargo.toml`:
```toml
[dependencies]
env_logger = "0.10"
```

### Extending Mock Engine

Add more positions to `src-tauri/src/usi/mock_engine.rs`:

```rust
let opening_moves = HashMap::from([
    ("position_sfen", vec!["move1", "move2"]),
    // Add your positions here
]);
```

## Next Steps

1. **Play test games**: Verify all moves work correctly
2. **Test edge cases**: Checkmate, invalid positions, etc.
3. **UI polish**: Add more visual feedback
4. **Real engine**: Integrate YaneuraOu binary (see USI_INTEGRATION.md)

## API Reference

### Tauri Commands

```rust
// Initialize engine
init_engine(engine_path: Option<String>) -> Result<String, String>

// Get AI move
get_ai_move(sfen: String, time_ms: u32) -> Result<String, String>

// Shutdown engine
shutdown_engine() -> Result<String, String>

// Check if ready
is_engine_ready() -> Result<bool, String>
```

### Frontend Services

```typescript
// AI Service
import { initEngine, getAIMove, shutdownEngine, getTimeForLevel } from './services/aiService';

// Initialize
await initEngine();

// Get move
const move = await getAIMove(sfen, 2000);

// Shutdown
await shutdownEngine();

// Get time for difficulty
const timeMs = getTimeForLevel('medium'); // 2000
```

### Game Store

```typescript
import { useGameStore } from './store/gameStore';

const store = useGameStore();

// Check AI status
console.log(store.isAIThinking); // true/false

// Manually request AI move (usually automatic)
await store.requestAIMove();
```

## Known Limitations

1. **Mock Engine**:
   - Limited opening book (only initial position)
   - No real position analysis
   - Returns fallback move for unknown positions

2. **No Pondering**: AI doesn't think during player's turn

3. **No Position Evaluation**: No score display yet

4. **Single Engine Instance**: Can't switch engines without restart

## Support

For issues or questions:
1. Check `USI_INTEGRATION.md` for detailed architecture
2. Review console logs for errors
3. Check GitHub issues (if applicable)
