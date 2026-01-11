// USI protocol command builder

/// Build the "usi" command
/// Tells the engine to use USI protocol
pub fn build_usi_command() -> String {
    "usi".to_string()
}

/// Build the "isready" command
/// Checks if the engine is ready
pub fn build_isready_command() -> String {
    "isready".to_string()
}

/// Build the "position" command
/// Format: "position sfen <sfen> [moves <move1> <move2> ...]"
pub fn build_position_command(sfen: &str, moves: &[String]) -> String {
    if moves.is_empty() {
        format!("position sfen {}", sfen)
    } else {
        format!("position sfen {} moves {}", sfen, moves.join(" "))
    }
}

/// Build the "go" command with byoyomi (time per move)
/// Format: "go byoyomi <time_ms>"
pub fn build_go_byoyomi_command(time_ms: u32) -> String {
    format!("go byoyomi {}", time_ms)
}

/// Build the "go" command with time controls
/// Format: "go btime <black_time> wtime <white_time> binc <black_inc> winc <white_inc>"
pub fn build_go_time_command(
    black_time_ms: u32,
    white_time_ms: u32,
    black_inc_ms: u32,
    white_inc_ms: u32,
) -> String {
    format!(
        "go btime {} wtime {} binc {} winc {}",
        black_time_ms, white_time_ms, black_inc_ms, white_inc_ms
    )
}

/// Build the "go" command with depth limit
/// Format: "go depth <depth>"
pub fn build_go_depth_command(depth: u32) -> String {
    format!("go depth {}", depth)
}

/// Build the "stop" command
/// Stops the engine from thinking
pub fn build_stop_command() -> String {
    "stop".to_string()
}

/// Build the "quit" command
/// Tells the engine to quit
pub fn build_quit_command() -> String {
    "quit".to_string()
}

/// Build the "usinewgame" command
/// Tells the engine a new game is starting
pub fn build_usinewgame_command() -> String {
    "usinewgame".to_string()
}

/// Build a "setoption" command
/// Format: "setoption name <name> value <value>"
pub fn build_setoption_command(name: &str, value: &str) -> String {
    format!("setoption name {} value {}", name, value)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_usi_command() {
        assert_eq!(build_usi_command(), "usi");
    }

    #[test]
    fn test_build_isready_command() {
        assert_eq!(build_isready_command(), "isready");
    }

    #[test]
    fn test_build_position_command() {
        let sfen = "lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1";
        assert_eq!(
            build_position_command(sfen, &[]),
            format!("position sfen {}", sfen)
        );
    }

    #[test]
    fn test_build_position_command_with_moves() {
        let sfen = "lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1";
        let moves = vec!["7g7f".to_string(), "3c3d".to_string()];
        assert_eq!(
            build_position_command(sfen, &moves),
            format!("position sfen {} moves 7g7f 3c3d", sfen)
        );
    }

    #[test]
    fn test_build_go_byoyomi_command() {
        assert_eq!(build_go_byoyomi_command(1000), "go byoyomi 1000");
    }

    #[test]
    fn test_build_go_time_command() {
        assert_eq!(
            build_go_time_command(60000, 60000, 0, 0),
            "go btime 60000 wtime 60000 binc 0 winc 0"
        );
    }

    #[test]
    fn test_build_go_depth_command() {
        assert_eq!(build_go_depth_command(10), "go depth 10");
    }

    #[test]
    fn test_build_stop_command() {
        assert_eq!(build_stop_command(), "stop");
    }

    #[test]
    fn test_build_quit_command() {
        assert_eq!(build_quit_command(), "quit");
    }

    #[test]
    fn test_build_usinewgame_command() {
        assert_eq!(build_usinewgame_command(), "usinewgame");
    }

    #[test]
    fn test_build_setoption_command() {
        assert_eq!(
            build_setoption_command("USI_Hash", "256"),
            "setoption name USI_Hash value 256"
        );
    }
}
