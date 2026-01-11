import { describe, it, expect } from 'vitest';
import {
  getPieceMovementPattern,
  getLegalMoves,
  canPromote,
} from '../moves';
import { Piece, PieceType, Player } from '../types';
import { createBoard, createEmptyBoard } from './utils';

describe('moves.ts - 駒の移動と成り判定の網羅的テスト', () => {
  describe('駒の移動パターン（14種類）', () => {
    // 1. FU (歩)
    describe('歩 (FU)', () => {
      it('先手の歩は前方に1マス移動できる', () => {
        const { moves } = getPieceMovementPattern('FU', { row: 4, col: 4 }, 'sente');
        expect(moves).toHaveLength(1);
        expect(moves).toContainEqual({ row: 3, col: 4 });
      });
      it('後手の歩は前方に1マス移動できる', () => {
        const { moves } = getPieceMovementPattern('FU', { row: 4, col: 4 }, 'gote');
        expect(moves).toHaveLength(1);
        expect(moves).toContainEqual({ row: 5, col: 4 });
      });
    });

    // 2. KY (香)
    describe('香車 (KY)', () => {
      it('先手の香車は前方に複数マス移動できる（飛び道具）', () => {
        const { moves, isRanged } = getPieceMovementPattern('KY', { row: 8, col: 0 }, 'sente');
        expect(isRanged).toBe(true);
        expect(moves).toContainEqual({ row: 0, col: 0 });
      });
      it('後手の香車は前方に複数マス移動できる（飛び道具）', () => {
        const { moves, isRanged } = getPieceMovementPattern('KY', { row: 0, col: 0 }, 'gote');
        expect(isRanged).toBe(true);
        expect(moves).toContainEqual({ row: 8, col: 0 });
      });
    });

    // 3. KE (桂)
    describe('桂馬 (KE)', () => {
      it('先手の桂馬は前方2マス・左右1マスに移動できる', () => {
        const { moves } = getPieceMovementPattern('KE', { row: 4, col: 4 }, 'sente');
        expect(moves).toHaveLength(2);
        expect(moves).toContainEqual({ row: 2, col: 3 });
        expect(moves).toContainEqual({ row: 2, col: 5 });
      });
      it('後手の桂馬は前方2マス・左右1マスに移動できる', () => {
        const { moves } = getPieceMovementPattern('KE', { row: 4, col: 4 }, 'gote');
        expect(moves).toHaveLength(2);
        expect(moves).toContainEqual({ row: 6, col: 3 });
        expect(moves).toContainEqual({ row: 6, col: 5 });
      });
    });

    // 4. GI (銀)
    describe('銀将 (GI)', () => {
      it('先手の銀は5方向（前方3方向＋斜め後ろ2方向）に移動できる', () => {
        const { moves } = getPieceMovementPattern('GI', { row: 4, col: 4 }, 'sente');
        expect(moves).toHaveLength(5);
        expect(moves).toContainEqual({ row: 3, col: 4 }); // 前
        expect(moves).toContainEqual({ row: 3, col: 3 }); // 左前
        expect(moves).toContainEqual({ row: 3, col: 5 }); // 右前
        expect(moves).toContainEqual({ row: 5, col: 3 }); // 左後ろ
        expect(moves).toContainEqual({ row: 5, col: 5 }); // 右後ろ
      });
    });

    // 5. KI (金)
    describe('金将 (KI)', () => {
      it('先手の金は6方向（前方3方向＋左右＋真後ろ）に移動できる', () => {
        const { moves } = getPieceMovementPattern('KI', { row: 4, col: 4 }, 'sente');
        expect(moves).toHaveLength(6);
        expect(moves).toContainEqual({ row: 3, col: 4 }); // 前
        expect(moves).toContainEqual({ row: 3, col: 3 }); // 左前
        expect(moves).toContainEqual({ row: 3, col: 5 }); // 右前
        expect(moves).toContainEqual({ row: 4, col: 3 }); // 左
        expect(moves).toContainEqual({ row: 4, col: 5 }); // 右
        expect(moves).toContainEqual({ row: 5, col: 4 }); // 後ろ
      });
    });

    // 6. KA (角)
    describe('角行 (KA)', () => {
      it('角は斜め4方向にどこまでも移動できる', () => {
        const { moves, isRanged } = getPieceMovementPattern('KA', { row: 4, col: 4 }, 'sente');
        expect(isRanged).toBe(true);
        expect(moves).toContainEqual({ row: 0, col: 0 }); // 左上
        expect(moves).toContainEqual({ row: 0, col: 8 }); // 右上
        expect(moves).toContainEqual({ row: 8, col: 0 }); // 左下
        expect(moves).toContainEqual({ row: 8, col: 8 }); // 右下
      });
    });

    // 7. HI (飛)
    describe('飛車 (HI)', () => {
      it('飛車は縦横4方向にどこまでも移動できる', () => {
        const { moves, isRanged } = getPieceMovementPattern('HI', { row: 4, col: 4 }, 'sente');
        expect(isRanged).toBe(true);
        expect(moves).toContainEqual({ row: 0, col: 4 }); // 上
        expect(moves).toContainEqual({ row: 8, col: 4 }); // 下
        expect(moves).toContainEqual({ row: 4, col: 0 }); // 左
        expect(moves).toContainEqual({ row: 4, col: 8 }); // 右
      });
    });

    // 8. OU (王)
    describe('王将 (OU)', () => {
      it('王は全8方向に1マスずつ移動できる', () => {
        const { moves } = getPieceMovementPattern('OU', { row: 4, col: 4 }, 'sente');
        expect(moves).toHaveLength(8);
      });
    });

    // 9-12. 成り駒 (TO, NY, NK, NG)
    describe('金と同じ動きをする成り駒 (TO, NY, NK, NG)', () => {
      const types: PieceType[] = ['TO', 'NY', 'NK', 'NG'];
      types.forEach(type => {
        it(`${type} は金と同じ動きをする`, () => {
           const { moves } = getPieceMovementPattern(type, { row: 4, col: 4 }, 'sente');
           const goldMoves = getPieceMovementPattern('KI', { row: 4, col: 4 }, 'sente').moves;
           expect(moves).toHaveLength(goldMoves.length);
           goldMoves.forEach(m => expect(moves).toContainEqual(m));
        });
      });
    });

    // 13. UM (馬)
    describe('竜馬 (UM)', () => {
      it('馬は角の動き＋上下左右1マスに移動できる', () => {
        const { moves } = getPieceMovementPattern('UM', { row: 4, col: 4 }, 'sente');
        expect(moves).toContainEqual({ row: 0, col: 0 }); // 角の動き
        expect(moves).toContainEqual({ row: 3, col: 4 }); // 上
        expect(moves).toContainEqual({ row: 5, col: 4 }); // 下
        expect(moves).toContainEqual({ row: 4, col: 3 }); // 左
        expect(moves).toContainEqual({ row: 4, col: 5 }); // 右
      });
    });

    // 14. RY (竜)
    describe('竜王 (RY)', () => {
      it('竜は飛車の動き＋斜め1マスに移動できる', () => {
        const { moves } = getPieceMovementPattern('RY', { row: 4, col: 4 }, 'sente');
        expect(moves).toContainEqual({ row: 0, col: 4 }); // 飛車の動き
        expect(moves).toContainEqual({ row: 3, col: 3 }); // 左上
        expect(moves).toContainEqual({ row: 3, col: 5 }); // 右上
        expect(moves).toContainEqual({ row: 5, col: 3 }); // 左下
        expect(moves).toContainEqual({ row: 5, col: 5 }); // 右下
      });
    });
  });

  describe('合法手の判定（正常系・異常系）', () => {
    it('正常系: 空いているマスへの移動', () => {
      const board = createEmptyBoard();
      // 先手歩を6,4に配置
      board[6][4] = { type: 'FU', owner: 'sente' };
      // 王を配置して盤面を有効にする
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const moves = getLegalMoves(board, { row: 6, col: 4 });
      expect(moves).toContainEqual({ row: 5, col: 4 });
    });

    it('捕獲: 相手の駒があるマスへの移動', () => {
      const board = createEmptyBoard();
      board[6][4] = { type: 'FU', owner: 'sente' };
      board[5][4] = { type: 'FU', owner: 'gote' }; // 相手の駒
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const moves = getLegalMoves(board, { row: 6, col: 4 });
      expect(moves).toContainEqual({ row: 5, col: 4 });
    });

    it('ブロック: 味方の駒があるマスへは移動できない', () => {
      const board = createEmptyBoard();
      board[6][4] = { type: 'FU', owner: 'sente' };
      board[5][4] = { type: 'FU', owner: 'sente' }; // 味方の駒
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const moves = getLegalMoves(board, { row: 6, col: 4 });
      expect(moves).not.toContainEqual({ row: 5, col: 4 });
      expect(moves).toHaveLength(0);
    });

    it('盤外: 盤面外へは移動できない', () => {
      const board = createEmptyBoard();
      board[0][0] = { type: 'OU', owner: 'sente' };
      const moves = getLegalMoves(board, { row: 0, col: 0 });
      // 通常(0,1), (1,0), (1,1)のみ
      expect(moves).toHaveLength(3);
      const invalid = moves.find(m => m.row < 0 || m.col < 0);
      expect(invalid).toBeUndefined();
    });

    it('飛び道具ブロック: 飛車が味方の駒にブロックされる', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'HI', owner: 'sente' };
      board[4][6] = { type: 'FU', owner: 'sente' }; // 右側に味方
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });
      // 4,5には移動可
      expect(moves).toContainEqual({ row: 4, col: 5 });
      // 4,6(味方)には移動不可
      expect(moves).not.toContainEqual({ row: 4, col: 6 });
      // 4,7(ブロックの奥)には移動不可
      expect(moves).not.toContainEqual({ row: 4, col: 7 });
    });
  });

  describe('成り判定ロジック (canPromote)', () => {
    describe('強制成り (required)', () => {
      it('先手の歩が一段目に行く場合', () => {
        const piece: Piece = { type: 'FU', owner: 'sente' };
        expect(canPromote(piece, { row: 1, col: 0 }, { row: 0, col: 0 }, 'sente')).toBe('required');
      });

      it('先手の香車が一段目に行く場合', () => {
        const piece: Piece = { type: 'KY', owner: 'sente' };
        expect(canPromote(piece, { row: 1, col: 0 }, { row: 0, col: 0 }, 'sente')).toBe('required');
      });

      it('先手の桂馬が二段目以内に行く場合', () => {
        const piece: Piece = { type: 'KE', owner: 'sente' };
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 1, col: 0 }, 'sente')).toBe('required');
      });

      it('後手の歩が九段目に行く場合', () => {
        const piece: Piece = { type: 'FU', owner: 'gote' };
        expect(canPromote(piece, { row: 7, col: 0 }, { row: 8, col: 0 }, 'gote')).toBe('required');
      });
    });

    describe('任意成り (optional)', () => {
      it('敵陣に入る移動（例：銀が三段目へ）', () => {
        const piece: Piece = { type: 'GI', owner: 'sente' };
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 2, col: 0 }, 'sente')).toBe('optional');
      });

      it('敵陣内での移動（例：銀が二段目から一段目へ）', () => {
        const piece: Piece = { type: 'GI', owner: 'sente' };
        expect(canPromote(piece, { row: 1, col: 0 }, { row: 0, col: 1 }, 'sente')).toBe('optional');
      });

      it('敵陣から出る移動（例：銀が三段目から四段目へ）', () => {
        const piece: Piece = { type: 'GI', owner: 'sente' };
        expect(canPromote(piece, { row: 2, col: 0 }, { row: 3, col: 0 }, 'sente')).toBe('optional');
      });
    });

    describe('成り不可 (forbidden)', () => {
      it('金は成れない', () => {
        const piece: Piece = { type: 'KI', owner: 'sente' };
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 2, col: 0 }, 'sente')).toBe('forbidden');
      });

      it('王は成れない', () => {
        const piece: Piece = { type: 'OU', owner: 'sente' };
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 2, col: 0 }, 'sente')).toBe('forbidden');
      });

      it('既に成っている駒は成れない', () => {
        const piece: Piece = { type: 'TO', owner: 'sente' };
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 2, col: 0 }, 'sente')).toBe('forbidden');
      });

      it('敵陣に関係ない移動は成れない', () => {
        const piece: Piece = { type: 'GI', owner: 'sente' };
        // 四段目から五段目へ
        expect(canPromote(piece, { row: 3, col: 0 }, { row: 4, col: 0 }, 'sente')).toBe('forbidden');
      });
    });
  });
});
