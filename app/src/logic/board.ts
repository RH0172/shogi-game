import type { Board, Position, Move, PieceType } from './types';

/**
 * 初期盤面を生成する
 * 将棋の開始局面を作成
 *
 * 後手側
 *   9  8  7  6  5  4  3  2  1
 * ┌─┬─┬─┬─┬─┬─┬─┬─┬─┐
 * │香│桂│銀│金│王│金│銀│桂│香│ 一 (0)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │　│飛│　│　│　│　│　│角│　│ 二 (1)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │歩│歩│歩│歩│歩│歩│歩│歩│歩│ 三 (2)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │　│　│　│　│　│　│　│　│　│ 四 (3)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │　│　│　│　│　│　│　│　│　│ 五 (4)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │　│　│　│　│　│　│　│　│　│ 六 (5)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │歩│歩│歩│歩│歩│歩│歩│歩│歩│ 七 (6)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │　│角│　│　│　│　│　│飛│　│ 八 (7)
 * ├─┼─┼─┼─┼─┼─┼─┼─┼─┤
 * │香│桂│銀│金│王│金│銀│桂│香│ 九 (8)
 * └─┴─┴─┴─┴─┴─┴─┴─┴─┘
 * (8)(7)(6)(5)(4)(3)(2)(1)(0)
 * 先手側
 */
export function createInitialBoard(): Board {
  // 9x9の空盤面を作成
  const board: Board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));

  // 後手(gote)の駒を配置 - row 0-2
  // 一段目 (row 0)
  board[0][0] = { type: 'KY', owner: 'gote' }; // 1筋香
  board[0][1] = { type: 'KE', owner: 'gote' }; // 2筋桂
  board[0][2] = { type: 'GI', owner: 'gote' }; // 3筋銀
  board[0][3] = { type: 'KI', owner: 'gote' }; // 4筋金
  board[0][4] = { type: 'OU', owner: 'gote' }; // 5筋王
  board[0][5] = { type: 'KI', owner: 'gote' }; // 6筋金
  board[0][6] = { type: 'GI', owner: 'gote' }; // 7筋銀
  board[0][7] = { type: 'KE', owner: 'gote' }; // 8筋桂
  board[0][8] = { type: 'KY', owner: 'gote' }; // 9筋香

  // 二段目 (row 1)
  board[1][1] = { type: 'HI', owner: 'gote' }; // 2筋飛
  board[1][7] = { type: 'KA', owner: 'gote' }; // 8筋角

  // 三段目 (row 2) - 歩
  for (let col = 0; col < 9; col++) {
    board[2][col] = { type: 'FU', owner: 'gote' };
  }

  // 先手(sente)の駒を配置 - row 6-8
  // 七段目 (row 6) - 歩
  for (let col = 0; col < 9; col++) {
    board[6][col] = { type: 'FU', owner: 'sente' };
  }

  // 八段目 (row 7)
  board[7][1] = { type: 'KA', owner: 'sente' }; // 2筋角
  board[7][7] = { type: 'HI', owner: 'sente' }; // 8筋飛

  // 九段目 (row 8)
  board[8][0] = { type: 'KY', owner: 'sente' }; // 1筋香
  board[8][1] = { type: 'KE', owner: 'sente' }; // 2筋桂
  board[8][2] = { type: 'GI', owner: 'sente' }; // 3筋銀
  board[8][3] = { type: 'KI', owner: 'sente' }; // 4筋金
  board[8][4] = { type: 'OU', owner: 'sente' }; // 5筋王
  board[8][5] = { type: 'KI', owner: 'sente' }; // 6筋金
  board[8][6] = { type: 'GI', owner: 'sente' }; // 7筋銀
  board[8][7] = { type: 'KE', owner: 'sente' }; // 8筋桂
  board[8][8] = { type: 'KY', owner: 'sente' }; // 9筋香

  return board;
}

/**
 * 盤面のディープコピーを作成
 * @param board コピー元の盤面
 * @returns 新しい盤面のコピー
 */
export function cloneBoard(board: Board): Board {
  return board.map(row =>
    row.map(piece =>
      piece ? { ...piece } : null
    )
  );
}

/**
 * 手を盤面に適用する
 * @param board 現在の盤面
 * @param move 適用する手
 * @returns 新しい盤面（元の盤面は変更しない）
 */
