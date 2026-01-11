// USI protocol response parser

use serde::{Deserialize, Serialize};

/// Information about the engine's current thinking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThinkingInfo {
    pub depth: Option<u32>,
    pub score_cp: Option<i32>,  // Score in centipawns
    pub nodes: Option<u64>,      // Number of nodes searched
    pub nps: Option<u64>,        // Nodes per second
    pub time: Option<u32>,       // Time in milliseconds
    pub pv: Vec<String>,         // Principal variation (best line)
}

impl ThinkingInfo {
    pub fn new() -> Self {
        ThinkingInfo {
            depth: None,
            score_cp: None,
            nodes: None,
            nps: None,
            time: None,
            pv: Vec::new(),
        }
    }
}

impl Default for ThinkingInfo {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse a USI response line
pub enum UsiResponse {
    UsiOk,
    ReadyOk,
    BestMove { best_move: String, ponder: Option<String> },
    Info(ThinkingInfo),
    Unknown(String),
}

/// Parse a single line of USI output
pub fn parse_usi_line(line: &str) -> UsiResponse {
    let trimmed = line.trim();

    if trimmed.is_empty() {
        return UsiResponse::Unknown(String::new());
    }

    if trimmed == "usiok" {
        return UsiResponse::UsiOk;
    }

    if trimmed == "readyok" {
        return UsiResponse::ReadyOk;
    }

    if trimmed.starts_with("bestmove") {
        return parse_bestmove(trimmed);
    }

    if trimmed.starts_with("info") {
        return parse_info(trimmed);
    }

    UsiResponse::Unknown(trimmed.to_string())
}

/// Parse a "bestmove" line
/// Format: "bestmove <move> [ponder <move>]"
fn parse_bestmove(line: &str) -> UsiResponse {
    let parts: Vec<&str> = line.split_whitespace().collect();

    if parts.len() < 2 {
        return UsiResponse::Unknown(line.to_string());
    }

    let best_move = parts[1].to_string();

    let ponder = if parts.len() >= 4 && parts[2] == "ponder" {
        Some(parts[3].to_string())
    } else {
        None
    };

    UsiResponse::BestMove { best_move, ponder }
}

/// Parse an "info" line
/// Format: "info depth <d> score cp <s> nodes <n> nps <nps> time <t> pv <moves...>"
fn parse_info(line: &str) -> UsiResponse {
    let parts: Vec<&str> = line.split_whitespace().collect();
    let mut info = ThinkingInfo::new();

    let mut i = 1; // Skip "info"
    while i < parts.len() {
        match parts[i] {
            "depth" => {
                if i + 1 < parts.len() {
                    info.depth = parts[i + 1].parse().ok();
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "score" => {
                if i + 2 < parts.len() && parts[i + 1] == "cp" {
                    info.score_cp = parts[i + 2].parse().ok();
                    i += 3;
                } else {
                    i += 1;
                }
            }
            "nodes" => {
                if i + 1 < parts.len() {
                    info.nodes = parts[i + 1].parse().ok();
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "nps" => {
                if i + 1 < parts.len() {
                    info.nps = parts[i + 1].parse().ok();
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "time" => {
                if i + 1 < parts.len() {
                    info.time = parts[i + 1].parse().ok();
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "pv" => {
                // Collect all remaining parts as the principal variation
                info.pv = parts[i + 1..].iter().map(|s| s.to_string()).collect();
                break;
            }
            _ => {
                i += 1;
            }
        }
    }

    UsiResponse::Info(info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_usiok() {
        match parse_usi_line("usiok") {
            UsiResponse::UsiOk => {}
            _ => panic!("Expected UsiOk"),
        }
    }

    #[test]
    fn test_parse_readyok() {
        match parse_usi_line("readyok") {
            UsiResponse::ReadyOk => {}
            _ => panic!("Expected ReadyOk"),
        }
    }

    #[test]
    fn test_parse_bestmove() {
        match parse_usi_line("bestmove 7g7f") {
            UsiResponse::BestMove { best_move, ponder } => {
                assert_eq!(best_move, "7g7f");
                assert_eq!(ponder, None);
            }
            _ => panic!("Expected BestMove"),
        }
    }

    #[test]
    fn test_parse_bestmove_with_ponder() {
        match parse_usi_line("bestmove 7g7f ponder 3c3d") {
            UsiResponse::BestMove { best_move, ponder } => {
                assert_eq!(best_move, "7g7f");
                assert_eq!(ponder, Some("3c3d".to_string()));
            }
            _ => panic!("Expected BestMove with ponder"),
        }
    }

    #[test]
    fn test_parse_info() {
        match parse_usi_line("info depth 5 score cp 100 nodes 1000 nps 50000 time 20 pv 7g7f 3c3d") {
            UsiResponse::Info(info) => {
                assert_eq!(info.depth, Some(5));
                assert_eq!(info.score_cp, Some(100));
                assert_eq!(info.nodes, Some(1000));
                assert_eq!(info.nps, Some(50000));
                assert_eq!(info.time, Some(20));
                assert_eq!(info.pv, vec!["7g7f", "3c3d"]);
            }
            _ => panic!("Expected Info"),
        }
    }
}
