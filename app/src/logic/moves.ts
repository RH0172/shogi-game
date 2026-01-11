import type { Board, Piece, Position, Move, PieceType, Player, PromotionStatus, CapturedPieces } from './types';
import { isInBounds, applyMove, canBePromoted, isPromoted } from './board';

/**
 * 駒の基本的な移動パターンを取得
 * @param pieceType 駒の種類
 * @param pos 現在の位置
 * @param player プレイヤー（先手/後手）
 * @returns 移動可能な方向のベクトル配列と、連続移動可能かのフラグ
 */
export function getPieceMovementPattern(
  pieceType: PieceType,
  pos: Position,
  player: Player
): { moves: Position[], isRanged: boolean } {
  // 方向: 先手は上方向(row減少)、後手は下方向(row増加)
  const direction = player === 'sente' ? -1 : 1;

  const moves: Position[] = [];
  let isRanged = false; // 連続移動可能か（香・角・飛・馬・竜）

  switch (pieceType) {
    case 'FU': // 歩 - 前に1マス
      moves.push({ row: pos.row + direction, col: pos.col });
      break;

    case 'KY': // 香 - 前方に直進
      isRanged = true;
      for (let i = 1; i < 9; i++) {
        moves.push({ row: pos.row + direction * i, col: pos.col });
      }
      break;

    case 'KE': // 桂 - 前方2マス+左右1マス（桂馬飛び）
      moves.push({ row: pos.row + direction * 2, col: pos.col - 1 });
      moves.push({ row: pos.row + direction * 2, col: pos.col + 1 });
      break;

    case 'GI': // 銀 - 前方3方向+斜め後ろ2方向
      moves.push({ row: pos.row + direction, col: pos.col - 1 }); // 左前
      moves.push({ row: pos.row + direction, col: pos.col });     // 前
      moves.push({ row: pos.row + direction, col: pos.col + 1 }); // 右前
      moves.push({ row: pos.row - direction, col: pos.col - 1 }); // 左後ろ
      moves.push({ row: pos.row - direction, col: pos.col + 1 }); // 右後ろ
      break;

    case 'KI': // 金 - 前方3方向+左右+真後ろ
    case 'TO': // と（成歩）- 金と同じ動き
    case 'NY': // 成香 - 金と同じ動き
    case 'NK': // 成桂 - 金と同じ動き
    case 'NG': // 成銀 - 金と同じ動き
      moves.push({ row: pos.row + direction, col: pos.col - 1 }); // 左前
      moves.push({ row: pos.row + direction, col: pos.col });     // 前
      moves.push({ row: pos.row + direction, col: pos.col + 1 }); // 右前
      moves.push({ row: pos.row, col: pos.col - 1 });             // 左
      moves.push({ row: pos.row, col: pos.col + 1 });             // 右
      moves.push({ row: pos.row - direction, col: pos.col });     // 後ろ
      break;

    case 'KA': // 角 - 斜め4方向に直進
      isRanged = true;
      for (let i = 1; i < 9; i++) {
        moves.push({ row: pos.row + i, col: pos.col + i });   // 右下
        moves.push({ row: pos.row + i, col: pos.col - i });   // 左下
        moves.push({ row: pos.row - i, col: pos.col + i });   // 右上
        moves.push({ row: pos.row - i, col: pos.col - i });   // 左上
      }
      break;

    case 'HI': // 飛 - 縦横4方向に直進
      isRanged = true;
      for (let i = 1; i < 9; i++) {
        moves.push({ row: pos.row + i, col: pos.col });       // 下
        moves.push({ row: pos.row - i, col: pos.col });       // 上
        moves.push({ row: pos.row, col: pos.col + i });       // 右
        moves.push({ row: pos.row, col: pos.col - i });       // 左
      }
      break;

    case 'OU': // 王 - 8方向に1マス
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          moves.push({ row: pos.row + dr, col: pos.col + dc });
        }
      }
      break;

    case 'UM': // 馬（成角）- 角の動き + 前後左右1マス
      isRanged = true;
      // 斜め方向（角の動き）
      for (let i = 1; i < 9; i++) {
        moves.push({ row: pos.row + i, col: pos.col + i });
        moves.push({ row: pos.row + i, col: pos.col - i });
        moves.push({ row: pos.row - i, col: pos.col + i });
        moves.push({ row: pos.row - i, col: pos.col - i });
      }
      // 前後左右1マス
      moves.push({ row: pos.row + 1, col: pos.col });
      moves.push({ row: pos.row - 1, col: pos.col });
      moves.push({ row: pos.row, col: pos.col + 1 });
      moves.push({ row: pos.row, col: pos.col - 1 });
      break;

    case 'RY': // 竜（成飛）- 飛の動き + 斜め1マス
      isRanged = true;
      // 縦横方向（飛の動き）
      for (let i = 1; i < 9; i++) {
        moves.push({ row: pos.row + i, col: pos.col });
        moves.push({ row: pos.row - i, col: pos.col });
        moves.push({ row: pos.row, col: pos.col + i });
        moves.push({ row: pos.row, col: pos.col - i });
      }
      // 斜め1マス
      moves.push({ row: pos.row + 1, col: pos.col + 1 });
      moves.push({ row: pos.row + 1, col: pos.col - 1 });
      moves.push({ row: pos.row - 1, col: pos.col + 1 });
      moves.push({ row: pos.row - 1, col: pos.col - 1 });
      break;
  }

  return { moves, isRanged };
}

