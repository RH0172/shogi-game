// USI Engine process management
// Handles real engine communication via stdin/stdout

use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use super::commands::*;
use super::parser::{parse_usi_line, UsiResponse};

/// USI Engine manager
pub struct UsiEngine {
    child: Option<Child>,
    stdin: Option<std::process::ChildStdin>,
    response_buffer: Arc<Mutex<Vec<String>>>,
}

impl UsiEngine {
    /// Create a new USI engine instance
    pub fn new() -> Self {
        UsiEngine {
            child: None,
            stdin: None,
            response_buffer: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Start the engine process
    pub fn start(&mut self, engine_path: &str) -> Result<(), String> {
        let mut child = Command::new(engine_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start engine process: {}", e))?;

        let stdin = child
            .stdin
            .take()
            .ok_or("Failed to capture engine stdin")?;

        let stdout = child
            .stdout
            .take()
            .ok_or("Failed to capture engine stdout")?;

        // Spawn a thread to read from stdout
        let buffer = Arc::clone(&self.response_buffer);
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let mut buf = buffer.lock().unwrap();
                    buf.push(line);
                }
            }
        });

        self.child = Some(child);
        self.stdin = Some(stdin);

        Ok(())
    }

    /// Send a command to the engine
    pub fn send_command(&mut self, command: &str) -> Result<(), String> {
        if let Some(stdin) = &mut self.stdin {
            writeln!(stdin, "{}", command)
                .map_err(|e| format!("Failed to write to engine: {}", e))?;
            stdin
                .flush()
                .map_err(|e| format!("Failed to flush stdin: {}", e))?;
            Ok(())
        } else {
            Err("Engine not started".to_string())
        }
    }

    /// Read a single response line from the engine
    fn read_response_line(&self, timeout_ms: u64) -> Result<String, String> {
        let start = std::time::Instant::now();
        loop {
            {
                let mut buffer = self.response_buffer.lock().unwrap();
                if !buffer.is_empty() {
                    return Ok(buffer.remove(0));
                }
            }

            if start.elapsed().as_millis() > timeout_ms as u128 {
                return Err("Timeout waiting for engine response".to_string());
            }

            thread::sleep(Duration::from_millis(10));
        }
    }

    /// Initialize the engine
    pub fn init(&mut self) -> Result<(), String> {
        // Send "usi" command
        self.send_command(&build_usi_command())?;

        // Wait for "usiok" response
        loop {
            let line = self.read_response_line(5000)?;
            match parse_usi_line(&line) {
                UsiResponse::UsiOk => break,
                _ => continue,
            }
        }

        // Send "isready" command
        self.send_command(&build_isready_command())?;

        // Wait for "readyok" response
        loop {
            let line = self.read_response_line(5000)?;
            match parse_usi_line(&line) {
                UsiResponse::ReadyOk => break,
                _ => continue,
            }
        }

        Ok(())
    }

    /// Get the best move for a position
    pub fn get_best_move(&mut self, sfen: &str, time_ms: u32) -> Result<String, String> {
        // Send position command
        self.send_command(&build_position_command(sfen, &[]))?;

        // Send go command
        self.send_command(&build_go_byoyomi_command(time_ms))?;

        // Wait for bestmove response
        let timeout_ms = time_ms as u64 + 5000; // Add 5 seconds buffer
        loop {
            let line = self.read_response_line(timeout_ms)?;
            match parse_usi_line(&line) {
                UsiResponse::BestMove { best_move, .. } => return Ok(best_move),
                UsiResponse::Info(_) => continue, // Ignore info lines
                _ => continue,
            }
        }
    }

    /// Stop the engine from thinking
    pub fn stop(&mut self) -> Result<(), String> {
        self.send_command(&build_stop_command())
    }

    /// Quit the engine
    pub fn quit(&mut self) -> Result<(), String> {
        self.send_command(&build_quit_command())?;

        // Wait a bit for the engine to quit
        thread::sleep(Duration::from_millis(100));

        // Kill the process if it's still running
        if let Some(child) = &mut self.child {
            let _ = child.kill();
            let _ = child.wait();
        }

        self.child = None;
        self.stdin = None;

        Ok(())
    }

    /// Check if the engine is running
    pub fn is_running(&self) -> bool {
        self.child.is_some()
    }

    /// Start a new game
    pub fn new_game(&mut self) -> Result<(), String> {
        self.send_command(&build_usinewgame_command())
    }

    /// Set an engine option
    pub fn set_option(&mut self, name: &str, value: &str) -> Result<(), String> {
        self.send_command(&build_setoption_command(name, value))
    }
}

impl Default for UsiEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for UsiEngine {
    fn drop(&mut self) {
        let _ = self.quit();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = UsiEngine::new();
        assert!(!engine.is_running());
    }

    // Note: Real engine tests would require an actual USI engine binary
    // These are integration tests that should be run separately
}
