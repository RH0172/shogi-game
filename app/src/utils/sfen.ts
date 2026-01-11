import type { Board, Player, CapturedPieces, PieceType } from '../logic/types';
import { getUnpromotedPiece } from '../logic/board';

/**
 * SFEN (Shogi Forsyth-Edwards Notation) 形式
 *
 * 例: lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1
 *
 * フォーマット:
 * 1. 盤面 (9段を'/'で区切る、後手側から先手側へ)
 * 2. 手番 (b=先手, w=後手)
 * 3. 持ち駒 (大文字=先手, 小文字=後手, 数字は枚数)
 * 4. 手数
 *
 * 駒の表記:
 * - 先手: 大文字 (P=歩, L=香, N=桂, S=銀, G=金, B=角, R=飛, K=王)
 * - 後手: 小文字 (p=歩, l=香, n=桂, s=銀, g=金, b=角, r=飛, k=王)
 * - 成駒: +を前置 (+P=と, +L=成香, +N=成桂, +S=成銀, +B=馬, +R=竜)
 */

/**
 * 駒の種類をSFEN文字に変換
 * @param pieceType 駒の種類
 * @param owner 駒の所有者
 * @returns SFEN文字
 */
function pieceToSfenChar(pieceType: PieceType, owner: Player): string {
  const charMap: Record<PieceType, string> = {
    'FU': 'P',
    'KY': 'L',
    'KE': 'N',
    'GI': 'S',
    'KI': 'G',
    'KA': 'B',
    'HI': 'R',
    'OU': 'K',
    'TO': '+P',
    'NY': '+L',
    'NK': '+N',
    'NG': '+S',
    'UM': '+B',
    'RY': '+R',
  };

  const char = charMap[pieceType] || '?';
  return owner === 'sente' ? char : char.toLowerCase();
}

/**
 * SFEN文字を駒の種類に変換
 * @param sfenChar SFEN文字
 * @returns { pieceType, owner } 駒の種類と所有者
 */
function sfenCharToPiece(sfenChar: string): { pieceType: PieceType, owner: Player } | null {
  const isSente = sfenChar === sfenChar.toUpperCase();
  const baseChar = sfenChar.toUpperCase();

  const charMap: Record<string, PieceType> = {
    'P': 'FU',
    'L': 'KY',
    'N': 'KE',
    'S': 'GI',
    'G': 'KI',
    'B': 'KA',
    'R': 'HI',
    'K': 'OU',
    '+P': 'TO',
    '+L': 'NY',
    '+N': 'NK',
    '+S': 'NG',
    '+B': 'UM',
    '+R': 'RY',
  };

  const pieceType = charMap[baseChar];
  if (!pieceType) return null;

  return {
    pieceType,
    owner: isSente ? 'sente' : 'gote',
  };
}

/**
 * 盤面をSFEN形式に変換
 * @param board 盤面
 * @param player 現在の手番
 * @param capturedPieces 持ち駒
 * @param moveNumber 手数（オプション、デフォルト1）
 * @returns SFEN文字列
 */