/**
 * 連続移動する駒（香・角・飛・馬・竜）の実際に到達可能な位置を計算
 * 盤面の端や他の駒でブロックされる位置を除外
 * @param board 盤面
 * @param pos 開始位置
 * @param direction 移動方向ベクトル
 * @param maxDistance 最大移動距離
 * @param owner 駒の所有者
 * @returns 到達可能な位置の配列
 */
function getRangedMoves(
  board: Board,
  pos: Position,
  direction: { dr: number, dc: number },
  maxDistance: number,
  owner: Player
): Position[] {
  const moves: Position[] = [];

  for (let i = 1; i <= maxDistance; i++) {
    const newPos = {
      row: pos.row + direction.dr * i,
      col: pos.col + direction.dc * i
    };

    // 盤面外なら終了
    if (!isInBounds(newPos)) break;

    const targetPiece = board[newPos.row][newPos.col];

    // 空きマスなら追加して継続
    if (!targetPiece) {
      moves.push(newPos);
      continue;
    }

    // 相手の駒なら取れるので追加して終了
    if (targetPiece.owner !== owner) {
      moves.push(newPos);
    }

    // 駒があるので（自分の駒 or 相手の駒を取った後）ここで終了
    break;
  }

  return moves;
}

/**
 * 指定位置の駒の合法手を取得（王手放置チェック含む）
 * @param board 盤面
 * @param pos 駒の位置
 * @param capturedPieces 持ち駒（使用しない場合はundefined）
 * @returns 合法手の配列
 */
export function getLegalMoves(
  board: Board,
  pos: Position,
  _capturedPieces?: CapturedPieces
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const { moves: candidateMoves, isRanged } = getPieceMovementPattern(
    piece.type,
    pos,
    piece.owner
  );

  let validMoves: Position[];

  if (isRanged) {
    // 連続移動する駒の場合、方向ごとに到達可能な位置を計算
    validMoves = [];
    const directions = getUniqueDirections(candidateMoves, pos);

    for (const dir of directions) {
      const rangedMoves = getRangedMoves(board, pos, dir, 8, piece.owner);
      validMoves.push(...rangedMoves);
    }
  } else {
    // 1マス移動または特殊移動の場合
    validMoves = candidateMoves.filter(move => {
      // 盤面外を除外
      if (!isInBounds(move)) return false;

      // 自分の駒がある位置を除外
      const targetPiece = board[move.row][move.col];
      if (targetPiece && targetPiece.owner === piece.owner) return false;

      return true;
    });
  }

  // 王手放置チェック: その手を指した後、自分の王が取られないか確認
  const safeMoves = validMoves.filter(targetPos => {
    const testMove: Move = {
      from: pos,
      to: targetPos,
      piece: piece.type,
      promote: false
    };

    const newBoard = applyMove(board, testMove);
    return !isKingInCheck(newBoard, piece.owner);
  });

  return safeMoves;
}

/**
 * 移動候補から一意な方向ベクトルを抽出
 * @param moves 移動候補の位置配列
 * @param origin 原点位置
 * @returns 方向ベクトルの配列
 */
function getUniqueDirections(moves: Position[], origin: Position): Array<{ dr: number, dc: number }> {
  const directions = new Set<string>();
  const result: Array<{ dr: number, dc: number }> = [];

  for (const move of moves) {
    const dr = move.row - origin.row;
    const dc = move.col - origin.col;

    if (dr === 0 && dc === 0) continue;

    // 方向を正規化（単位ベクトル化）
    const gcd = Math.abs(greatestCommonDivisor(dr, dc));
    const normalizedDr = dr / gcd;
    const normalizedDc = dc / gcd;

    const key = `${normalizedDr},${normalizedDc}`;
    if (!directions.has(key)) {
      directions.add(key);
      result.push({ dr: normalizedDr, dc: normalizedDc });
    }
  }

  return result;
}

/**
 * 最大公約数を求める
 */
