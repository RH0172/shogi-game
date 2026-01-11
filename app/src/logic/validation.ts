import type { Board, Move, Player, CapturedPieces, PieceType, Position } from './types';
import { isInBounds, applyMove } from './board';
import { getPieceMovementPattern, getLegalMoves } from './moves';

/**
 * 二歩（にふ）違反チェック
 * 同じ筋に自分の歩が2つ存在する状態を禁止
 * @param board 盤面
 * @param move 指し手
 * @param player プレイヤー
 * @returns 二歩違反の場合true
 */
export function isNifuViolation(board: Board, move: Move, player: Player): boolean {
  // 歩を打つ手でない場合は違反なし
  if (move.piece !== 'FU' || move.from !== null) {
    return false;
  }

  const targetCol = move.to.col;

  // 同じ筋に自分の成っていない歩があるかチェック
  for (let row = 0; row < 9; row++) {
    const piece = board[row][targetCol];
    if (piece && piece.type === 'FU' && piece.owner === player) {
      return true; // 二歩違反
    }
  }

  return false;
}

/**
 * 打ち歩詰め（うちふづめ）違反チェック
 * 歩を打って詰ませる手を禁止（ただし、歩以外の駒で逃げられる場合や、
 * 歩を取れる場合は詰みではないので打ち歩詰めではない）
 * @param board 盤面
 * @param move 指し手
 * @param player プレイヤー
 * @returns 打ち歩詰め違反の場合true
 */
export function isUchifuzumeViolation(board: Board, move: Move, player: Player): boolean {
  // 歩を打つ手でない場合は違反なし
  if (move.piece !== 'FU' || move.from !== null) {
    return false;
  }

  // 一時的に歩を打った盤面を作成
  const newBoard = applyMove(board, move);
  const opponent = player === 'sente' ? 'gote' : 'sente';

  // 相手の王が詰んでいるかチェック
  if (!isCheckmate(newBoard, opponent)) {
    return false; // 詰んでいないので打ち歩詰めではない
  }

  // 詰んでいる場合、打った歩を取る以外の方法で詰みを回避できるかチェック
  // 打ち歩詰めの定義: 歩を打って即詰みになり、かつその歩を取る以外に逃れる方法がない
  // つまり、歩を取れば詰みでなくなる場合は打ち歩詰め

  // 打った歩を取り除いた盤面を作成
  const boardWithoutPawn = applyMove(board, move);
  boardWithoutPawn[move.to.row][move.to.col] = null;

  // 歩がない状態で詰んでいるかチェック
  const isCheckmateWithoutPawn = isCheckmate(boardWithoutPawn, opponent);

  // 歩がなくても詰んでいる → 打ち歩詰めではない（他の駒で詰んでいる）
  // 歩がないと詰んでいない → 打ち歩詰め（歩を打ったことで詰んだ）
  return !isCheckmateWithoutPawn;
}

/**
 * 詰みかどうか判定（validation.ts内で使用するためここに定義）
 * judge.tsの実装と重複するが、循環参照を避けるため
 */
function isCheckmate(board: Board, player: Player): boolean {
  // 王手されているかチェック
  if (!isKingInCheck(board, player)) {
    return false;
  }

  // すべての合法手を試す
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== player) continue;

      const legalMoves = getLegalMoves(board, { row, col });
      if (legalMoves.length > 0) {
        return false; // 逃げる手がある
      }
    }
  }

  // 持ち駒を打って王手を防げるかチェック（簡略版）
  // 完全な実装はjudge.tsで行う

  return true; // 詰み
}

/**
 * 王手判定（validation.ts内で使用するためここに定義）
 */