export function boardToSfen(
  board: Board,
  player: Player,
  capturedPieces: CapturedPieces,
  moveNumber: number = 1
): string {
  const parts: string[] = [];

  // 1. 盤面を変換（後手側から先手側へ、つまり row 0 から row 8）
  const boardParts: string[] = [];

  for (let row = 0; row < 9; row++) {
    let rowStr = '';
    let emptyCount = 0;

    for (let col = 8; col >= 0; col--) { // 9筋から1筋へ
      const piece = board[row][col];

      if (piece === null) {
        emptyCount++;
      } else {
        // 空きマスがあれば数字を追加
        if (emptyCount > 0) {
          rowStr += emptyCount.toString();
          emptyCount = 0;
        }
        // 駒を追加
        rowStr += pieceToSfenChar(piece.type, piece.owner);
      }
    }

    // 行末に空きマスがあれば追加
    if (emptyCount > 0) {
      rowStr += emptyCount.toString();
    }

    boardParts.push(rowStr);
  }

  parts.push(boardParts.join('/'));

  // 2. 手番
  parts.push(player === 'sente' ? 'b' : 'w');

  // 3. 持ち駒
  let handStr = '';

  // 先手の持ち駒（大文字、順序: 飛角金銀桂香歩）
  const senteHand = capturedPieces.sente;
  const sentePieceOrder: PieceType[] = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];

  for (const pieceType of sentePieceOrder) {
    const count = senteHand.filter(p => p === pieceType).length;
    if (count > 0) {
      if (count > 1) {
        handStr += count.toString();
      }
      handStr += pieceToSfenChar(pieceType, 'sente');
    }
  }

  // 後手の持ち駒（小文字）
  const goteHand = capturedPieces.gote;

  for (const pieceType of sentePieceOrder) {
    const count = goteHand.filter(p => p === pieceType).length;
    if (count > 0) {
      if (count > 1) {
        handStr += count.toString();
      }
      handStr += pieceToSfenChar(pieceType, 'gote');
    }
  }

  parts.push(handStr || '-');

  // 4. 手数
  parts.push(moveNumber.toString());

  return parts.join(' ');
}

/**
 * SFEN文字列を盤面に変換
 * @param sfen SFEN文字列
 * @returns { board, player, capturedPieces, moveNumber }
 */
export function sfenToBoard(sfen: string): {
  board: Board;
  player: Player;
  capturedPieces: CapturedPieces;
  moveNumber: number;
} {
  const parts = sfen.trim().split(/\s+/);

  if (parts.length < 4) {
    throw new Error('Invalid SFEN format: not enough parts');
  }

  const [boardStr, playerStr, handStr, moveNumberStr] = parts;

  // 1. 盤面を解析
  const board: Board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));

  const rows = boardStr.split('/');
  if (rows.length !== 9) {
    throw new Error('Invalid SFEN format: board must have 9 rows');
  }

  for (let row = 0; row < 9; row++) {
    let col = 8; // 9筋から開始
    let i = 0;

    while (i < rows[row].length && col >= 0) {
      const char = rows[row][i];

      // 数字の場合は空きマス
      if (char >= '1' && char <= '9') {
        const emptyCount = parseInt(char, 10);
        col -= emptyCount;
        i++;
        continue;
      }

      // +付きの成駒の場合
      if (char === '+' && i + 1 < rows[row].length) {
        const promotedChar = '+' + rows[row][i + 1];
        const piece = sfenCharToPiece(promotedChar);

        if (piece) {
          board[row][col] = {
            type: piece.pieceType,
            owner: piece.owner,
          };
          col--;
          i += 2;
          continue;
        }
      }

      // 通常の駒
      const piece = sfenCharToPiece(char);
      if (piece) {
        board[row][col] = {
          type: piece.pieceType,
          owner: piece.owner,
        };
        col--;
      }

      i++;
    }
  }

  // 2. 手番
  const player = playerStr === 'b' ? 'sente' : 'gote';

  // 3. 持ち駒を解析
  const capturedPieces: CapturedPieces = {
    sente: [],
    gote: [],
  };

  if (handStr !== '-') {
    let i = 0;

    while (i < handStr.length) {
      // 数字があれば枚数を取得
      let count = 1;
      if (handStr[i] >= '0' && handStr[i] <= '9') {
        count = parseInt(handStr[i], 10);
        i++;
      }

      // +付きの駒
      if (handStr[i] === '+' && i + 1 < handStr.length) {
        const promotedChar = '+' + handStr[i + 1];
        const piece = sfenCharToPiece(promotedChar);

        if (piece) {
          // 持ち駒は成り駒ではなく元の駒として扱う
          const basePiece = getUnpromotedPiece(piece.pieceType);
          const hand = piece.owner === 'sente' ? capturedPieces.sente : capturedPieces.gote;

          for (let j = 0; j < count; j++) {
            hand.push(basePiece);
          }

          i += 2;
          continue;
        }
      }

      // 通常の駒
      const char = handStr[i];
      const piece = sfenCharToPiece(char);

      if (piece) {
        // 持ち駒は成り駒ではなく元の駒として扱う
        const basePiece = getUnpromotedPiece(piece.pieceType);
        const hand = piece.owner === 'sente' ? capturedPieces.sente : capturedPieces.gote;

        for (let j = 0; j < count; j++) {
          hand.push(basePiece);
        }
      }

      i++;
    }
  }

  // 4. 手数
  const moveNumber = parseInt(moveNumberStr, 10) || 1;

  return {
    board,
    player,
    capturedPieces,
    moveNumber,
  };
}

