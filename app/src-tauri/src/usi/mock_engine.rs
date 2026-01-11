// Mock USI engine for testing without actual YaneuraOu binary
// Returns random legal moves based on the position

use std::collections::HashMap;

/// Mock engine that simulates USI protocol responses
pub struct MockEngine {
    initialized: bool,
}

impl MockEngine {
    pub fn new() -> Self {
        MockEngine {
            initialized: false,
        }
    }

    /// Initialize the mock engine
    pub fn init(&mut self) -> Result<(), String> {
        self.initialized = true;
        Ok(())
    }

    /// Get a mock best move based on the position
    /// For now, returns predefined moves or simple heuristics
    pub fn get_best_move(&self, sfen: &str, _time_ms: u32) -> Result<String, String> {
        if !self.initialized {
            return Err("Engine not initialized".to_string());
        }

        // Parse SFEN to determine position (simplified)
        // For a proper implementation, we would analyze the position
        // For now, return common opening moves or a simple move

        let move_str = self.generate_mock_move(sfen)?;
        Ok(move_str)
    }

    /// Generate a mock move based on the SFEN position
    fn generate_mock_move(&self, sfen: &str) -> Result<String, String> {
        // Common opening moves based on position
        let opening_moves = HashMap::from([
            // Initial position - common first moves
            ("lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1", vec![
                "7g7f", // 7七歩
                "2g2f", // 2七歩
                "5g5f", // 5七歩
                "6g6f", // 6七歩
            ]),
        ]);

        // Extract just the board part of SFEN (before the turn indicator)
        let sfen_parts: Vec<&str> = sfen.split_whitespace().collect();
        if sfen_parts.len() < 4 {
            return Err("Invalid SFEN format".to_string());
        }

        // For the initial position or common positions, return a known good move
        let position_key = format!("{} {} {} {}", sfen_parts[0], sfen_parts[1], sfen_parts[2], sfen_parts[3]);

        if let Some(moves) = opening_moves.get(position_key.as_str()) {
            if !moves.is_empty() {
                // Return first move (could be randomized)
                return Ok(moves[0].to_string());
            }
        }

        // For other positions, return a simple default move
        // In a real implementation, we would analyze the board and generate legal moves
        // For now, return a common pawn move as fallback
        Ok("7g7f".to_string())
    }

    /// Stop thinking (no-op for mock engine)
    pub fn stop(&mut self) -> Result<(), String> {
        Ok(())
    }

    /// Quit the engine
    pub fn quit(&mut self) -> Result<(), String> {
        self.initialized = false;
        Ok(())
    }

    /// Check if engine is initialized
    pub fn is_ready(&self) -> bool {
        self.initialized
    }
}

impl Default for MockEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_engine_init() {
        let mut engine = MockEngine::new();
        assert!(!engine.is_ready());

        engine.init().unwrap();
        assert!(engine.is_ready());
    }

    #[test]
    fn test_mock_engine_get_move() {
        let mut engine = MockEngine::new();
        engine.init().unwrap();

        let sfen = "lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1";
        let result = engine.get_best_move(sfen, 1000);

        assert!(result.is_ok());
        let move_str = result.unwrap();
        assert!(!move_str.is_empty());
    }

    #[test]
    fn test_mock_engine_not_initialized() {
        let engine = MockEngine::new();
        let sfen = "lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1";
        let result = engine.get_best_move(sfen, 1000);

        assert!(result.is_err());
    }
}
