import { describe, it, expect } from 'vitest';
import {
  isNifuViolation,
  isUchifuzumeViolation,
  isRepetitionDraw,
  isValidMove
} from '../validation';
import { Board, Move, Player, CapturedPieces } from '../types';
import { createBoard, createEmptyBoard, setPiece } from './utils';

describe('特殊ルールのテスト', () => {
  describe('二歩違反 (Nifu Violation)', () => {
    // 10 cases
    it('1. 違反: 自分の歩がある筋に歩を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'sente' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(true);
    });

    it('2. 許可: 相手の歩がある筋に歩を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'gote' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('3. 許可: 自分の「と金」がある筋に歩を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'TO', owner: 'sente' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('4. 許可: 歩がない筋に歩を打つ', () => {
      const board = createEmptyBoard();
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('5. 許可: 歩がある筋に歩以外の駒を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'sente' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'KI',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('6. 許可: 盤上の歩を移動させる（打つ操作ではない）', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'sente' };
      const move: Move = {
        from: { row: 6, col: 3 },
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('7. 違反: 後手が自分の歩がある筋に歩を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'gote' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'gote')).toBe(true);
    });

    it('8. 許可: 後手が先手の歩がある筋に歩を打つ', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'FU', owner: 'sente' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'gote')).toBe(false);
    });

    it('9. 許可: 別の筋に歩があっても影響しない', () => {
      const board = createEmptyBoard();
      board[4][3] = { type: 'FU', owner: 'sente' }; // 3筋
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 }, // 4筋
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });

    it('10. 許可: 複数の他の筋に歩があってもターゲット筋になければOK', () => {
      const board = createEmptyBoard();
      board[4][0] = { type: 'FU', owner: 'sente' };
      board[4][8] = { type: 'FU', owner: 'sente' };
      const move: Move = {
        from: null,
        to: { row: 5, col: 4 },
        piece: 'FU',
        promote: false
      };
      expect(isNifuViolation(board, move, 'sente')).toBe(false);
    });
  });

  describe('打ち歩詰め違反 (Uchifuzume Violation)', () => {
    // 5 cases
    it('1. 違反: 歩を打って即詰みになる', () => {
      // 状況: 王が逃げ場なし、歩を打つと詰む
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'KI', owner: 'sente' }; // 金が1,4の歩を支える
      // 逃げ道を塞ぐ
      board[0][3] = { type: 'KY', owner: 'sente' };
      board[0][5] = { type: 'KY', owner: 'sente' };
      board[1][3] = { type: 'KY', owner: 'sente' };
      board[1][5] = { type: 'KY', owner: 'sente' };

      const move: Move = {
        from: null,
        to: { row: 1, col: 4 },
        piece: 'FU',
        promote: false
      };

      expect(isUchifuzumeViolation(board, move, 'sente')).toBe(true);
    });

    it('2. 許可: 歩を打って王手になるが、王が逃げられる', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'KI', owner: 'sente' };
      // 0,3や0,5に逃げられる

      const move: Move = {
        from: null,
        to: { row: 1, col: 4 },
        piece: 'FU',
        promote: false
      };

      expect(isUchifuzumeViolation(board, move, 'sente')).toBe(false);
    });

    it('3. 許可: 歩を打って王手になるが、打った歩を取れる', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'KI', owner: 'sente' };
      // 1,1の飛車が1,4の歩を取れる
      board[1][1] = { type: 'HI', owner: 'gote' };

      const move: Move = {
        from: null,
        to: { row: 1, col: 4 },
        piece: 'FU',
        promote: false
      };

      expect(isUchifuzumeViolation(board, move, 'sente')).toBe(false);
    });

    it('4. 許可: 突き歩詰め（盤上の歩を動かして詰ませる）', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'FU', owner: 'sente' };
      board[3][4] = { type: 'KI', owner: 'sente' };
      // 逃げ道を塞ぐ
      board[0][3] = { type: 'KY', owner: 'sente' };
      board[0][5] = { type: 'KY', owner: 'sente' };

      const move: Move = {
        from: { row: 2, col: 4 },
        to: { row: 1, col: 4 },
        piece: 'FU',
        promote: false
      };

      expect(isUchifuzumeViolation(board, move, 'sente')).toBe(false);
    });

    it('5. 許可: 歩以外の駒を打って詰ませる', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'KI', owner: 'sente' };
      // 逃げ道を塞ぐ
      board[0][3] = { type: 'KY', owner: 'sente' };
      board[0][5] = { type: 'KY', owner: 'sente' };
      board[1][3] = { type: 'KY', owner: 'sente' };
      board[1][5] = { type: 'KY', owner: 'sente' };

      const move: Move = {
        from: null,
        to: { row: 1, col: 4 },
        piece: 'KI', // 金を打つ
        promote: false
      };

      expect(isUchifuzumeViolation(board, move, 'sente')).toBe(false);
    });
  });

  describe('千日手 (Repetition)', () => {
    // 3 cases
    it('1. まだ千日手ではない（1回目・2回目の出現）', () => {
      const history = ['sfen1', 'sfen2'];
      const current = 'sfen1';
      expect(isRepetitionDraw(history, current)).toBe(false);
    });

    it('2. まだ千日手ではない（3回目の出現）', () => {
      const history3 = ['sfen1', 'sfen1', 'sfen1'];
      expect(isRepetitionDraw(history3, 'sfen1')).toBe(false);
    });

    it('3. 千日手成立（4回目の出現）', () => {
      const history = ['sfen1', 'sfen1', 'sfen1', 'sfen1'];
      expect(isRepetitionDraw(history, 'sfen1')).toBe(true);
    });
  });
});
