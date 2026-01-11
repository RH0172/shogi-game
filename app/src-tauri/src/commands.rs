// Tauri commands for frontend communication

use std::sync::Mutex;
use tauri::State;

use crate::usi::MockEngine;

/// Global engine state
/// Using MockEngine for now, can be switched to UsiEngine when real engine is available
pub struct EngineState {
    pub engine: Mutex<Option<MockEngine>>,
}

impl EngineState {
    pub fn new() -> Self {
        EngineState {
            engine: Mutex::new(None),
        }
    }
}

impl Default for EngineState {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize the engine
/// For mock engine, we don't need a path, but keeping the signature for compatibility
#[tauri::command]
pub fn init_engine(state: State<EngineState>, _engine_path: Option<String>) -> Result<String, String> {
    let mut engine_lock = state.engine.lock().map_err(|e| e.to_string())?;

    // Create and initialize mock engine
    let mut engine = MockEngine::new();
    engine.init()?;

    *engine_lock = Some(engine);

    Ok("Engine initialized successfully".to_string())
}

/// Get AI move for a given position
#[tauri::command]
pub fn get_ai_move(
    state: State<EngineState>,
    sfen: String,
    time_ms: u32,
) -> Result<String, String> {
    let mut engine_lock = state.engine.lock().map_err(|e| e.to_string())?;

    if let Some(engine) = engine_lock.as_mut() {
        engine.get_best_move(&sfen, time_ms)
    } else {
        Err("Engine not initialized".to_string())
    }
}

/// Shutdown the engine
#[tauri::command]
pub fn shutdown_engine(state: State<EngineState>) -> Result<String, String> {
    let mut engine_lock = state.engine.lock().map_err(|e| e.to_string())?;

    if let Some(mut engine) = engine_lock.take() {
        engine.quit()?;
        Ok("Engine shutdown successfully".to_string())
    } else {
        Err("Engine not running".to_string())
    }
}

/// Check if engine is ready
#[tauri::command]
pub fn is_engine_ready(state: State<EngineState>) -> Result<bool, String> {
    let engine_lock = state.engine.lock().map_err(|e| e.to_string())?;

    Ok(engine_lock.is_some() && engine_lock.as_ref().unwrap().is_ready())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_state_creation() {
        let state = EngineState::new();
        let engine_lock = state.engine.lock().unwrap();
        assert!(engine_lock.is_none());
    }
}
