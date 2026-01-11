import { describe, it, expect } from 'vitest';
import { isCheckmate, isKingInCheck } from '../judge';
import { CapturedPieces } from '../types';
import { createBoard, createEmptyBoard } from './utils';

describe('詰み判定テスト (詰将棋)', () => {
  const emptyCaptured: CapturedPieces = { sente: [], gote: [] };

  // 1. 頭金
  it('1. 頭金の詰み', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[1][4] = { type: 'KI', owner: 'sente' };
    // 金の支え（例：香車）
    board[2][4] = { type: 'KY', owner: 'sente' };

    expect(isKingInCheck(board, 'gote')).toBe(true);
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(true);
  });

  // 2. 王手だが詰みではない（逃げられる）
  it('2. 王手だが王が逃げられる', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[1][4] = { type: 'KI', owner: 'sente' };
    // 支えがないため、王が金を取れる

    expect(isKingInCheck(board, 'gote')).toBe(true);
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(false);
  });

  // 3. 王手だが詰みではない（攻撃駒を取れる）
  it('3. 王手だが攻撃駒を取り返せる', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[1][4] = { type: 'KI', owner: 'sente' };
    board[2][4] = { type: 'KY', owner: 'sente' }; // 支え

    // 後手の飛車が金を横から取れる
    board[1][1] = { type: 'HI', owner: 'gote' };

    expect(isKingInCheck(board, 'gote')).toBe(true);
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(false);
  });

  // 4. 王手だが詰みではない（合駒ができる）
  it('4. 王手だが合駒ができる（遠距離攻撃）', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[4][4] = { type: 'HI', owner: 'sente' }; // 遠くからの飛車王手

    // 後手は歩を持っているため、合駒ができる
    const captured: CapturedPieces = { sente: [], gote: ['FU'] };

    expect(isKingInCheck(board, 'gote')).toBe(true);
    expect(isCheckmate(board, 'gote', captured)).toBe(false);
  });

  // 5. 包囲＋桂馬による詰み（吊るし桂的な形）
  it('5. 詰み: 自陣の駒で包囲され、桂馬で王手', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    // 自分の駒で退路が塞がれている
    board[0][3] = { type: 'FU', owner: 'gote' };
    board[0][5] = { type: 'FU', owner: 'gote' };
    // 1,3に歩がいると2,3の桂馬を取れてしまうので、後手の桂馬を置いて塞ぐ
    board[1][3] = { type: 'KE', owner: 'gote' };
    board[1][4] = { type: 'FU', owner: 'gote' };
    board[1][5] = { type: 'FU', owner: 'gote' };

    // 桂馬による王手
    board[2][3] = { type: 'KE', owner: 'sente' }; // 0,4を攻撃

    expect(isKingInCheck(board, 'gote')).toBe(true);
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(true);
  });

  // 6. 腹銀（詰みではない、下がれる）
  it('6. 詰みではない: 腹銀、王が下がれる', () => {
    const board = createEmptyBoard();
    board[1][4] = { type: 'OU', owner: 'gote' }; // 少し前に出ている
    board[2][4] = { type: 'GI', owner: 'sente' };
    board[3][4] = { type: 'KY', owner: 'sente' }; // 支え

    // 王は 0,3 0,4 0,5 に下がれる
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(false);
  });

  // 7. 腹金（端での詰み）
  it('7. 詰み: 端での腹金', () => {
    const board = createEmptyBoard();
    board[0][0] = { type: 'OU', owner: 'gote' }; // 隅
    board[0][1] = { type: 'KI', owner: 'sente' }; // 横からの金
    board[1][1] = { type: 'GI', owner: 'sente' }; // 斜め後ろの銀が金を支えつつ、逃げ道を封鎖

    // 1,0への逃げ道を塞ぐ
    board[1][0] = { type: 'FU', owner: 'gote' };

    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(true);
  });

  // 8. 必至（次で詰むが現在は詰みではない）
  it('8. 詰みではない: 必至（次は詰むが現在は王手ではない）', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    // 王手はかかっていない

    expect(isKingInCheck(board, 'gote')).toBe(false);
    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(false);
  });

  // 9. ピンによる防御不能（詰み）
  it('9. 詰み: 防御駒がピンされている', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[1][4] = { type: 'KI', owner: 'sente' }; // 金による王手
    board[2][4] = { type: 'KY', owner: 'sente' }; // 支え

    // 0,3の金は通常なら1,4の金を取れる
    board[0][3] = { type: 'KI', owner: 'gote' };

    // しかし、0,0の飛車にピンされている（動くと王手になる）
    board[0][0] = { type: 'HI', owner: 'sente' };

    // 退路封鎖
    board[0][5] = { type: 'KY', owner: 'sente' };
    board[1][3] = { type: 'GI', owner: 'sente' };
    board[1][5] = { type: 'GI', owner: 'sente' };

    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(true);
  });

  // 10. 持ち駒を打って詰み
  it('10. 詰み: 持ち駒の金を打って詰み', () => {
    const board = createEmptyBoard();
    board[0][4] = { type: 'OU', owner: 'gote' };
    board[0][3] = { type: 'RY', owner: 'sente' };
    board[0][5] = { type: 'RY', owner: 'sente' };
    board[1][3] = { type: 'RY', owner: 'sente' };
    board[1][5] = { type: 'RY', owner: 'sente' };

    // ここでは isCheckmate 関数自体のテストなので、
    // 「金を打った後の盤面」を作成して渡す

    // 金を1,4に配置（打った状態）
    board[1][4] = { type: 'KI', owner: 'sente' };
    // 支え
    board[2][4] = { type: 'KY', owner: 'sente' };

    expect(isCheckmate(board, 'gote', emptyCaptured)).toBe(true);
  });
});
