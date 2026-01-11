import type { Board, Player, GameStatus, Position, CapturedPieces } from './types';
import { isInBounds } from './board';
import { getPieceMovementPattern, getLegalMoves, getAllLegalMoves } from './moves';

/**
 * 王が取られる状態かチェック（王手判定）
 * @param board 盤面
 * @param player チェックするプレイヤー（この王が取られるか）
 * @returns 王手の場合true
 */
export function isKingInCheck(board: Board, player: Player): boolean {
  // 王の位置を探す
  let kingPos: Position | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'OU' && piece.owner === player) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) {
    return false; // 王が見つからない（テスト用の不完全な盤面など）
  }

  // 相手の駒が王を取れるかチェック
  const opponent = player === 'sente' ? 'gote' : 'sente';

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== opponent) continue;

      // その駒の移動パターンを取得
      const { moves, isRanged } = getPieceMovementPattern(
        piece.type,
        { row, col },
        opponent
      );

      // 連続移動する駒の場合、途中に駒があればブロックされる
      if (isRanged) {
        for (const move of moves) {
          if (!isInBounds(move)) continue;

          // 経路上に駒があるかチェック
          const blocked = isPathBlocked(board, { row, col }, move, opponent);
          if (blocked) continue;

          if (move.row === kingPos.row && move.col === kingPos.col) {
            return true; // 王手
          }
        }
      } else {
        // 1マス移動または特殊移動
        for (const move of moves) {
          if (!isInBounds(move)) continue;

          // 移動先に自分の駒がある場合は移動不可
          const targetPiece = board[move.row][move.col];
          if (targetPiece && targetPiece.owner === opponent) continue;

          if (move.row === kingPos.row && move.col === kingPos.col) {
            return true; // 王手
          }
        }
      }
    }
  }

  return false;
}

/**
 * 経路上に駒があるかチェック（連続移動する駒用）
 * @param board 盤面
 * @param from 移動元
 * @param to 移動先
 * @param player 移動するプレイヤー
 * @returns 経路がブロックされている場合true
 */
function isPathBlocked(board: Board, from: Position, to: Position, player: Player): boolean {
  const dr = to.row - from.row;
  const dc = to.col - from.col;

  // 1マス移動または桂馬飛びの場合はブロックされない
  if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return false;
  if (Math.abs(dr) === 2 && Math.abs(dc) === 1) return false; // 桂馬

  // 方向を正規化
  const gcd = greatestCommonDivisor(Math.abs(dr), Math.abs(dc));
  const stepRow = dr / gcd;
  const stepCol = dc / gcd;

  let currentRow = from.row + stepRow;
  let currentCol = from.col + stepCol;

  // 目的地に到達するまで途中の駒をチェック
  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
      return true; // 途中に駒がある
    }
    currentRow += stepRow;
    currentCol += stepCol;
  }

  // 目的地の駒は相手の駒なら取れるのでブロックされない
  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.owner === player) {
    return true; // 自分の駒があるのでブロック
  }

  return false;
}

/**
 * 最大公約数を求める
 */
function greatestCommonDivisor(a: number, b: number): number {
  if (b === 0) return a || 1;
  return greatestCommonDivisor(b, a % b);
}

/**
 * 詰みかどうか判定
 * @param board 盤面
 * @param player チェックするプレイヤー（この王が詰んでいるか）
 * @param capturedPieces 持ち駒
 * @returns 詰みの場合true
 */
export function isCheckmate(board: Board, player: Player, capturedPieces: CapturedPieces): boolean {
  // 王手されていない場合は詰みではない
  if (!isKingInCheck(board, player)) {
    return false;
  }

  // すべての合法手を取得
  const allMoves = getAllLegalMoves(board, player, capturedPieces);

  // 合法手が1つでもあれば詰みではない
  if (allMoves.length > 0) {
    return false;
  }

  // 王手されていて、かつ合法手がない → 詰み
  return true;
}

/**
 * ステイルメイト判定（将棋では通常発生しないが、念のため実装）
 * @param board 盤面
 * @param player チェックするプレイヤー
 * @param capturedPieces 持ち駒
 * @returns ステイルメイトの場合true
 */
export function isStalemate(board: Board, player: Player, capturedPieces: CapturedPieces): boolean {
  // 王手されていない状態で、合法手がない場合
  if (isKingInCheck(board, player)) {
    return false;
  }

  const allMoves = getAllLegalMoves(board, player, capturedPieces);
  return allMoves.length === 0;
}

