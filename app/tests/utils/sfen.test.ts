import { describe, it, expect } from 'vitest';
import {
  boardToSfen,
  sfenToBoard,
  INITIAL_SFEN,
  moveToUsi,
  usiToMove,
} from '../../src/utils/sfen';
import { createInitialBoard } from '../../src/logic/board';
import { Board, CapturedPieces, PieceType } from '../../src/logic/types';

describe('sfen.ts - SFEN形式の変換', () => {
  // 空の盤面を作成するヘルパー
  const createEmptyBoard = (): Board => {
    return Array(9).fill(null).map(() => Array(9).fill(null));
  };

  describe('boardToSfen - 盤面をSFEN形式に変換', () => {
    it('初期盤面を正しくSFEN形式に変換する', () => {
      const board = createInitialBoard();
      const capturedPieces: CapturedPieces = { sente: [], gote: [] };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      expect(sfen).toBe(INITIAL_SFEN);
    });

    it('空の盤面をSFEN形式に変換する', () => {
      const board = createEmptyBoard();
      const capturedPieces: CapturedPieces = { sente: [], gote: [] };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      expect(sfen).toBe('9/9/9/9/9/9/9/9/9 b - 1');
    });

    it('持ち駒ありの盤面をSFEN形式に変換する', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = {
        sente: ['FU', 'FU', 'KI'],
        gote: ['KA', 'HI'],
      };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 5);

      // 持ち駒の表記: G2P（先手の金1枚+歩2枚）、rb（後手の飛車+角）
      // 順序: 飛角金銀桂香歩
      expect(sfen).toContain('G2P'); // 金が先、歩が後
      expect(sfen).toContain('rb'); // 飛車が先、角が後
      expect(sfen).toContain(' b ');
      expect(sfen).toContain(' 5');
    });

    it('後手番の盤面をSFEN形式に変換する', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = { sente: [], gote: [] };

      const sfen = boardToSfen(board, 'gote', capturedPieces, 10);

      expect(sfen).toContain(' w ');
      expect(sfen).toContain(' 10');
    });

    it('成り駒を含む盤面をSFEN形式に変換する', () => {
      const board = createEmptyBoard();
      board[2][4] = { type: 'TO', owner: 'sente' }; // と
      board[3][3] = { type: 'RY', owner: 'sente' }; // 竜
      board[3][5] = { type: 'UM', owner: 'gote' }; // 馬
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = { sente: [], gote: [] };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      expect(sfen).toContain('+P'); // と
      expect(sfen).toContain('+R'); // 竜
      expect(sfen).toContain('+b'); // 馬（後手）
    });

    it('複数の持ち駒を正しい順序でSFEN形式に変換する', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = {
        sente: ['FU', 'KY', 'KE', 'GI', 'KI', 'KA', 'HI'],
        gote: [],
      };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      // 持ち駒の順序: 飛角金銀桂香歩
      expect(sfen).toMatch(/RBGSNLP/);
    });

    it('同じ種類の持ち駒が複数ある場合は数字で表記', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = {
        sente: ['FU', 'FU', 'FU', 'FU', 'FU'], // 歩5枚
        gote: [],
      };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      expect(sfen).toContain('5P');
    });
  });

  describe('sfenToBoard - SFEN形式を盤面に変換', () => {
    it('初期盤面のSFENを正しく盤面に変換する', () => {
      const result = sfenToBoard(INITIAL_SFEN);

      expect(result.player).toBe('sente');
      expect(result.moveNumber).toBe(1);
      expect(result.capturedPieces.sente).toHaveLength(0);
      expect(result.capturedPieces.gote).toHaveLength(0);

      // 駒の配置を確認
      expect(result.board[0][4]).toEqual({ type: 'OU', owner: 'gote' });
      expect(result.board[8][4]).toEqual({ type: 'OU', owner: 'sente' });
      expect(result.board[1][1]).toEqual({ type: 'HI', owner: 'gote' });
      expect(result.board[7][7]).toEqual({ type: 'HI', owner: 'sente' });
    });

    it('空の盤面のSFENを正しく変換する', () => {
      const sfen = '9/9/9/9/9/9/9/9/9 b - 1';
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('sente');
      expect(result.moveNumber).toBe(1);

      // 全マスが空
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          expect(result.board[row][col]).toBeNull();
        }
      }
    });

    it('持ち駒ありのSFENを正しく変換する', () => {
      const sfen = '9/9/9/9/4k4/9/9/9/4K4 b 2P1Gbr 5';
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('sente');
      expect(result.moveNumber).toBe(5);
      expect(result.capturedPieces.sente).toContain('FU');
      expect(result.capturedPieces.sente).toContain('KI');
      expect(result.capturedPieces.sente.filter(p => p === 'FU')).toHaveLength(2);
      expect(result.capturedPieces.gote).toContain('KA');
      expect(result.capturedPieces.gote).toContain('HI');
    });

    it('後手番のSFENを正しく変換する', () => {
      const sfen = '9/9/9/9/4k4/9/9/9/4K4 w - 10';
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('gote');
      expect(result.moveNumber).toBe(10);
    });

    it('成り駒を含むSFENを正しく変換する', () => {
      const sfen = '9/9/9/9/4+P4/9/9/9/4K4 b - 1';
      const result = sfenToBoard(sfen);

      expect(result.board[4][4]).toEqual({ type: 'TO', owner: 'sente' });
    });

    it('複雑な盤面のSFENを正しく変換する', () => {
      const sfen = 'l6nl/5+P1gk/2np1S3/p1p4Pp/3P2Sp1/1PPb2P1P/P5GS1/R8/LN4bKL w GR5pnsg 1';
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('gote');
      expect(result.board[0][8]).toEqual({ type: 'KY', owner: 'gote' });
      expect(result.board[1][3]).toEqual({ type: 'TO', owner: 'sente' }); // +P
    });
  });

  describe('boardToSfen と sfenToBoard の双方向変換', () => {
    it('初期盤面の往復変換で同じ結果になる', () => {
      const board = createInitialBoard();
      const capturedPieces: CapturedPieces = { sente: [], gote: [] };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('sente');
      expect(result.moveNumber).toBe(1);
      expect(result.board).toEqual(board);
    });

    it('持ち駒ありの盤面の往復変換で同じ結果になる', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[4][4] = { type: 'FU', owner: 'sente' };

      const capturedPieces: CapturedPieces = {
        sente: ['KI', 'GI'],
        gote: ['KA'],
      };

      const sfen = boardToSfen(board, 'gote', capturedPieces, 25);
      const result = sfenToBoard(sfen);

      expect(result.player).toBe('gote');
      expect(result.moveNumber).toBe(25);
      expect(result.board).toEqual(board);
      expect(result.capturedPieces.sente).toContain('KI');
      expect(result.capturedPieces.sente).toContain('GI');
      expect(result.capturedPieces.gote).toContain('KA');
    });
  });

  describe('moveToUsi - 手をUSI形式に変換', () => {
    it('通常の移動をUSI形式に変換する', () => {
      const move = {
        from: { row: 6, col: 6 }, // 7七
        to: { row: 5, col: 6 },   // 7六
        piece: 'FU' as PieceType,
        promote: false,
      };

      const usi = moveToUsi(move);

      expect(usi).toBe('3g3f');
    });

    it('成る移動をUSI形式に変換する', () => {
      const move = {
        from: { row: 1, col: 6 },
        to: { row: 0, col: 6 },
        piece: 'FU' as PieceType,
        promote: true,
      };

      const usi = moveToUsi(move);

      expect(usi).toBe('3b3a+');
    });

    it('持ち駒を打つ手をUSI形式に変換する', () => {
      const move = {
        from: null,
        to: { row: 4, col: 4 }, // 5五
        piece: 'FU' as PieceType,
        promote: false,
      };

      const usi = moveToUsi(move);

      expect(usi).toBe('P*5e');
    });

    it('角を打つ手をUSI形式に変換する', () => {
      const move = {
        from: null,
        to: { row: 7, col: 1 }, // 2八
        piece: 'KA' as PieceType,
        promote: false,
      };

      const usi = moveToUsi(move);

      expect(usi).toBe('B*8h');
    });
  });

  describe('usiToMove - USI形式を手に変換', () => {
    it('通常の移動をUSI形式から変換する', () => {
      const usi = '7g7f';
      const move = usiToMove(usi);

      expect(move).not.toBeNull();
      expect(move?.from).toEqual({ row: 6, col: 2 }); // 7筋はcol=2 (9-7=2)
      expect(move?.to).toEqual({ row: 5, col: 2 });
      expect(move?.promote).toBe(false);
    });

    it('成る移動をUSI形式から変換する', () => {
      const usi = '2b2a+';
      const move = usiToMove(usi);

      expect(move).not.toBeNull();
      expect(move?.promote).toBe(true);
    });

    it('持ち駒を打つ手をUSI形式から変換する', () => {
      const usi = 'P*5e';
      const move = usiToMove(usi);

      expect(move).not.toBeNull();
      expect(move?.from).toBeNull();
      expect(move?.to).toEqual({ row: 4, col: 4 });
      expect(move?.piece).toBe('FU');
    });

    it('不正なUSI形式はnullを返す', () => {
      const usi = 'invalid';
      const move = usiToMove(usi);

      expect(move).toBeNull();
    });
  });

  describe('INITIAL_SFEN 定数', () => {
    it('初期局面のSFEN定数が正しい', () => {
      expect(INITIAL_SFEN).toBe('lnsgkgsnl/1b5r1/ppppppppp/9/9/9/PPPPPPPPP/1R5B1/LNSGKGSNL b - 1');
    });

    it('INITIAL_SFENから初期盤面を復元できる', () => {
      const result = sfenToBoard(INITIAL_SFEN);

      expect(result.player).toBe('sente');
      expect(result.moveNumber).toBe(1);

      // 重要な駒の配置を確認
      expect(result.board[0][4]).toEqual({ type: 'OU', owner: 'gote' });
      expect(result.board[8][4]).toEqual({ type: 'OU', owner: 'sente' });
      expect(result.board[0][0]).toEqual({ type: 'KY', owner: 'gote' });
      expect(result.board[8][8]).toEqual({ type: 'KY', owner: 'sente' });
      expect(result.board[2][4]).toEqual({ type: 'FU', owner: 'gote' });
      expect(result.board[6][4]).toEqual({ type: 'FU', owner: 'sente' });
    });
  });

  describe('特殊なSFEN形式のテスト', () => {
    it('1筋の駒配置を正しく変換する', () => {
      const board = createEmptyBoard();
      board[8][0] = { type: 'KY', owner: 'sente' }; // 1九香
      board[0][0] = { type: 'KY', owner: 'gote' };  // 1一香

      const capturedPieces: CapturedPieces = { sente: [], gote: [] };
      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      const result = sfenToBoard(sfen);

      expect(result.board[8][0]).toEqual({ type: 'KY', owner: 'sente' });
      expect(result.board[0][0]).toEqual({ type: 'KY', owner: 'gote' });
    });

    it('9筋の駒配置を正しく変換する', () => {
      const board = createEmptyBoard();
      board[8][8] = { type: 'KY', owner: 'sente' }; // 9九香
      board[0][8] = { type: 'KY', owner: 'gote' };  // 9一香

      const capturedPieces: CapturedPieces = { sente: [], gote: [] };
      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      const result = sfenToBoard(sfen);

      expect(result.board[8][8]).toEqual({ type: 'KY', owner: 'sente' });
      expect(result.board[0][8]).toEqual({ type: 'KY', owner: 'gote' });
    });

    it('持ち駒が1枚の場合は数字を省略する', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = {
        sente: ['FU'], // 歩1枚
        gote: [],
      };

      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      // 1枚の場合は数字なし
      expect(sfen).toMatch(/\sP[^0-9]/);
      expect(sfen).not.toContain('1P');
    });

    it('全ての種類の成り駒を正しく変換する', () => {
      const board = createEmptyBoard();
      board[4][0] = { type: 'TO', owner: 'sente' };
      board[4][1] = { type: 'NY', owner: 'sente' };
      board[4][2] = { type: 'NK', owner: 'sente' };
      board[4][3] = { type: 'NG', owner: 'sente' };
      board[4][4] = { type: 'UM', owner: 'sente' };
      board[4][5] = { type: 'RY', owner: 'sente' };
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const capturedPieces: CapturedPieces = { sente: [], gote: [] };
      const sfen = boardToSfen(board, 'sente', capturedPieces, 1);

      expect(sfen).toContain('+P'); // と
      expect(sfen).toContain('+L'); // 成香
      expect(sfen).toContain('+N'); // 成桂
      expect(sfen).toContain('+S'); // 成銀
      expect(sfen).toContain('+B'); // 馬
      expect(sfen).toContain('+R'); // 竜
    });
  });
});