function greatestCommonDivisor(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b === 0) return a || 1;
  return greatestCommonDivisor(b, a % b);
}

/**
 * 王が取られる状態かチェック（王手判定）
 * この関数はjudge.tsに移動すべきだが、循環参照を避けるためここに定義
 * @param board 盤面
 * @param player チェックするプレイヤー
 * @returns 王手の場合true
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

  if (!kingPos) return false; // 王が見つからない（テスト用の不完全な盤面）

  // 相手の駒が王を取れるかチェック
  const opponent = player === 'sente' ? 'gote' : 'sente';

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== opponent) continue;

      const { moves: candidateMoves, isRanged } = getPieceMovementPattern(
        piece.type,
        { row, col },
        opponent
      );

      if (isRanged) {
        // 連続移動する駒の場合
        const directions = getUniqueDirections(candidateMoves, { row, col });
        for (const dir of directions) {
          const reachableMoves = getRangedMoves(board, { row, col }, dir, 8, opponent);
          if (reachableMoves.some(pos => pos.row === kingPos.row && pos.col === kingPos.col)) {
            return true;
          }
        }
      } else {
        // 1マス移動の場合
        const validMoves = candidateMoves.filter(move => {
          if (!isInBounds(move)) return false;
          const targetPiece = board[move.row][move.col];
          return !targetPiece || targetPiece.owner !== opponent;
        });

        if (validMoves.some(pos => pos.row === kingPos.row && pos.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * プレイヤーのすべての合法手を取得
 * @param board 盤面
 * @param player プレイヤー
 * @param capturedPieces 持ち駒
 * @returns すべての合法手の配列
 */
export function getAllLegalMoves(
  board: Board,
  player: Player,
  capturedPieces: CapturedPieces
): Move[] {
  const allMoves: Move[] = [];

  // 盤上の駒の移動
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== player) continue;

      const legalMoves = getLegalMoves(board, { row, col }, capturedPieces);

      for (const to of legalMoves) {
        const move: Move = {
          from: { row, col },
          to,
          piece: piece.type,
          promote: false
        };

        // 成れる場合は、成る手と成らない手の両方を追加
        const promotionStatus = canPromote(piece, { row, col }, to, player);

        if (promotionStatus === 'required') {
          move.promote = true;
          allMoves.push(move);
        } else if (promotionStatus === 'optional') {
          allMoves.push({ ...move, promote: false });
          allMoves.push({ ...move, promote: true });
        } else {
          allMoves.push(move);
        }
      }
    }
  }

  // 持ち駒を打つ手
  const playerCaptured = player === 'sente' ? capturedPieces.sente : capturedPieces.gote;
  const uniquePieces = Array.from(new Set(playerCaptured));

  for (const pieceType of uniquePieces) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // 空きマスのみ
        if (board[row][col] !== null) continue;

        const move: Move = {
          from: null,
          to: { row, col },
          piece: pieceType,
          promote: false
        };

        // 行き所のない駒チェックは validation.ts で行うため、ここでは基本的な打ち手のみ生成
        allMoves.push(move);
      }
    }
  }

  return allMoves;
}

/**
 * 駒が成れるかどうか判定
 * @param piece 駒
 * @param from 移動元の位置
 * @param to 移動先の位置
 * @param player プレイヤー
 * @returns 成りの状態（required/optional/forbidden）
 */
export function canPromote(
  piece: Piece,
  from: Position,
  to: Position,
  player: Player
): PromotionStatus {
  // すでに成り駒、または成れない駒（金・王）
  if (isPromoted(piece.type) || !canBePromoted(piece.type)) {
    return 'forbidden';
  }

  // 敵陣の範囲を判定（先手: row 0-2、後手: row 6-8）
  const enemyZone = player === 'sente' ? [0, 1, 2] : [6, 7, 8];
  const inEnemyZoneFrom = enemyZone.includes(from.row);
  const inEnemyZoneTo = enemyZone.includes(to.row);

  // 敵陣に入るか、敵陣内での移動なら成れる
  const canPromoteMove = inEnemyZoneFrom || inEnemyZoneTo;
  if (!canPromoteMove) {
    return 'forbidden';
  }

  // 行き所のない駒判定（強制成り）
  // 歩・香: 一段目に行く場合は強制成り
  if ((piece.type === 'FU' || piece.type === 'KY') &&
      to.row === (player === 'sente' ? 0 : 8)) {
    return 'required';
  }

  // 桂: 一段目・二段目に行く場合は強制成り
  if (piece.type === 'KE' &&
      (to.row === (player === 'sente' ? 0 : 8) ||
       to.row === (player === 'sente' ? 1 : 7))) {
    return 'required';
  }

  return 'optional';
}