/**
 * 初期局面のSFEN
 * 後手二段目: 角(col1/8筋)と飛(col7/2筋) → 左から右へ: 1b5r1
 * 先手八段目: 飛(col7/2筋)と角(col1/8筋) → 左から右へ: 1R5B1
 */
export const INITIAL_SFEN = 'lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1';

/**
 * 手をUSI形式に変換（SFEN用）
 * 例: 7g7f (7七の駒を7六に動かす)
 *     P*5e (歩を5五に打つ)
 * @param move 手
 * @returns USI形式の文字列
 */
export function moveToUsi(move: {
  from: { row: number; col: number } | null;
  to: { row: number; col: number };
  piece: PieceType;
  promote?: boolean;
}): string {
  const toCol = 9 - move.to.col; // col: 0-8 → 9-1

  // 持ち駒を打つ場合
  if (move.from === null) {
    const pieceChar = pieceToSfenChar(move.piece, 'sente').toUpperCase();
    return `${pieceChar}*${toCol}${String.fromCharCode(97 + move.to.row)}`;
  }

  // 盤上の駒を動かす場合
  const fromCol = 9 - move.from.col;

  let usiStr = `${fromCol}${String.fromCharCode(97 + move.from.row)}${toCol}${String.fromCharCode(97 + move.to.row)}`;

  // 成る場合は'+'を追加
  if (move.promote) {
    usiStr += '+';
  }

  return usiStr;
}

/**
 * USI形式の手を内部形式に変換
 * @param usi USI形式の文字列
 * @returns Move形式
 */
export function usiToMove(usi: string): {
  from: { row: number; col: number } | null;
  to: { row: number; col: number };
  piece: PieceType;
  promote: boolean;
} | null {
  // 持ち駒を打つ場合 (例: P*5e)
  if (usi.includes('*')) {
    const match = usi.match(/^([A-Z])\*(\d)([a-i])$/);
    if (!match) return null;

    const [, pieceChar, colStr, rowChar] = match;
    const piece = sfenCharToPiece(pieceChar);
    if (!piece) return null;

    const col = 9 - parseInt(colStr, 10); // 9-1 → 0-8
    const row = rowChar.charCodeAt(0) - 97; // a-i → 0-8

    return {
      from: null,
      to: { row, col },
      piece: piece.pieceType,
      promote: false,
    };
  }

  // 盤上の駒を動かす場合 (例: 7g7f, 7g7f+)
  const match = usi.match(/^(\d)([a-i])(\d)([a-i])(\+)?$/);
  if (!match) return null;

  const [, fromColStr, fromRowChar, toColStr, toRowChar, promoteChar] = match;

  const fromCol = 9 - parseInt(fromColStr, 10);
  const fromRow = fromRowChar.charCodeAt(0) - 97;
  const toCol = 9 - parseInt(toColStr, 10);
  const toRow = toRowChar.charCodeAt(0) - 97;

  return {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
    piece: 'FU', // 実際の駒の種類は盤面から取得する必要がある
    promote: promoteChar === '+',
  };
}
