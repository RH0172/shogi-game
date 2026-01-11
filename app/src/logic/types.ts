// 駒の種類
export type PieceType =
  | 'FU'  // 歩
  | 'KY'  // 香
  | 'KE'  // 桂
  | 'GI'  // 銀
  | 'KI'  // 金
  | 'KA'  // 角
  | 'HI'  // 飛
  | 'OU'  // 王/玉
  | 'TO'  // と(成歩)
  | 'NY'  // 成香
  | 'NK'  // 成桂
  | 'NG'  // 成銀
  | 'UM'  // 馬(成角)
  | 'RY'; // 竜(成飛)

// プレイヤー
export type Player = 'sente' | 'gote';

// 盤上の位置
export interface Position {
  row: number; // 0-8 (一から九まで)
  col: number; // 0-8 (9筋から1筋まで)
}

// 駒
export interface Piece {
  type: PieceType;
  owner: Player;
}

// 手(指し手)
export interface Move {
  from: Position | null; // null = 持ち駒を打つ
  to: Position;
  piece: PieceType;
  promote?: boolean;
  captured?: PieceType; // 取った駒
}

// 盤面(9x9)
export type Board = (Piece | null)[][];

// 持ち駒
export interface CapturedPieces {
  sente: PieceType[];
  gote: PieceType[];
}

// ゲーム状態
export type GameStatus =
  | 'playing'
  | 'check'      // 王手
  | 'checkmate'  // 詰み
  | 'stalemate'  // ステイルメイト(将棋では稀)
  | 'repetition' // 千日手
  | 'resigned';  // 投了

// ゲームモード
export type GameMode = 'pvp' | 'pve';

// AI難易度
export type AILevel = 'easy' | 'medium' | 'hard';

// ゲーム全体の状態
export interface GameState {
  board: Board;
  capturedPieces: CapturedPieces;
  currentPlayer: Player;
  gameStatus: GameStatus;
  winner: Player | null;
  selectedSquare: Position | null;
  selectedCapturedPiece: PieceType | null;
  legalMoves: Position[];
  lastMove: Move | null;
  gameMode: GameMode;
  aiLevel: AILevel;
  moveHistory: Move[];
  positionHistory: string[]; // SFEN strings for repetition detection
  isAIThinking?: boolean; // Optional for backwards compatibility
}

// 駒が成れるかどうかの判定結果
export type PromotionStatus =
  | 'required'  // 強制成り
  | 'optional'  // 選択可能
  | 'forbidden'; // 成れない

// USI engineからの応答
export interface EngineResponse {
  bestMove: string;
  ponder?: string;
  info?: {
    depth?: number;
    score?: number;
    pv?: string[];
  };
}