export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);

  // 駒を打つ場合 (持ち駒から)
  if (move.from === null) {
    // 移動先のマスは空いているはず
    newBoard[move.to.row][move.to.col] = {
      type: move.piece,
      owner: board[move.to.row][move.to.col]?.owner || 'sente', // 持ち駒を打つプレイヤー
    };
  }
  // 盤上の駒を動かす場合
  else {
    const movingPiece = newBoard[move.from.row][move.from.col];
    if (!movingPiece) {
      throw new Error(`No piece at position (${move.from.row}, ${move.from.col})`);
    }

    // 移動先に駒を配置
    let pieceType = movingPiece.type;

    // 成る場合
    if (move.promote) {
      pieceType = getPromotedPiece(movingPiece.type);
    }

    newBoard[move.to.row][move.to.col] = {
      type: pieceType,
      owner: movingPiece.owner,
    };

    // 移動元を空にする
    newBoard[move.from.row][move.from.col] = null;
  }

  return newBoard;
}

/**
 * 駒の成り後の種類を取得
 * @param pieceType 成る前の駒の種類
 * @returns 成った後の駒の種類
 */
export function getPromotedPiece(pieceType: PieceType): PieceType {
  const promotionMap: Record<string, PieceType> = {
    'FU': 'TO',  // 歩 → と
    'KY': 'NY',  // 香 → 成香
    'KE': 'NK',  // 桂 → 成桂
    'GI': 'NG',  // 銀 → 成銀
    'KA': 'UM',  // 角 → 馬
    'HI': 'RY',  // 飛 → 竜
  };

  return promotionMap[pieceType] || pieceType;
}

/**
 * 駒が成り駒かどうか判定
 * @param pieceType 駒の種類
 * @returns 成り駒の場合true
 */
export function isPromoted(pieceType: PieceType): boolean {
  return ['TO', 'NY', 'NK', 'NG', 'UM', 'RY'].includes(pieceType);
}

/**
 * 成り駒を元の駒に戻す（取った駒を持ち駒にする時に使用）
 * @param pieceType 成り駒の種類
 * @returns 元の駒の種類
 */
export function getUnpromotedPiece(pieceType: PieceType): PieceType {
  const demotionMap: Record<string, PieceType> = {
    'TO': 'FU',  // と → 歩
    'NY': 'KY',  // 成香 → 香
    'NK': 'KE',  // 成桂 → 桂
    'NG': 'GI',  // 成銀 → 銀
    'UM': 'KA',  // 馬 → 角
    'RY': 'HI',  // 竜 → 飛
  };

  return demotionMap[pieceType] || pieceType;
}

/**
 * 駒が成れる駒かどうか判定
 * @param pieceType 駒の種類
 * @returns 成れる駒の場合true
 */
export function canBePromoted(pieceType: PieceType): boolean {
  return ['FU', 'KY', 'KE', 'GI', 'KA', 'HI'].includes(pieceType);
}

/**
 * 位置が盤面内かどうか判定
 * @param pos チェックする位置
 * @returns 盤面内の場合true
 */
export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
}

/**
 * 2つの位置が同じかどうか判定
 * @param pos1 位置1
 * @param pos2 位置2
 * @returns 同じ位置の場合true
 */
export function positionEquals(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * 盤面上の特定のプレイヤーの王の位置を探す
 * @param board 盤面
 * @param player プレイヤー
 * @returns 王の位置、見つからない場合null
 */
export function findKing(board: Board, player: string): Position | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'OU' && piece.owner === player) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * 盤面を文字列表現に変換（デバッグ用）
 * @param board 盤面
 * @returns 盤面の文字列表現
 */
export function boardToString(board: Board): string {
  const pieceChars: Record<string, string> = {
    'FU': '歩', 'KY': '香', 'KE': '桂', 'GI': '銀', 'KI': '金',
    'KA': '角', 'HI': '飛', 'OU': '王',
    'TO': 'と', 'NY': '杏', 'NK': '圭', 'NG': '全', 'UM': '馬', 'RY': '竜'
  };

  let result = '  9  8  7  6  5  4  3  2  1\n';
  result += '┌─┬─┬─┬─┬─┬─┬─┬─┬─┐\n';

  for (let row = 0; row < 9; row++) {
    result += '│';
    for (let col = 8; col >= 0; col--) {
      const piece = board[row][col];
      if (piece) {
        const char = pieceChars[piece.type] || '？';
        result += piece.owner === 'gote' ? `v${char}` : ` ${char}`;
      } else {
        result += '  ';
      }
      result += '│';
    }
    result += ` ${['一', '二', '三', '四', '五', '六', '七', '八', '九'][row]}\n`;
    if (row < 8) {
      result += '├─┼─┼─┼─┼─┼─┼─┼─┼─┤\n';
    }
  }
  result += '└─┴─┴─┴─┴─┴─┴─┴─┴─┘\n';

  return result;
}
