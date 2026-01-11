import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  cloneBoard,
  applyMove,
  getPromotedPiece,
  isPromoted,
  getUnpromotedPiece,
  canBePromoted,
  isInBounds,
  positionEquals,
  findKing,
} from '../../src/logic/board';
import { Board, Move, Position } from '../../src/logic/types';

describe('board.ts - 盤面管理', () => {
  describe('createInitialBoard - 初期盤面生成', () => {
    it('初期盤面を正しく生成する', () => {
      const board = createInitialBoard();

      // 盤面のサイズが9x9であることを確認
      expect(board).toHaveLength(9);
      expect(board[0]).toHaveLength(9);

      // 後手の駒配置を確認
      expect(board[0][0]).toEqual({ type: 'KY', owner: 'gote' }); // 1筋香
      expect(board[0][4]).toEqual({ type: 'OU', owner: 'gote' }); // 5筋王
      expect(board[1][1]).toEqual({ type: 'HI', owner: 'gote' }); // 2筋飛
      expect(board[1][7]).toEqual({ type: 'KA', owner: 'gote' }); // 8筋角
      expect(board[2][0]).toEqual({ type: 'FU', owner: 'gote' }); // 歩

      // 先手の駒配置を確認
      expect(board[8][0]).toEqual({ type: 'KY', owner: 'sente' }); // 1筋香
      expect(board[8][4]).toEqual({ type: 'OU', owner: 'sente' }); // 5筋王
      expect(board[7][1]).toEqual({ type: 'KA', owner: 'sente' }); // 2筋角
      expect(board[7][7]).toEqual({ type: 'HI', owner: 'sente' }); // 8筋飛
      expect(board[6][0]).toEqual({ type: 'FU', owner: 'sente' }); // 歩

      // 中央が空であることを確認
      expect(board[3][4]).toBeNull();
      expect(board[4][4]).toBeNull();
      expect(board[5][4]).toBeNull();
    });

    it('全ての駒が正しい位置に配置されている', () => {
      const board = createInitialBoard();

      // 後手一段目の全駒を確認
      expect(board[0]).toEqual([
        { type: 'KY', owner: 'gote' },
        { type: 'KE', owner: 'gote' },
        { type: 'GI', owner: 'gote' },
        { type: 'KI', owner: 'gote' },
        { type: 'OU', owner: 'gote' },
        { type: 'KI', owner: 'gote' },
        { type: 'GI', owner: 'gote' },
        { type: 'KE', owner: 'gote' },
        { type: 'KY', owner: 'gote' },
      ]);

      // 先手九段目の全駒を確認
      expect(board[8]).toEqual([
        { type: 'KY', owner: 'sente' },
        { type: 'KE', owner: 'sente' },
        { type: 'GI', owner: 'sente' },
        { type: 'KI', owner: 'sente' },
        { type: 'OU', owner: 'sente' },
        { type: 'KI', owner: 'sente' },
        { type: 'GI', owner: 'sente' },
        { type: 'KE', owner: 'sente' },
        { type: 'KY', owner: 'sente' },
      ]);
    });
  });

  describe('cloneBoard - 盤面のクローン', () => {
    it('盤面を正しくクローンする', () => {
      const original = createInitialBoard();
      const cloned = cloneBoard(original);

      // 内容が同じ
      expect(cloned).toEqual(original);

      // 参照が異なる（ディープコピー）
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it('クローンを変更しても元の盤面は変わらない', () => {
      const original = createInitialBoard();
      const cloned = cloneBoard(original);

      // クローンを変更
      cloned[4][4] = { type: 'FU', owner: 'sente' };

      // 元は変わっていない
      expect(original[4][4]).toBeNull();
      expect(cloned[4][4]).toEqual({ type: 'FU', owner: 'sente' });
    });

    it('空の盤面もクローンできる', () => {
      const empty: Board = Array(9).fill(null).map(() => Array(9).fill(null));
      const cloned = cloneBoard(empty);

      expect(cloned).toEqual(empty);
      expect(cloned).not.toBe(empty);
    });
  });

  describe('applyMove - 手の適用', () => {
    it('通常の移動を正しく適用する', () => {
      const board = createInitialBoard();
      const move: Move = {
        from: { row: 6, col: 6 },
        to: { row: 5, col: 6 },
        piece: 'FU',
        promote: false,
      };

      const newBoard = applyMove(board, move);

      // 移動先に駒がある
      expect(newBoard[5][6]).toEqual({ type: 'FU', owner: 'sente' });

      // 移動元は空
      expect(newBoard[6][6]).toBeNull();

      // 元の盤面は変わっていない
      expect(board[6][6]).toEqual({ type: 'FU', owner: 'sente' });
    });

    it('駒を取る移動を正しく適用する', () => {
      const board = createInitialBoard();

      // テスト用に駒を配置（先手の歩が後手陣に侵入）
      board[3][4] = { type: 'FU', owner: 'sente' };
      board[2][4] = { type: 'FU', owner: 'gote' };

      const move: Move = {
        from: { row: 3, col: 4 },
        to: { row: 2, col: 4 },
        piece: 'FU',
        promote: false,
      };

      const newBoard = applyMove(board, move);

      // 移動先に先手の駒がある
      expect(newBoard[2][4]).toEqual({ type: 'FU', owner: 'sente' });

      // 移動元は空
      expect(newBoard[3][4]).toBeNull();
    });

    it('成る移動を正しく適用する', () => {
      const board = createInitialBoard();

      // テスト用に先手の歩を敵陣手前に配置
      board[1][4] = { type: 'FU', owner: 'sente' };
      board[2][4] = null;

      const move: Move = {
        from: { row: 1, col: 4 },
        to: { row: 0, col: 4 },
        piece: 'FU',
        promote: true,
      };

      const newBoard = applyMove(board, move);

      // 移動先に「と」がある
      expect(newBoard[0][4]).toEqual({ type: 'TO', owner: 'sente' });

      // 移動元は空
      expect(newBoard[1][4]).toBeNull();
    });

    it('持ち駒を打つ手を正しく適用する', () => {
      const board = createInitialBoard();

      // 中央に歩を打つ
      const move: Move = {
        from: null,
        to: { row: 4, col: 4 },
        piece: 'FU',
        promote: false,
      };

      const newBoard = applyMove(board, move);

      // 中央に駒が配置される
      expect(newBoard[4][4]).toEqual({ type: 'FU', owner: 'sente' });
    });

    it('移動元に駒がない場合はエラーを投げる', () => {
      const board = createInitialBoard();

      const move: Move = {
        from: { row: 4, col: 4 }, // 空のマス
        to: { row: 3, col: 4 },
        piece: 'FU',
        promote: false,
      };

      expect(() => applyMove(board, move)).toThrow();
    });
  });

  describe('getPromotedPiece - 駒の成り変換', () => {
    it('歩が「と」になる', () => {
      expect(getPromotedPiece('FU')).toBe('TO');
    });

    it('香が成香になる', () => {
      expect(getPromotedPiece('KY')).toBe('NY');
    });

    it('桂が成桂になる', () => {
      expect(getPromotedPiece('KE')).toBe('NK');
    });

    it('銀が成銀になる', () => {
      expect(getPromotedPiece('GI')).toBe('NG');
    });

    it('角が馬になる', () => {
      expect(getPromotedPiece('KA')).toBe('UM');
    });

    it('飛が竜になる', () => {
      expect(getPromotedPiece('HI')).toBe('RY');
    });

    it('金・王は変わらない', () => {
      expect(getPromotedPiece('KI')).toBe('KI');
      expect(getPromotedPiece('OU')).toBe('OU');
    });

    it('すでに成り駒は変わらない', () => {
      expect(getPromotedPiece('TO')).toBe('TO');
      expect(getPromotedPiece('UM')).toBe('UM');
    });
  });

  describe('isPromoted - 成り駒判定', () => {
    it('成り駒を正しく判定する', () => {
      expect(isPromoted('TO')).toBe(true);
      expect(isPromoted('NY')).toBe(true);
      expect(isPromoted('NK')).toBe(true);
      expect(isPromoted('NG')).toBe(true);
      expect(isPromoted('UM')).toBe(true);
      expect(isPromoted('RY')).toBe(true);
    });

    it('通常の駒はfalse', () => {
      expect(isPromoted('FU')).toBe(false);
      expect(isPromoted('KY')).toBe(false);
      expect(isPromoted('KE')).toBe(false);
      expect(isPromoted('GI')).toBe(false);
      expect(isPromoted('KI')).toBe(false);
      expect(isPromoted('KA')).toBe(false);
      expect(isPromoted('HI')).toBe(false);
      expect(isPromoted('OU')).toBe(false);
    });
  });

  describe('getUnpromotedPiece - 成り駒を元に戻す', () => {
    it('「と」が歩になる', () => {
      expect(getUnpromotedPiece('TO')).toBe('FU');
    });

    it('成香が香になる', () => {
      expect(getUnpromotedPiece('NY')).toBe('KY');
    });

    it('成桂が桂になる', () => {
      expect(getUnpromotedPiece('NK')).toBe('KE');
    });

    it('成銀が銀になる', () => {
      expect(getUnpromotedPiece('NG')).toBe('GI');
    });

    it('馬が角になる', () => {
      expect(getUnpromotedPiece('UM')).toBe('KA');
    });

    it('竜が飛になる', () => {
      expect(getUnpromotedPiece('RY')).toBe('HI');
    });

    it('通常の駒は変わらない', () => {
      expect(getUnpromotedPiece('FU')).toBe('FU');
      expect(getUnpromotedPiece('KI')).toBe('KI');
      expect(getUnpromotedPiece('OU')).toBe('OU');
    });
  });

  describe('canBePromoted - 成れる駒の判定', () => {
    it('成れる駒を正しく判定する', () => {
      expect(canBePromoted('FU')).toBe(true);
      expect(canBePromoted('KY')).toBe(true);
      expect(canBePromoted('KE')).toBe(true);
      expect(canBePromoted('GI')).toBe(true);
      expect(canBePromoted('KA')).toBe(true);
      expect(canBePromoted('HI')).toBe(true);
    });

    it('成れない駒はfalse', () => {
      expect(canBePromoted('KI')).toBe(false);
      expect(canBePromoted('OU')).toBe(false);
      expect(canBePromoted('TO')).toBe(false);
      expect(canBePromoted('UM')).toBe(false);
      expect(canBePromoted('RY')).toBe(false);
    });
  });

  describe('isInBounds - 盤面内判定', () => {
    it('盤面内の位置はtrue', () => {
      expect(isInBounds({ row: 0, col: 0 })).toBe(true);
      expect(isInBounds({ row: 4, col: 4 })).toBe(true);
      expect(isInBounds({ row: 8, col: 8 })).toBe(true);
    });

    it('盤面外の位置はfalse', () => {
      expect(isInBounds({ row: -1, col: 0 })).toBe(false);
      expect(isInBounds({ row: 0, col: -1 })).toBe(false);
      expect(isInBounds({ row: 9, col: 0 })).toBe(false);
      expect(isInBounds({ row: 0, col: 9 })).toBe(false);
      expect(isInBounds({ row: -1, col: -1 })).toBe(false);
      expect(isInBounds({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('positionEquals - 位置の比較', () => {
    it('同じ位置はtrue', () => {
      expect(positionEquals({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe(true);
      expect(positionEquals({ row: 4, col: 5 }, { row: 4, col: 5 })).toBe(true);
    });

    it('異なる位置はfalse', () => {
      expect(positionEquals({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
      expect(positionEquals({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
      expect(positionEquals({ row: 1, col: 2 }, { row: 2, col: 1 })).toBe(false);
    });
  });

  describe('findKing - 王の位置検索', () => {
    it('先手の王を見つける', () => {
      const board = createInitialBoard();
      const kingPos = findKing(board, 'sente');

      expect(kingPos).toEqual({ row: 8, col: 4 });
    });

    it('後手の王を見つける', () => {
      const board = createInitialBoard();
      const kingPos = findKing(board, 'gote');

      expect(kingPos).toEqual({ row: 0, col: 4 });
    });

    it('王がいない場合はnullを返す', () => {
      const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));
      const kingPos = findKing(board, 'sente');

      expect(kingPos).toBeNull();
    });

    it('王が移動した後も正しく見つける', () => {
      const board = createInitialBoard();

      // 王を移動
      board[7][4] = { type: 'OU', owner: 'sente' };
      board[8][4] = null;

      const kingPos = findKing(board, 'sente');
      expect(kingPos).toEqual({ row: 7, col: 4 });
    });
  });
});
