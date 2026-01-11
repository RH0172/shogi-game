// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod usi;

use commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![
            init_engine,
            get_ai_move,
            shutdown_engine,
            is_engine_ready
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