/**
 * 千日手（同一局面の4回出現）チェック
 * @param positionHistory 局面履歴（SFEN文字列の配列）
 * @param currentSfen 現在の局面（SFEN文字列）
 * @returns 千日手の場合true
 */
export function isRepetition(positionHistory: string[], currentSfen: string): boolean {
  // 現在の局面を含めて4回以上出現している場合は千日手
  let count = 0;
  for (const sfen of positionHistory) {
    if (sfen === currentSfen) {
      count++;
    }
  }

  // 現在の局面を含めて4回出現（履歴に3回 + 現在1回 = 4回）
  return count >= 3;
}

/**
 * ゲームの状態をチェックして判定
 * @param board 盤面
 * @param player 現在の手番のプレイヤー
 * @param positionHistory 局面履歴
 * @param capturedPieces 持ち駒
 * @param currentSfen 現在の局面（SFEN文字列、千日手判定用）
 * @returns ゲーム状態
 */
export function checkGameStatus(
  board: Board,
  player: Player,
  positionHistory: string[],
  capturedPieces: CapturedPieces,
  currentSfen?: string
): GameStatus {
  // 千日手チェック
  if (currentSfen && isRepetition(positionHistory, currentSfen)) {
    return 'repetition';
  }

  // 詰みチェック
  if (isCheckmate(board, player, capturedPieces)) {
    return 'checkmate';
  }

  // ステイルメイトチェック（将棋では稀）
  if (isStalemate(board, player, capturedPieces)) {
    return 'stalemate';
  }

  // 王手チェック
  if (isKingInCheck(board, player)) {
    return 'check';
  }

  // 通常の進行中
  return 'playing';
}

/**
 * 入玉宣言勝ち判定（24点法）
 * 先手の王が後手陣に入り、一定の点数以上の駒を敵陣に持っている場合に勝利
 * ※高度なルールのため、後で実装することも可能
 * @param board 盤面
 * @param player チェックするプレイヤー
 * @returns 入玉宣言勝ちの場合true
 */
export function canDeclareWin(board: Board, player: Player): boolean {
  // 王の位置を確認
  let kingPos: Position | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'OU' && piece.owner === player) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  // 王が敵陣にいるかチェック（先手: row 0-2、後手: row 6-8）
  const enemyZone = player === 'sente' ? [0, 1, 2] : [6, 7, 8];
  if (!enemyZone.includes(kingPos.row)) {
    return false; // 王が敵陣にいない
  }

  // 敵陣にいる駒の点数を計算
  // 大駒（飛・角・竜・馬）: 5点
  // その他の駒: 1点
  let points = 0;

  for (let row = 0; row < 9; row++) {
    // 敵陣のみカウント
    if (!enemyZone.includes(row)) continue;

    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== player) continue;

      if (piece.type === 'HI' || piece.type === 'KA' ||
          piece.type === 'RY' || piece.type === 'UM') {
        points += 5; // 大駒
      } else if (piece.type !== 'OU') {
        points += 1; // その他の駒（王以外）
      }
    }
  }

  // 24点以上で入玉宣言勝ち（ルールによって異なる場合がある）
  return points >= 24;
}

/**
 * 王が逃げられる位置を取得（詰み判定の補助関数）
 * @param board 盤面
 * @param player プレイヤー
 * @returns 王が逃げられる位置の配列
 */
export function getKingEscapeSquares(board: Board, player: Player): Position[] {
  // 王の位置を探す
  let kingPos: Position | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'OU' && piece.owner === player) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return [];

  // 王の合法手を取得
  return getLegalMoves(board, kingPos);
}

/**
 * 王手している駒の位置を取得
 * @param board 盤面
 * @param player チェックされているプレイヤー
 * @returns 王手している駒の位置の配列
 */
export function getCheckingPieces(board: Board, player: Player): Position[] {
  const checkingPieces: Position[] = [];

  // 王の位置を探す
  let kingPos: Position | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'OU' && piece.owner === player) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return [];

  // 相手の駒をチェック
  const opponent = player === 'sente' ? 'gote' : 'sente';

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== opponent) continue;

      const { moves, isRanged } = getPieceMovementPattern(
        piece.type,
        { row, col },
        opponent
      );

      const canAttackKing = moves.some(move => {
        if (!isInBounds(move)) return false;
        if (isRanged && isPathBlocked(board, { row, col }, move, opponent)) return false;

        return move.row === kingPos.row && move.col === kingPos.col;
      });

      if (canAttackKing) {
        checkingPieces.push({ row, col });
      }
    }
  }

  return checkingPieces;
}