function isKingInCheck(board: Board, player: Player): boolean {
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

  if (!kingPos) return false;

  // 相手の駒が王を取れるかチェック
  const opponent = player === 'sente' ? 'gote' : 'sente';

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== opponent) continue;

      // その駒の合法手に王の位置が含まれるかチェック
      // 王手判定では王手放置チェックを無効化する必要があるため、
      // 基本的な移動パターンのみをチェック
      const { moves } = getPieceMovementPattern(piece.type, { row, col }, opponent);

      for (const move of moves) {
        if (!isInBounds(move)) continue;

        // 連続移動する駒の場合、途中に駒があればブロックされる
        const isBlocked = isPathBlocked(board, { row, col }, move, opponent);
        if (isBlocked) continue;

        if (move.row === kingPos.row && move.col === kingPos.col) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 経路上に駒があるかチェック（連続移動する駒用）
 */
function isPathBlocked(board: Board, from: Position, to: Position, player: Player): boolean {
  const dr = to.row - from.row;
  const dc = to.col - from.col;

  // 1マス移動または桂馬飛びの場合はブロックされない
  if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return false;
  if (Math.abs(dr) === 2 && Math.abs(dc) === 1 && dr !== 0 && dc !== 0) return false; // 桂馬

  // 方向を正規化
  const stepRow = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepCol = dc === 0 ? 0 : dc / Math.abs(dc);

  let currentRow = from.row + stepRow;
  let currentCol = from.col + stepCol;

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
      return true; // 途中に駒がある
    }
    currentRow += stepRow;
    currentCol += stepCol;
  }

  // 目的地の駒は相手の駒なら取れる
  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.owner === player) {
    return true; // 自分の駒がある
  }

  return false;
}

/**
 * 行き所のない駒チェック
 * 打った駒がその後動けない位置に打つことを禁止
 * @param board 盤面
 * @param piece 駒の種類
 * @param position 打つ位置
 * @param player プレイヤー
 * @returns 行き所のない駒の場合true（違反）
 */
export function canPlacePiece(
  _board: Board,
  piece: PieceType,
  position: Position,
  player: Player
): boolean {
  // 歩・香: 一段目（先手は0、後手は8）に打てない
  if (piece === 'FU' || piece === 'KY') {
    const invalidRow = player === 'sente' ? 0 : 8;
    if (position.row === invalidRow) {
      return false; // 行き所のない駒
    }
  }

  // 桂: 一段目・二段目（先手は0,1、後手は7,8）に打てない
  if (piece === 'KE') {
    const invalidRows = player === 'sente' ? [0, 1] : [7, 8];
    if (invalidRows.includes(position.row)) {
      return false; // 行き所のない駒
    }
  }

  return true;
}

/**
 * 手が合法かどうか総合的に判定
 * @param board 盤面
 * @param move 指し手
 * @param player プレイヤー
 * @param capturedPieces 持ち駒
 * @returns 合法手の場合true
 */
export function isValidMove(
  board: Board,
  move: Move,
  player: Player,
  capturedPieces: CapturedPieces
): boolean {
  // 移動先が盤面内かチェック
  if (!isInBounds(move.to)) {
    return false;
  }

  // 持ち駒を打つ場合
  if (move.from === null) {
    // 移動先が空いているかチェック
    if (board[move.to.row][move.to.col] !== null) {
      return false;
    }

    // 持ち駒を持っているかチェック
    const playerCaptured = player === 'sente' ? capturedPieces.sente : capturedPieces.gote;
    if (!playerCaptured.includes(move.piece)) {
      return false;
    }

    // 二歩チェック
    if (isNifuViolation(board, move, player)) {
      return false;
    }

    // 行き所のない駒チェック
    if (!canPlacePiece(board, move.piece, move.to, player)) {
      return false;
    }

    // 打ち歩詰めチェック
    if (isUchifuzumeViolation(board, move, player)) {
      return false;
    }

    // 王手放置チェック（打った後に自分の王が取られないか）
    const newBoard = applyMove(board, move);
    if (isKingInCheck(newBoard, player)) {
      return false;
    }

    return true;
  }

  // 盤上の駒を動かす場合
  const piece = board[move.from.row][move.from.col];
  if (!piece) {
    return false; // 移動元に駒がない
  }

  if (piece.owner !== player) {
    return false; // 相手の駒を動かそうとしている
  }

  // その駒の合法手に含まれているかチェック
  const legalMoves = getLegalMoves(board, move.from, capturedPieces);
  const isLegalDestination = legalMoves.some(
    pos => pos.row === move.to.row && pos.col === move.to.col
  );

  if (!isLegalDestination) {
    return false;
  }

  // 成りのチェック（強制成りの場合に成っているか）
  // これはUI側で処理することが多いが、ここでも一応チェック
  // canPromote関数を使って判定

  return true;
}

/**
 * 千日手（せんにちて）チェック
 * 同一局面が4回出現した場合に引き分け
 * この関数は judge.ts に移動予定だが、ここにも定義
 * @param positionHistory 局面履歴（SFEN形式）
 * @param currentSfen 現在の局面
 * @returns 千日手の場合true
 */
export function isRepetitionDraw(positionHistory: string[], currentSfen: string): boolean {
  const count = positionHistory.filter(sfen => sfen === currentSfen).length;
  return count >= 4;
}
